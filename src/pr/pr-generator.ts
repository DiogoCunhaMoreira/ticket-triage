import { ai } from "../gemini.js";
import type { Changeset, PullRequestContent, CommitType } from "./pr-schema.js";

/**
 * T011: Detect conventional commit type from commits and file changes
 * Analyzes commit messages and changes to determine the most appropriate type
 */
export function detectCommitType(changeset: Changeset): CommitType {
  const commitMessages = changeset.commits.map((c) => c.message.toLowerCase());

  // Priority order: check commit messages for explicit types
  const typePatterns: Record<CommitType, RegExp[]> = {
    feat: [/^feat[:(]/, /feature/, /add\s+new/, /implement/],
    fix: [/^fix[:(]/, /bug/, /issue/, /patch/, /repair/],
    refactor: [/^refactor[:(]/, /refactor/, /restructure/, /reorganize/],
    docs: [/^docs[:(]/, /documentation/, /readme/, /comment/],
    style: [/^style[:(]/, /format/, /lint/, /prettier/],
    test: [/^test[:(]/, /test/, /spec/, /coverage/],
    chore: [/^chore[:(]/, /dep/, /dependencies/, /package/, /build/, /config/],
    perf: [/^perf[:(]/, /performance/, /optimi[sz]e/, /speed/],
    ci: [/^ci[:(]/, /pipeline/, /workflow/, /github actions/, /\.yml/],
  };

  // Check each type in priority order
  for (const [type, patterns] of Object.entries(typePatterns)) {
    for (const pattern of patterns) {
      if (commitMessages.some((msg) => pattern.test(msg))) {
        return type as CommitType;
      }
    }
  }

  // Fallback: analyze file types
  const hasTests = changeset.files.some((f) =>
    /\.(test|spec)\.(ts|js|tsx|jsx)$/.test(f.path)
  );
  if (hasTests) return "test";

  const hasDocs = changeset.files.some((f) =>
    /\.(md|txt|rst)$/.test(f.path) || /^docs\//.test(f.path)
  );
  if (hasDocs) return "docs";

  const hasCI = changeset.files.some((f) => /\.(yml|yaml)$/.test(f.path));
  if (hasCI) return "ci";

  // Default to feat for new functionality
  const hasNewFiles = changeset.files.some((f) => f.status === "added");
  if (hasNewFiles) return "feat";

  // Default to refactor if only modifications
  return "refactor";
}

/**
 * T009/T010: Generate PR content using Gemini AI
 * Creates title and body following conventional commits and best practices
 */
export async function generatePRContent(
  changeset: Changeset
): Promise<PullRequestContent> {
  const commitType = detectCommitType(changeset);

  // Build context for AI prompt
  const filesSummary = changeset.files
    .map(
      (f) =>
        `- ${f.status.toUpperCase()}: ${f.path} (+${f.additions} -${f.deletions})`
    )
    .join("\n");

  const commitsSummary = changeset.commits
    .map((c) => `- ${c.sha.substring(0, 7)}: ${c.message.split("\n")[0]}`)
    .join("\n");

  // T012: AI prompt specifying bullet points format, no code snippets
  const prompt = `You are a technical writer helping create a pull request description.

Analyze these git changes and generate a professional PR description following these guidelines from best practices:

CHANGES:
${filesSummary}

COMMITS:
${commitsSummary}

REQUIREMENTS:
1. Title: Use conventional commits format: "${commitType}: <concise description>"
   - Title should be 50-80 characters
   - Start with lowercase after colon
   - No period at end

2. Body: Create exactly 4 sections with Markdown headers:
   
   ## Problem
   2-3 sentences explaining WHY this change is needed. What problem does it solve?
   
   ## Solution
   - Bullet point summary of key changes (NO CODE SNIPPETS)
   - Each bullet should be a high-level description
   - 3-7 bullet points maximum
   
   ## Technical Details
   - Implementation notes as bullet points
   - Mention important architectural decisions
   - Highlight any breaking changes or migrations needed
   - 3-7 bullet points maximum
   
   ## Testing
   Steps to test/verify the changes:
   1. Step-by-step numbered list
   2. How to run tests or verify manually
   3-5 steps maximum

CRITICAL:
- DO NOT wrap the output in markdown code blocks (no \`\`\` markers)
- Return ONLY the title on the first line, followed by the body
- Use descriptive BULLET POINTS only (no code blocks, no code snippets in the body)
- Body must be Markdown formatted with ## headers
- Be professional and concise
- Focus on what changed and why, not how (high-level)

OUTPUT FORMAT:
Line 1: Title in format "${commitType}: description"
Line 2: (blank line)
Lines 3+: Body with the 4 markdown sections

Generate the PR description now:`;

  try {
    // Call Gemini API
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "text/plain",
      },
    });

    const generatedText = response.text?.trim() || "";

    // Debug: Log raw response if needed
    if (process.env.DEBUG_PR_GEN === "true") {
      console.log("\n=== Raw AI Response ===");
      console.log(generatedText);
      console.log("=== End Raw Response ===\n");
    }

    // Remove markdown code blocks if present
    let cleanText = generatedText;
    if (cleanText.startsWith("```")) {
      // Remove opening and closing code fences
      cleanText = cleanText.replace(/^```(\w+)?\n/, "").replace(/\n```$/, "").trim();
    }

    // Split into lines
    const lines = cleanText.split("\n");
    let title = "";
    let body = "";

    // Find the title: first line that looks like a conventional commit title
    const conventionalCommitPattern = /^(feat|fix|refactor|docs|style|test|chore|perf|ci):/;
    let titleLineIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i]?.trim() || "";
      
      // Skip empty lines and markdown code fences
      if (!trimmed || trimmed.startsWith("```")) {
        continue;
      }
      
      // Skip markdown headers (these are part of the body)
      if (trimmed.startsWith("#")) {
        continue;
      }
      
      // This looks like a title
      title = trimmed;
      titleLineIndex = i;
      break;
    }

    // Extract body (everything after title, skipping blank lines)
    if (titleLineIndex >= 0) {
      const bodyLines = lines.slice(titleLineIndex + 1);
      body = bodyLines.join("\n").trim();
    } else {
      // Fallback: no clear title found, treat first line as title
      title = lines[0]?.trim() || "";
      body = lines.slice(1).join("\n").trim();
    }

    // Ensure title follows conventional commit format
    if (!conventionalCommitPattern.test(title)) {
      // Title doesn't have the type prefix, add it
      title = `${commitType}: ${title}`;
    }

    // Validate we have both title and body
    if (!title || !body) {
      throw new Error(
        `Failed to parse AI response into title and body. ` +
        `Title: "${title}", Body length: ${body.length}`
      );
    }

    // If title exceeds 256 chars, truncate
    if (title.length > 256) {
      title = title.substring(0, 253) + "...";
    }

    return {
      title,
      body,
      commitType,
      branches: changeset.branches,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    throw new Error(
      `Failed to generate PR content: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * T013: Validate PR content has all required sections
 */
export function validatePRContent(content: PullRequestContent): void {
  const requiredSections = ["Problem", "Solution", "Technical Details", "Testing"];
  const body = content.body;

  for (const section of requiredSections) {
    const sectionRegex = new RegExp(`##\\s+${section}`, "i");
    if (!sectionRegex.test(body)) {
      throw new Error(
        `PR body is missing required section: "${section}". All four sections must be present.`
      );
    }
  }

  // Validate title format
  if (!content.title.match(/^(feat|fix|refactor|docs|style|test|chore|perf|ci):/)) {
    throw new Error(
      'PR title must follow conventional commit format: "<type>: <description>"'
    );
  }

  // Check for code blocks (should not exist per requirements)
  if (body.includes("```")) {
    console.warn(
      "⚠️  Warning: PR body contains code blocks. Best practice is to use bullet points only."
    );
  }
}
