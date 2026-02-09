# Quickstart Guide: Automated Pull Request Creation

**Feature**: 001-pr-automation | **Version**: 1.0.0 | **Date**: February 6, 2026

## Overview

This guide shows you how to set up and use the automated PR creation feature. The tool analyzes your git changes and uses AI to generate professional pull request descriptions following best practices.

**Time to complete**: ~5 minutes

---

## Prerequisites

Before you begin, ensure you have:

- ✅ Node.js 18+ installed
- ✅ Git repository initialized with at least one commit
- ✅ GitHub repository (can be personal or organization)
- ✅ A feature branch with committed changes
- ✅ Network access to GitHub API and Google Gemini API

---

## Step 1: Install Dependencies

Install the required npm packages:

```bash
npm install @octokit/rest
```

**What this adds**:
- `@octokit/rest`: GitHub API client with TypeScript types

**Note**: `@google/genai` and `zod` are already installed in the project.

---

## Step 2: Set Up Authentication

### 2.1 Create GitHub Personal Access Token

1. Go to GitHub Settings → [Developer settings → Personal access tokens → Tokens (classic)](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Give it a descriptive name: "PR Automation CLI"
4. Select expiration: 90 days (or custom)
5. Select scopes:
   - ✅ `repo` (for private repositories)
   - OR ✅ `public_repo` (for public repositories only)
6. Click "Generate token"
7. **Copy the token immediately** (you won't see it again)

### 2.2 Add Token to Environment

Add your GitHub token to the `.env` file in the project root:

```bash
# .env file
GEMINI_API_KEY=your_existing_gemini_key_here
GITHUB_TOKEN=ghp_your_token_here
```

**Security notes**:
- ✅ `.env` is already in `.gitignore` (never commit tokens)
- ✅ Token grants repository access - keep it secure
- ✅ Rotate tokens every 90 days for security

---

## Step 3: Build the Project

Compile the TypeScript code:

```bash
npm run build
```

This creates compiled JavaScript in the `dist/` directory.

---

## Step 4: Create Your First Automated PR

### 4.1 Make Some Changes

If you don't have a feature branch with changes yet:

```bash
# Create a feature branch
git checkout -b test-pr-automation

# Make some changes
echo "// Test change" >> src/test-file.ts

# Commit the changes
git add .
git commit -m "feat: add test file for PR automation demo"

# Push to GitHub (required for PR creation)
git push origin test-pr-automation
```

### 4.2 Run the PR Automation

From your feature branch, run:

```bash
npx tsx src/pr/pr-cli.ts
```

**What happens**:
1. ✅ Detects current branch (test-pr-automation)
2. ✅ Analyzes changes vs. main branch
3. ✅ Generates PR title and description using AI
4. ✅ Shows preview of the PR content
5. ✅ Asks for confirmation
6. ✅ Creates the PR on GitHub

### 4.3 Review the Output

You'll see output like this:

```
Analyzing changes between test-pr-automation and main...
✓ Found 3 changed files
✓ Found 5 commits
✓ Generating PR description with AI...

=== PULL REQUEST PREVIEW ===

Title: feat: Add test file for PR automation demo

Body:
## Problem
...

## Solution
...

## Technical Details
...

## Testing
...

=== END PREVIEW ===

Create this pull request? (y/n):
```

### 4.4 Confirm Creation

Type `y` and press Enter. You'll see:

```
✓ Pull request created successfully!
→ https://github.com/your-username/your-repo/pull/42
```

Click the URL to view your PR on GitHub!

---

## Step 5: Advanced Usage

### Specify Custom Base Branch

To create a PR targeting a branch other than `main`:

```bash
npx tsx src/pr/pr-cli.ts --base develop
```

### Specify Both Head and Base

To create a PR from a specific branch (not current):

```bash
npx tsx src/pr/pr-cli.ts --head feature-branch --base main
```

### Preview Only (No Creation)

To generate PR content without creating it:

```bash
npx tsx src/pr/pr-cli.ts --dry-run
```

The generated content will be displayed, and you can copy it manually to GitHub.

---

## Common Scenarios

### Scenario 1: No Changes Detected

**Error**: "No changes found between branches"

**Solution**: Ensure your feature branch has commits that don't exist in the base branch:

```bash
git log main..HEAD  # Should show your commits
```

### Scenario 2: Main Branch Doesn't Exist

**Error**: "Base branch 'main' not found. Please specify --base explicitly."

**Solution**: Your repository uses a different default branch. Specify it:

```bash
npx tsx src/pr/pr-cli.ts --base master
# or
npx tsx src/pr/pr-cli.ts --base develop
```

### Scenario 3: Uncommitted Changes

**Warning**: "Warning: You have uncommitted changes. Only committed changes will be included in the PR."

**Action**: 
- If intentional: Continue (press `y`). Uncommitted changes are ignored.
- If not: Commit your changes first:
  ```bash
  git add .
  git commit -m "feat: include last changes"
  npx tsx src/pr/pr-cli.ts
  ```

### Scenario 4: Authentication Failed

**Error**: "GitHub authentication failed. Check your GITHUB_TOKEN."

**Solutions**:
1. Verify token is in `.env`:
   ```bash
   cat .env | grep GITHUB_TOKEN
   ```
2. Verify token has correct scope (repo or public_repo)
3. Verify token hasn't expired (check GitHub settings)
4. Generate a new token and update `.env`

### Scenario 5: PR Already Exists

**Error**: "A pull request already exists for user:feature-branch"

**Solutions**:
- View existing PR: Check GitHub for the open PR
- Close old PR if it's a mistake
- Create a new feature branch for new changes

---

## Understanding the Generated PR

### Title Format

The AI generates titles following [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New features
- `fix:` - Bug fixes
- `refactor:` - Code refactoring
- `docs:` - Documentation changes
- `chore:` - Maintenance tasks
- `perf:` - Performance improvements

**Example**: `feat: Add automated PR creation with AI-generated descriptions`

### Body Structure

The PR body includes four sections (from [best practices](https://dev.to/budiwidhiyanto/the-art-of-pull-requests-a-developers-guide-to-smooth-code-reviews-38bk)):

1. **Problem**: Why this change is needed (context for reviewers)
2. **Solution**: What was implemented (bullet points of key changes)
3. **Technical Details**: Implementation notes (architecture decisions, new dependencies)
4. **Testing**: How to verify the changes (step-by-step instructions)

---

## Tips for Best Results

### ✅ Do

- ✅ Write clear commit messages (AI uses them for context)
- ✅ Commit logically related changes together
- ✅ Include descriptive file names
- ✅ Keep PRs focused on a single feature or fix
- ✅ Review the preview before confirming

### ❌ Don't

- ❌ Mix unrelated changes in one branch
- ❌ Use vague commit messages like "fix stuff"
- ❌ Leave uncommitted changes (they won't be analyzed)
- ❌ Create PRs from main to main (no changes)
- ❌ Forget to push your branch before creating PR

---

## Next Steps

Now that you've created your first automated PR:

1. ✨ **Try it on a real feature**: Use it for your next feature branch
2. 📝 **Review AI-generated content**: The AI learns from your commit messages
3. 🔧 **Customize if needed**: You can still edit PR description in GitHub after creation
4. 🚀 **Integrate into workflow**: Add it to your development process

---

## Troubleshooting

### Check Environment Variables

```bash
# Verify both API keys are set
cat .env
```

Should show both `GEMINI_API_KEY` and `GITHUB_TOKEN`.

### Check Git Status

```bash
# Verify you're on a feature branch
git branch --show-current

# Verify you have commits not in main
git log main..HEAD

# Check for uncommitted changes
git status
```

### Enable Verbose Output

For detailed debugging:

```bash
npx tsx src/pr/pr-cli.ts --verbose
```

### Test GitHub Connection

Verify your GitHub token works:

```bash
curl -H "Authorization: Bearer $GITHUB_TOKEN" https://api.github.com/user
```

Should return your GitHub user info.

---

## Support

**Issues**: Report bugs or request features in the GitHub issue tracker  
**Documentation**: See [spec.md](spec.md) for detailed feature requirements  
**API Details**: See [contracts/github-pr-api.json](contracts/github-pr-api.json) for GitHub API contract

---

## Version History

- **1.0.0** (2026-02-06): Initial release with MVP features (P1 user stories)
  - Generate PR descriptions from git changes
  - AI-powered content generation with Gemini
  - GitHub PR creation with confirmation flow
  - Custom branch target support
