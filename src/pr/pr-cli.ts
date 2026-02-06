#!/usr/bin/env node
import "dotenv/config";
import * as readline from "node:readline";
import {
  getCurrentBranch,
  getDefaultBranch,
  buildChangeset,
  getUncommittedChanges,
  getBranchExists,
} from "./git-analyzer.js";
import { generatePRContent, validatePRContent } from "./pr-generator.js";
import {
  displayPRPreview,
  displayChangesetSummary,
  displayError,
  displaySuccess,
  displayCancellation,
} from "./pr-formatter.js";
import { createPullRequest, validateGitHubAuth } from "./github-client.js";
import type { BranchReference } from "./pr-schema.js";

/**
 * T025: Display help text
 */
function displayHelp(): void {
  console.log(`
PR Automation Tool - Automatically generate and create GitHub pull requests

USAGE:
  npx tsx src/pr/pr-cli.ts [OPTIONS]

OPTIONS:
  --base <branch>    Target branch for the PR (default: main)
  --head <branch>    Source branch with changes (default: current branch)
  --help             Display this help message

EXAMPLES:
  # Create PR from current branch to main
  npx tsx src/pr/pr-cli.ts

  # Create PR from feature branch to develop
  npx tsx src/pr/pr-cli.ts --base develop

  # Create PR between specific branches
  npx tsx src/pr/pr-cli.ts --base develop --head feature-x

SETUP:
  1. Add GITHUB_TOKEN to your .env file
  2. Make sure you have committed changes on your feature branch
  3. Run the command to generate and create PR

For more information, see specs/001-pr-automation/quickstart.md
`);
}

/**
 * T021: Parse CLI arguments
 * Returns { base, head, help } from process.argv
 */
function parseArgs(): { base?: string; head?: string; help: boolean } {
  const args = process.argv.slice(2);
  const result: { base?: string; head?: string; help: boolean } = { help: false };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--help" || arg === "-h") {
      result.help = true;
    } else if (arg === "--base") {
      const value = args[++i];
      if (!value) {
        throw new Error("--base requires a branch name argument");
      }
      result.base = value;
    } else if (arg === "--head") {
      const value = args[++i];
      if (!value) {
        throw new Error("--head requires a branch name argument");
      }
      result.head = value;
    } else {
      throw new Error(`Unknown argument: ${arg}. Use --help for usage information.`);
    }
  }

  return result;
}

/**
 * T018: Prompt user for confirmation (yes/no)
 * Returns true if user confirms, false if cancelled
 */
async function confirmPrompt(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${question} (y/n): `, (answer) => {
      rl.close();
      const normalized = answer.trim().toLowerCase();
      resolve(normalized === "y" || normalized === "yes");
    });
  });
}

/**
 * Main CLI entry point
 * T019: Integrates PR generation and creation flow
 * T020: Handles cancellation gracefully
 * T024: Uses CLI args or defaults for branch selection
 */
async function main() {
  try {
    // T021: Parse command-line arguments
    const cliArgs = parseArgs();

    // T025: Show help if requested
    if (cliArgs.help) {
      displayHelp();
      process.exit(0);
    }

    console.log("\n🚀 PR Automation Tool\n");

    // T024: Determine branches from CLI args or defaults
    let head = cliArgs.head || getCurrentBranch();
    let base = cliArgs.base;

    // T023: Default branch logic - if no base specified, use default
    if (!base) {
      try {
        base = getDefaultBranch();
      } catch (error) {
        throw new Error(
          'Could not determine default base branch. Please specify explicitly with --base (e.g., --base main)'
        );
      }
    }

    // T022: Validate specified branches exist
    if (!getBranchExists(head)) {
      throw new Error(
        `Head branch "${head}" does not exist. Check your branch name or create the branch first.`
      );
    }

    if (!getBranchExists(base)) {
      throw new Error(
        `Base branch "${base}" does not exist. ` +
          (cliArgs.base
            ? 'Check your --base argument.'
            : 'Specify the correct base branch with --base.')
      );
    }

    console.log(`Analyzing changes: ${head} → ${base}\n`);

    // Check for uncommitted changes and warn
    const hasUncommitted = getUncommittedChanges();
    if (hasUncommitted) {
      console.log(
        "⚠️  Warning: You have uncommitted changes. Only committed changes will be included.\n"
      );
    }

    // Build branches reference
    const branches: BranchReference = { head, base };

    // Step 1: Analyze git changes
    console.log("📊 Analyzing git changes...");
    const changeset = buildChangeset(branches);
    displayChangesetSummary(changeset);

    // Step 2: Generate PR content using AI
    console.log("\n🤖 Generating PR description with AI...");
    const prContent = await generatePRContent(changeset);

    // Validate content
    validatePRContent(prContent);

    // Step 3: Display preview
    displayPRPreview(prContent);

    // Step 4: T018/T020 - Confirm or cancel
    const confirmed = await confirmPrompt(
      "Do you want to create this pull request?"
    );

    if (!confirmed) {
      // T020: Cancellation handling
      displayCancellation();
      process.exit(0);
    }

    // Step 5: T019 - Create PR on GitHub
    console.log("\n📤 Creating pull request on GitHub...");

    // Validate GitHub authentication before attempting
    validateGitHubAuth();

    const pr = await createPullRequest(prContent);

    // Display success with URL
    displaySuccess(pr.htmlUrl, pr.number);

    process.exit(0);
  } catch (error) {
    displayError(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run CLI
main();
