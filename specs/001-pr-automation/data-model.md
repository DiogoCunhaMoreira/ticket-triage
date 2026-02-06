# Data Model: Automated Pull Request Creation

**Feature**: 001-pr-automation | **Phase**: 1 | **Date**: February 6, 2026

## Overview

This document defines the data entities, their relationships, and validation rules for the PR automation feature. All entities are implemented as Zod schemas in TypeScript for runtime validation and type inference.

---

## Entity 1: BranchReference

Represents the source and target branches for pull request analysis.

### Fields

| Field | Type | Required | Default | Validation | Description |
|-------|------|----------|---------|------------|-------------|
| `head` | string | Yes | Current branch | Non-empty, valid git branch name | Source branch containing changes |
| `base` | string | Yes | "main" | Non-empty, valid git branch name | Target branch for merge |
| `repository` | string | No | Current repo | Format: "owner/repo" | GitHub repository identifier |

### Validation Rules

- **VR-001**: Both `head` and `base` MUST exist in the repository (validated via git command)
- **VR-002**: `head` and `base` MUST be different branches
- **VR-003**: If `base` is not specified and "main" doesn't exist, system MUST fail with error
- **VR-004**: `repository` format MUST match GitHub's "owner/repo" pattern if provided

### Relationships

- Used by: Changeset (to determine diff scope)
- Used by: PullRequestContent (to specify PR target)

### Example

```json
{
  "head": "001-pr-automation",
  "base": "main",
  "repository": "user/ticket-agent"
}
```

---

## Entity 2: Changeset

Represents the collection of file changes between two branches.

### Fields

| Field | Type | Required | Default | Validation | Description |
|-------|------|----------|---------|------------|-------------|
| `branches` | BranchReference | Yes | - | Valid BranchReference | Source and target branches |
| `files` | FileChange[] | Yes | - | Non-empty array | List of changed files |
| `commits` | CommitInfo[] | Yes | - | Non-empty array | List of commits in range |
| `hasUncommittedChanges` | boolean | Yes | - | - | Whether working directory has uncommitted changes |
| `totalAdditions` | number | Yes | - | >= 0 | Total lines added |
| `totalDeletions` | number | Yes | - | >= 0 | Total lines deleted |

### Validation Rules

- **VR-005**: `files` array MUST NOT be empty (otherwise no changes to create PR for)
- **VR-006**: `commits` array MUST NOT be empty (all PRs must have at least one commit)
- **VR-007**: If `hasUncommittedChanges` is true, system MUST warn user but continue with committed changes only
- **VR-008**: Sum of file-level additions MUST equal `totalAdditions`
- **VR-009**: Sum of file-level deletions MUST equal `totalDeletions`

### Relationships

- Contains: FileChange[] (composition)
- Contains: CommitInfo[] (composition)
- References: BranchReference

### Example

```json
{
  "branches": { "head": "feature", "base": "main" },
  "files": [
    {
      "path": "src/pr/pr-cli.ts",
      "status": "added",
      "additions": 120,
      "deletions": 0
    }
  ],
  "commits": [
    {
      "sha": "abc123",
      "message": "feat: add PR automation CLI",
      "author": "Developer"
    }
  ],
  "hasUncommittedChanges": false,
  "totalAdditions": 120,
  "totalDeletions": 0
}
```

---

## Entity 3: FileChange

Represents a single file that changed between branches.

### Fields

| Field | Type | Required | Default | Validation | Description |
|-------|------|----------|---------|------------|-------------|
| `path` | string | Yes | - | Valid file path | Relative path from repository root |
| `status` | FileStatus | Yes | - | Enum value | Type of change |
| `additions` | number | Yes | - | >= 0 | Lines added in this file |
| `deletions` | number | Yes | - | >= 0 | Lines removed from this file |
| `diff` | string | No | - | - | Abbreviated diff for AI context (optional) |

### FileStatus Enum

- `added`: New file created
- `modified`: Existing file changed
- `deleted`: File removed
- `renamed`: File moved/renamed

### Validation Rules

- **VR-010**: For status "added", `deletions` MUST be 0
- **VR-011**: For status "deleted", `additions` MUST be 0
- **VR-012**: `path` MUST be relative path (no leading slash)
- **VR-013**: Binary files MAY have additions=deletions=0

### Relationships

- Owned by: Changeset

### Example

```json
{
  "path": "src/pr/pr-cli.ts",
  "status": "added",
  "additions": 120,
  "deletions": 0,
  "diff": "@@ -0,0 +1,120 @@\n+import { Command } from 'commander';\n..."
}
```

---

## Entity 4: CommitInfo

Represents a git commit in the changeset.

### Fields

| Field | Type | Required | Default | Validation | Description |
|-------|------|----------|---------|------------|-------------|
| `sha` | string | Yes | - | 7-40 hex chars | Git commit hash |
| `message` | string | Yes | - | Non-empty | Full commit message |
| `author` | string | Yes | - | Non-empty | Commit author name |
| `date` | string | No | - | ISO 8601 date | Commit timestamp |

### Validation Rules

