import { execSync } from "node:child_process";
import type {
  BranchReference,
  Changeset,
  FileChange,
  CommitInfo,
  FileStatus,
} from "./pr-schema.js";

/**
 * Execute a git command and return output as string
 */
function execGit(command: string): string {
  try {
    return execSync(`git ${command}`, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
  } catch (error) {
    if (error instanceof Error && "status" in error) {
      const execError = error as Error & { stderr?: Buffer | string; status?: number };
      const stderr = execError.stderr?.toString() || execError.message;
      throw new Error(`Git command failed: ${stderr}`);
    }
    throw error;
  }
}

/**
 * Get the current branch name
 */
export function getCurrentBranch(): string {
  return execGit("rev-parse --abbrev-ref HEAD");
}

/**
 * Check if a branch exists locally or remotely
 */
export function getBranchExists(branchName: string): boolean {
  try {
    execGit(`rev-parse --verify ${branchName}`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check for uncommitted changes in the working directory
 * Returns true if there are uncommitted changes
 */
export function getUncommittedChanges(): boolean {
  const status = execGit("status --porcelain");
  return status.length > 0;
}

/**
 * Get the default branch from git config or remote
 * Returns "main" if it exists, otherwise throws error
 */
export function getDefaultBranch(): string {
  // First try to get from remote
  try {
    const remoteBranch = execGit("symbolic-ref refs/remotes/origin/HEAD");
    return remoteBranch.replace("refs/remotes/origin/", "");
  } catch {
    // Fallback: check if "main" exists
    if (getBranchExists("main")) {
      return "main";
    }
    // Check if "master" exists
    if (getBranchExists("master")) {
      return "master";
    }
    throw new Error(
      'Could not determine default branch. Please specify --base explicitly (e.g., --base main)'
    );
  }
}

/**
 * Validate that two branches are different
 */
export function validateBranchesDifferent(head: string, base: string): void {
  if (head === base) {
    throw new Error(
      `Head and base branches cannot be the same (both are "${head}")`
    );
  }
}

/**
 * Get repository info from git remote
 * Returns owner/repo format or null if not found
 */
export function getRepositoryInfo(): string | null {
  try {
    const remoteUrl = execGit("config --get remote.origin.url");

    // Parse GitHub URL formats:
    // https://github.com/owner/repo.git
    // git@github.com:owner/repo.git
    const httpsMatch = remoteUrl.match(/github\.com[/:]([\w.-]+)\/([\w.-]+?)(?:\.git)?$/);
    if (httpsMatch) {
      return `${httpsMatch[1]}/${httpsMatch[2]}`;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * T007: Get changed files between two branches
 * Returns list of FileChange objects
 */
export function getChangedFiles(base: string, head: string): FileChange[] {
  // Get file changes with status (A=added, M=modified, D=deleted, R=renamed)
  const diffOutput = execGit(`diff --name-status ${base}...${head}`);

  if (!diffOutput) {
    return [];
  }

  const files: FileChange[] = [];
  const lines = diffOutput.split("\n").filter((line) => line.trim());

  for (const line of lines) {
    const parts = line.split("\t");
    const status = parts[0];
    const path = parts[1];

    // Get line count stats for this file
    let additions = 0;
    let deletions = 0;

    try {
      const numstat = execGit(`diff --numstat ${base}...${head} -- "${path}"`);
      const [add, del] = numstat.split("\t");
      additions = parseInt(add || "0") || 0;
      deletions = parseInt(del || "0") || 0;
    } catch {
      // Binary files or errors - keep as 0
    }

    // Map git status to FileStatus enum
    let fileStatus: FileStatus = "modified";
    if (!status || !path) continue; // Skip invalid lines
    if (status === "A") fileStatus = "added";
    else if (status === "D") fileStatus = "deleted";
    else if (status.startsWith("R")) fileStatus = "renamed";

    files.push({
      path,
      status: fileStatus,
      additions,
      deletions,
      diff: undefined, // Optional, not included for now
    });
  }

  return files;
}

/**
 * T007: Get commit messages between two branches
 */
export function getCommitMessages(base: string, head: string): CommitInfo[] {
  const logOutput = execGit(
    `log ${base}..${head} --format=%H|%s|%an|%aI --no-merges`
  );

  if (!logOutput) {
    return [];
  }

  const commits: CommitInfo[] = [];
  const lines = logOutput.split("\n").filter((line) => line.trim());

  for (const line of lines) {
    const [sha, message, author, date] = line.split("|");
    if (!sha || !message || !author) continue; // Skip invalid lines
    commits.push({
      sha,
      message,
      author,
      date,
    });
  }

  return commits;
}

/**
 * T007: Get abbreviated diffs for files (optional, for AI context)
 * Returns map of filepath -> diff snippet
 */
export function getFileDiffs(
  base: string,
  head: string,
  maxLines: number = 50
): Record<string, string> {
  const files = getChangedFiles(base, head);
  const diffs: Record<string, string> = {};

  for (const file of files) {
    try {
      const diff = execGit(`diff ${base}...${head} -- "${file.path}"`);
      // Truncate to maxLines for AI context
      const lines = diff.split("\n").slice(0, maxLines);
      diffs[file.path] = lines.join("\n");
    } catch {
      // Skip files that can't be diffed
    }
  }

  return diffs;
}

/**
 * T008: Build complete Changeset from git analysis
 * Aggregates all git data into structured Changeset entity
 */
export function buildChangeset(branches: BranchReference): Changeset {
  const { head, base } = branches;

  // Validate branches exist and are different
  if (!getBranchExists(head)) {
    throw new Error(`Head branch "${head}" does not exist`);
  }
  if (!getBranchExists(base)) {
    throw new Error(`Base branch "${base}" does not exist`);
  }
  validateBranchesDifferent(head, base);

  // Get all the git data
  const files = getChangedFiles(base, head);
  const commits = getCommitMessages(base, head);
  const hasUncommittedChanges = getUncommittedChanges();

  // Calculate totals
  const totalAdditions = files.reduce((sum, file) => sum + file.additions, 0);
  const totalDeletions = files.reduce((sum, file) => sum + file.deletions, 0);

  // Validate we have changes
  if (files.length === 0) {
    throw new Error(
      `No changes found between "${base}" and "${head}". Branches may be identical.`
    );
  }

  if (commits.length === 0) {
    throw new Error(
      `No commits found between "${base}" and "${head}". Nothing to create PR from.`
    );
  }

  return {
    branches,
    files,
    commits,
    hasUncommittedChanges,
    totalAdditions,
    totalDeletions,
  };
}

