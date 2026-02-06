import { z } from "zod";

/**
 * Entity 1: BranchReference
 * Represents the source and target branches for pull request analysis.
 */
export const BranchReferenceSchema = z.object({
  head: z.string().min(1, "Head branch must not be empty"),
  base: z.string().min(1, "Base branch must not be empty"),
  repository: z
    .string()
    .regex(/^[\w.-]+\/[\w.-]+$/, "Repository must be in 'owner/repo' format")
    .optional(),
});

export type BranchReference = z.infer<typeof BranchReferenceSchema>;

/**
 * Entity 3: FileChange
 * Represents a single file that changed between branches.
 */
export const FileStatusEnum = z.enum(["added", "modified", "deleted", "renamed"]);
export type FileStatus = z.infer<typeof FileStatusEnum>;

export const FileChangeSchema = z.object({
  path: z.string().min(1).refine((path) => !path.startsWith("/"), {
    message: "Path must be relative (no leading slash)",
  }),
  status: FileStatusEnum,
  additions: z.number().min(0),
  deletions: z.number().min(0),
  diff: z.string().optional(),
});

export type FileChange = z.infer<typeof FileChangeSchema>;

/**
 * Entity 4: CommitInfo
 * Represents a git commit in the changeset.
 */
export const CommitInfoSchema = z.object({
  sha: z.string().regex(/^[0-9a-f]{7,40}$/, "Invalid git hash format"),
  message: z.string().min(1, "Commit message must not be empty"),
  author: z.string().min(1, "Author must not be empty"),
  date: z.string().datetime().optional(),
});

export type CommitInfo = z.infer<typeof CommitInfoSchema>;

/**
 * Entity 2: Changeset
 * Represents the collection of file changes between two branches.
 */
export const ChangesetSchema = z.object({
  branches: BranchReferenceSchema,
  files: z.array(FileChangeSchema).min(1, "Files array must not be empty"),
  commits: z.array(CommitInfoSchema).min(1, "Commits array must not be empty"),
  hasUncommittedChanges: z.boolean(),
  totalAdditions: z.number().min(0),
  totalDeletions: z.number().min(0),
});

export type Changeset = z.infer<typeof ChangesetSchema>;

/**
 * Entity 5: PullRequestContent
 * Represents the generated PR title and body ready for GitHub.
 */
export const CommitTypeEnum = z.enum([
  "feat",
  "fix",
  "refactor",
  "docs",
  "style",
  "test",
  "chore",
  "perf",
  "ci",
]);
export type CommitType = z.infer<typeof CommitTypeEnum>;

export const PullRequestContentSchema = z.object({
  title: z
    .string()
    .min(1)
    .max(256, "Title must not exceed 256 characters")
    .regex(
      /^(feat|fix|refactor|docs|style|test|chore|perf|ci):.+/,
      "Title must follow conventional commit format: <type>: <description>"
    ),
  body: z
    .string()
    .min(1)
    .max(65536, "Body should not exceed 65,536 characters (GitHub limit)"),
  commitType: CommitTypeEnum,
  branches: BranchReferenceSchema,
  generatedAt: z.string().datetime(),
});

export type PullRequestContent = z.infer<typeof PullRequestContentSchema>;

/**
 * Entity 6: GitHubPullRequest
 * Represents the created pull request on GitHub.
 */
export const GitHubPullRequestSchema = z.object({
  number: z.number().int().positive("PR number must be positive"),
  url: z.string().url("Must be a valid URL"),
  htmlUrl: z.string().url("Must be a valid GitHub URL"),
  state: z.string(),
  createdAt: z.string().datetime(),
});

export type GitHubPullRequest = z.infer<typeof GitHubPullRequestSchema>;