- **VR-014**: `sha` MUST be valid git hash (7-40 hexadecimal characters)
- **VR-015**: `message` MUST NOT be empty

### Relationships

- Owned by: Changeset

### Example

```json
{
  "sha": "abc1234",
  "message": "feat: add PR automation CLI\n\nImplement basic command structure",
  "author": "John Doe",
  "date": "2026-02-06T10:30:00Z"
}
```

---

## Entity 5: PullRequestContent

Represents the generated PR title and body ready for GitHub.

### Fields

| Field | Type | Required | Default | Validation | Description |
|-------|------|----------|---------|------------|-------------|
| `title` | string | Yes | - | 1-256 chars, conventional commits format | PR title |
| `body` | string | Yes | - | Markdown, includes all required sections | PR description |
| `commitType` | CommitType | Yes | - | Enum value | Detected type for conventional commit |
| `branches` | BranchReference | Yes | - | Valid BranchReference | Source and target |
| `generatedAt` | string | Yes | - | ISO 8601 timestamp | When content was generated |

### CommitType Enum

- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring
- `docs`: Documentation changes
- `style`: Code style changes
- `test`: Test changes
- `chore`: Build/tooling changes
- `perf`: Performance improvements
- `ci`: CI/CD changes

### Validation Rules

- **VR-016**: `title` MUST follow format: `<type>: <description>` where type is from CommitType enum
- **VR-017**: `title` length MUST be 1-256 characters (GitHub limit)
- **VR-018**: `body` MUST include all four sections: Problem, Solution, Technical Details, Testing
- **VR-019**: `body` length SHOULD NOT exceed 65,536 characters (GitHub limit)
- **VR-020**: `body` MUST be valid Markdown

### Body Structure

```markdown
## Problem
[2-3 sentences explaining why this change is needed]

## Solution
- [Bullet point 1]
- [Bullet point 2]
- [etc.]

## Technical Details
- [Implementation note 1]
- [Implementation note 2]
- [etc.]

## Testing
1. [Test step 1]
2. [Test step 2]
3. [etc.]
```

### Relationships

- Generated from: Changeset
- References: BranchReference

### Example

```json
{
  "title": "feat: Add automated PR creation with AI-generated descriptions",
  "body": "## Problem\n\nDevelopers spend significant time...\n\n## Solution\n- Analyze git diffs...",
  "commitType": "feat",
  "branches": { "head": "001-pr-automation", "base": "main" },
  "generatedAt": "2026-02-06T14:22:00Z"
}
```

---

## Entity 6: GitHubPullRequest

Represents the created pull request on GitHub.

### Fields

| Field | Type | Required | Default | Validation | Description |
|-------|------|----------|---------|------------|-------------|
| `number` | number | Yes | - | > 0 | GitHub PR number |
| `url` | string | Yes | - | Valid URL | HTML URL to view PR |
| `htmlUrl` | string | Yes | - | Valid URL | Direct browser link |
| `state` | string | Yes | - | "open" | PR state |
| `createdAt` | string | Yes | - | ISO 8601 timestamp | When PR was created |

### Validation Rules

- **VR-021**: `number` MUST be positive integer
- **VR-022**: `url` MUST be valid GitHub PR URL
- **VR-023**: Initial `state` MUST be "open"

### Relationships

- Created from: PullRequestContent

### Example

```json
{
  "number": 42,
  "url": "https://api.github.com/repos/user/repo/pulls/42",
  "htmlUrl": "https://github.com/user/repo/pull/42",
  "state": "open",
  "createdAt": "2026-02-06T14:23:00Z"
}
```

---

## Entity Relationships Diagram

```
BranchReference
    ↓
Changeset
    ├── FileChange[]
    ├── CommitInfo[]
    └── BranchReference
    ↓
PullRequestContent
    └── BranchReference
    ↓
GitHubPullRequest
```

---

## State Transitions

### PR Generation Workflow

```
1. [User Input] → BranchReference
2. BranchReference → [Git Analysis] → Changeset
3. Changeset → [AI Generation] → PullRequestContent
4. PullRequestContent → [User Preview] → [Confirmation]
5. [Confirmed] → [GitHub API] → GitHubPullRequest
6. [Cancelled] → [Exit with PullRequestContent available]
```

### Validation Points

- **V1**: After BranchReference creation - validate branches exist
- **V2**: After Changeset generation - validate non-empty changes
- **V3**: After PullRequestContent generation - validate format and sections
- **V4**: Before GitHub API call - validate authentication

---

## Zod Schema Implementation Notes

All entities will be implemented as Zod schemas in `src/pr/pr-schema.ts`:

```typescript
// Example structure (not full code)
export const FileStatusEnum = z.enum(['added', 'modified', 'deleted', 'renamed']);

export const FileChangeSchema = z.object({
  path: z.string().min(1),
  status: FileStatusEnum,
  additions: z.number().min(0),
  deletions: z.number().min(0),
  diff: z.string().optional(),
});

export type FileChange = z.infer<typeof FileChangeSchema>;
```

All schemas will follow the existing project pattern (see `src/schema.ts` for ticket triage schemas).
