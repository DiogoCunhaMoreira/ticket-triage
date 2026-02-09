import "dotenv/config";
import { Octokit } from "@octokit/rest";
import type { PullRequestContent, GitHubPullRequest } from "./pr-schema.js";
import { getRepositoryInfo } from "./git-analyzer.js";

/**
 * T014: Initialize and authenticate GitHub client
 * Uses GITHUB_TOKEN from environment variables
 */
export function authenticateGitHub(): Octokit {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    throw new Error(
      "GITHUB_TOKEN environment variable is required. " +
        "Create a Personal Access Token at https://github.com/settings/tokens " +
        "and add it to your .env file."
    );
  }

  return new Octokit({
    auth: token,
  });
}

/**
 * T015: Detect repository owner and name from git remote
 * Returns { owner, repo } or throws error if not found
 */
export function detectRepository(): { owner: string; repo: string } {
  const repoInfo = getRepositoryInfo();

  if (!repoInfo) {
    throw new Error(
      "Could not detect GitHub repository from git remote. " +
        "Make sure you're in a git repository with a GitHub remote configured."
    );
  }

  const parts = repoInfo.split("/");
  const owner = parts[0];
  const repo = parts[1];
  
  if (!owner || !repo) {
    throw new Error(
      "Invalid repository format. Expected 'owner/repo' but got: " + repoInfo
    );
  }

  return { owner, repo };
}

/**
 * T016: Create a pull request on GitHub using Octokit REST API
 * T017: Includes comprehensive error handling for all GitHub API errors
 */
export async function createPullRequest(
  content: PullRequestContent
): Promise<GitHubPullRequest> {
  try {
    // Authenticate
    const octokit = authenticateGitHub();

    // Detect repository
    const { owner, repo } = detectRepository();

    // Create the pull request
    const response = await octokit.rest.pulls.create({
      owner,
      repo,
      title: content.title,
      head: content.branches.head,
      base: content.branches.base,
      body: content.body,
      draft: false,
    });

    // Map GitHub response to our GitHubPullRequest entity
    return {
      number: response.data.number,
      url: response.data.url,
      htmlUrl: response.data.html_url,
      state: response.data.state,
      createdAt: response.data.created_at,
    };
  } catch (error: any) {
    // T017: Handle specific GitHub API errors
    if (error.status === 401) {
      throw new Error(
        "Authentication failed. Your GITHUB_TOKEN may be invalid or expired. " +
          "Generate a new token at https://github.com/settings/tokens"
      );
    }

    if (error.status === 403) {
      throw new Error(
        "Permission denied. Your GITHUB_TOKEN may not have the required 'repo' scope. " +
          "Create a new token with 'repo' access at https://github.com/settings/tokens"
      );
    }

    if (error.status === 404) {
      throw new Error(
        "Repository not found. Make sure the repository exists and your token has access to it. " +
          "If it's a private repository, ensure your token has the 'repo' scope."
      );
    }

    if (error.status === 422) {
      // Validation error - parse GitHub's error response
      const errorMessage = error.response?.data?.errors
        ?.map((e: any) => `${e.field || "field"}: ${e.message}`)
        .join(", ") || error.message;

      throw new Error(
        `Pull request validation failed: ${errorMessage}. ` +
          "Common issues: branch doesn't exist, PR already exists, or invalid branch names."
      );
    }

    if (error.status === 429) {
      throw new Error(
        "GitHub API rate limit exceeded. Please wait a few minutes and try again."
      );
    }

    // Generic error fallback
    throw new Error(
      `Failed to create pull request: ${error.message || "Unknown error"}. ` +
        "Check your network connection and GitHub status."
    );
  }
}

/**
 * Validate GitHub authentication without making a full API call
 * Returns true if token is set, throws if missing
 */
export function validateGitHubAuth(): boolean {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error(
      "GITHUB_TOKEN not found in environment. Add it to your .env file."
    );
  }
  return true;
}

/**
 * Get repository information from GitHub API
 * Used for additional validation before creating PR
 */
export async function getRepository(
  owner: string,
  repo: string
): Promise<{ default_branch: string; full_name: string }> {
  const octokit = authenticateGitHub();

  try {
    const response = await octokit.rest.repos.get({
      owner,
      repo,
    });

    return {
      default_branch: response.data.default_branch,
      full_name: response.data.full_name,
    };
  } catch (error: any) {
    if (error.status === 404) {
      throw new Error(`Repository ${owner}/${repo} not found or not accessible.`);
    }
    throw new Error(`Failed to get repository info: ${error.message}`);
  }
}
