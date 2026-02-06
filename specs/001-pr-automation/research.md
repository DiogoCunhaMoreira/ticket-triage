# Research: Automated Pull Request Creation

**Feature**: 001-pr-automation | **Phase**: 0 | **Date**: February 6, 2026

## Research Tasks

Based on Technical Context unknowns and technology choices, research was conducted on:

1. GitHub API for PR creation (Octokit library)
2. Git diff analysis approaches
3. GitHub authentication methods
4. Conventional commits format
5. AI prompt engineering for PR descriptions

---

## Decision 1: GitHub API Client Library

**Decision**: Use `@octokit/rest` npm package for GitHub API integration

**Rationale**:
- Official GitHub SDK for Node.js/TypeScript
- Full type safety with TypeScript definitions included
- Handles authentication, rate limiting, and pagination automatically
- Consistent with existing project patterns (official libraries like @google/genai)
- Well-documented with extensive examples
- Active maintenance and broad community adoption

**Alternatives considered**:
- **Axios + manual GitHub API calls**: More control but requires manual typing, auth handling, error management
- **Simple-git**: Only handles local git operations, not GitHub API
- **GraphQL (@octokit/graphql)**: More efficient for complex queries but overkill for single PR creation operation

**Key API methods needed**:
- `octokit.rest.pulls.create()` - Create pull request
- `octokit.rest.repos.get()` - Get repository info (default branch)
- `octokit.rest.repos.getBranch()` - Validate branches exist

**Authentication**: Use Personal Access Token (classic) with `repo` scope via environment variable `GITHUB_TOKEN`

---

## Decision 2: Git Diff Analysis

**Decision**: Use Node.js `child_process.execSync()` to call native git commands for diff analysis

**Rationale**:
- Git CLI provides richest diff information out of the box
- No additional dependencies needed (git already required for development workflow)
- Commands like `git diff --name-status` and `git log --oneline` provide exactly what we need
- Output is structured and parseable
- Matches existing project approach (calling commands from TypeScript)

**Alternatives considered**:
- **simple-git**: Nice API but adds dependency for simple operations. Overhead not justified for basic diff reading.
- **isomorphic-git**: Pure JavaScript git implementation, but limited diff capabilities and large bundle size
- **parse git output files directly (.git/ directory)**: Fragile, undocumented internal format

**Commands to use**:
```bash
git rev-parse --abbrev-ref HEAD              # Get current branch
git diff --name-status base...head           # Get changed files
git log base..head --oneline                 # Get commit messages
git diff base...head                         # Get full diffs (for AI context)
git status --porcelain                       # Check for uncommitted changes
git rev-parse --verify branch_name           # Validate branch exists
```

---

## Decision 3: GitHub Authentication

**Decision**: Use Personal Access Token (PAT) stored in `.env` file as `GITHUB_TOKEN`

**Rationale**:
- Consistent with existing project pattern (GEMINI_API_KEY in .env)
- PATs work for both personal and organization repositories
- Simple to set up and document in quickstart
- No OAuth flow needed for CLI tool
- Fine-grained permissions available (repo scope for PR creation)

**Alternatives considered**:
- **GitHub App**: Overkill for personal CLI tool, requires complex setup
- **OAuth flow**: Requires web server/callback, not suitable for CLI
- **SSH keys**: For git operations only, doesn't work with GitHub API

**Token permissions required**: `repo` scope (full repository access for private repos) or `public_repo` (for public repos only)

**Security**: Token in .env file (gitignored), never logged or displayed

---

## Decision 4: Conventional Commits Format

**Decision**: Detect commit type automatically from diff analysis and commit messages, follow standard format

**Standard format**: `<type>: <description>`

**Types** (from https://www.conventionalcommits.org/):
- `feat`: New feature for the user
- `fix`: Bug fix for the user
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `docs`: Documentation only changes
- `style`: Formatting, missing semicolons, etc; no code change
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to build process or auxiliary tools
- `perf`: Performance improvements
- `ci`: Changes to CI configuration files and scripts

**Rationale**:
- Industry standard adopted by major projects (Angular, React, Vue)
- Enables automated changelog generation
- Clear, scannable PR titles
- Supports semantic versioning automation

**Alternatives considered**:
- Free-form titles: Less consistency, harder to scan
- Custom format: Reinventing the wheel

**Implementation**: AI will analyze commit messages and file changes to determine appropriate type

---

## Decision 5: AI Prompt Engineering for PR Descriptions

**Decision**: Use structured prompt with git diff + commit context to generate PR body following article format

**Prompt structure**:
```
Role: You are an expert developer creating a pull request description.

Context:
- Changed files: [list]
- Commit messages: [messages]
- File diffs: [abbreviated diffs of key changes]

Task: Generate a PR description with these sections:
1. Problem: Why this change is needed (2-3 sentences)
2. Solution: How the change addresses the problem (bullet points)
3. Technical Details: Implementation notes (bullet points)
4. Testing: How to verify the changes (numbered steps)

Format: Markdown, concise bullet points, focus on "why" not "what" (code shows what).
Tone: Professional, clear, helpful to reviewers.
```

**Rationale**:
- Structured prompt ensures consistent output format
- Including commit messages preserves developer intent
- Abbreviated diffs provide context without token bloat
- Explicit section requirements match spec.md (FR-004)
- Follows best practices article format exactly

**Alternatives considered**:
- **Simple summarization**: Too vague, inconsistent results
- **Template filling**: Loses context, generic output
- **Full diff analysis**: Token expensive, slower generation

**Token optimization**: Limit diff context to ~5000 tokens (Gemini Flash 1.5 has 1M context window, but faster with less input)

---

## Summary of Research Findings

All technical decisions resolved. Ready for Phase 1 (data model and contracts).

**Key takeaways**:
- @octokit/rest provides type-safe GitHub integration
- Native git commands sufficient for diff analysis
- PAT authentication simple and secure
- Conventional commits standard well-established
- Structured AI prompts ensure consistent PR quality

**Dependencies to add**: `@octokit/rest` (GitHub API client)

**No blockers identified**.
