import type { PullRequestContent, Changeset } from "./pr-schema.js";

/**
 * Formats and displays PR content to console for user preview
 */
export function displayPRPreview(content: PullRequestContent): void {
  console.log("\n" + "=".repeat(80));
  console.log("PULL REQUEST PREVIEW");
  console.log("=".repeat(80) + "\n");

  console.log("Title:");
  console.log(`  ${content.title}`);

  console.log("\nBranches:");
  console.log(`  ${content.branches.head} → ${content.branches.base}`);

  console.log("\nBody:");
  console.log("─".repeat(80));
  console.log(content.body);
  console.log("─".repeat(80));

  console.log(`\nGenerated at: ${new Date(content.generatedAt).toLocaleString()}`);
  console.log("\n" + "=".repeat(80) + "\n");
}

/**
 * Formats changeset summary for display
 */
export function displayChangesetSummary(changeset: Changeset): void {
  console.log("\nChangeset Summary:");
  console.log(`  Files changed: ${changeset.files.length}`);
  console.log(`  Commits: ${changeset.commits.length}`);
  console.log(`  +${changeset.totalAdditions} -${changeset.totalDeletions}`);

  if (changeset.hasUncommittedChanges) {
    console.log(
      "\n⚠️  Warning: You have uncommitted changes. Only committed changes will be included in the PR."
    );
  }

  console.log("\nFiles:");
  for (const file of changeset.files) {
    const statusSymbol = getStatusSymbol(file.status);
    console.log(
      `  ${statusSymbol} ${file.path} (+${file.additions} -${file.deletions})`
    );
  }

  console.log("\nCommits:");
  for (const commit of changeset.commits) {
    console.log(`  ${commit.sha.substring(0, 7)} ${commit.message.split("\n")[0]}`);
  }
  console.log();
}

/**
 * Helper to get status symbol for file changes
 */
function getStatusSymbol(status: string): string {
  const symbols: Record<string, string> = {
    added: "A",
    modified: "M",
    deleted: "D",
    renamed: "R",
  };
  return symbols[status] || "?";
}

/**
 * Formats error messages for display
 */
export function displayError(message: string): void {
  console.error(`\n❌ Error: ${message}\n`);
}

/**
 * Formats success message with PR URL
 */
export function displaySuccess(prUrl: string, prNumber: number): void {
  console.log("\n" + "=".repeat(80));
  console.log("✓ PULL REQUEST CREATED SUCCESSFULLY");
  console.log("=".repeat(80));
  console.log(`\nPR #${prNumber}: ${prUrl}`);
  console.log("\n" + "=".repeat(80) + "\n");
}

/**
 * Displays cancellation message
 */
export function displayCancellation(): void {
  console.log(
    "\n✓ PR creation cancelled. Generated content is available for manual use.\n"
  );
}
