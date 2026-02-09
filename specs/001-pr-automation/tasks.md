# Tasks: Automated Pull Request Creation

**Feature**: 001-pr-automation  
**Input**: Design documents from `/specs/001-pr-automation/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/  

**Tests**: Not requested in specification - no test tasks included

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and dependencies

- [X] T001 Install @octokit/rest package for GitHub API integration
- [X] T002 [P] Add GITHUB_TOKEN to .env.example file with documentation comment
- [X] T003 [P] Create src/pr/ directory for PR automation feature module

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core schemas and utilities that all user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Define Zod schemas for all entities in src/pr/pr-schema.ts (BranchReference, FileChange, CommitInfo, Changeset, PullRequestContent, GitHubPullRequest)
- [X] T005 Create pr-formatter.ts in src/pr/ for formatting PR content display to console (depends on T004 for type imports)
- [X] T006 [P] Implement basic git command execution utilities in src/pr/git-analyzer.ts (getCurrentBranch, getBranchExists, getUncommittedChanges)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Generate PR Description from Changes (Priority: P1) 🎯 MVP

**Goal**: Analyze git changes and use AI to generate PR title and body with Problem/Solution/Technical Details/Testing sections

**Independent Test**: Run CLI on a feature branch with commits, verify it generates formatted PR content with conventional commit title and four required sections

### Implementation for User Story 1

- [X] T007 [P] [US1] Implement git diff analysis functions in src/pr/git-analyzer.ts (getChangedFiles, getCommitMessages, getFileDiffs)
- [X] T008 [P] [US1] Implement Changeset builder in src/pr/git-analyzer.ts that aggregates git data into Changeset entity
- [X] T009 [US1] Implement pr-generator.ts in src/pr/ with AI prompt construction for PR description generation
- [X] T010 [US1] Implement generatePRContent function in src/pr/pr-generator.ts using Gemini AI to create PullRequestContent from Changeset
- [X] T011 [US1] Add conventional commit type detection logic in src/pr/pr-generator.ts (feat/fix/refactor detection from commits and diffs)
- [X] T012 [US1] Implement PR content formatting in src/pr/pr-formatter.ts to display title and body with proper sections
- [X] T013 [US1] Implement validation for PR content in src/pr/pr-generator.ts (verify all 4 sections present, title format correct)

**Checkpoint**: At this point, User Story 1 should generate and display PR content. CLI can be run and preview shown.

---

## Phase 4: User Story 3 - Confirm and Create PR (Priority: P1) 🎯 MVP

**Goal**: Prompt user for confirmation and create PR on GitHub when confirmed

**Independent Test**: Generate PR content, press 'y' to confirm, verify PR is created on GitHub with correct title/body and URL is displayed

### Implementation for User Story 3

- [X] T014 [P] [US3] Implement GitHub authentication in src/pr/github-client.ts using Octokit with GITHUB_TOKEN
- [X] T015 [P] [US3] Implement repository info detection in src/pr/github-client.ts (get owner/repo from git remote)
- [X] T016 [US3] Implement createPullRequest function in src/pr/github-client.ts using Octokit REST API
- [X] T017 [US3] Add error handling in src/pr/github-client.ts for GitHub API errors (401, 403, 422, 404)
- [X] T018 [US3] Implement confirmation prompt in src/pr/pr-cli.ts (display preview, ask yes/no, handle response)
- [X] T019 [US3] Integrate PR creation flow in src/pr/pr-cli.ts (confirmation → GitHub API call → display URL)
- [X] T020 [US3] Implement cancellation handling in src/pr/pr-cli.ts (exit gracefully, display that content is available)

**Checkpoint**: At this point, User Stories 1 AND 3 form a complete MVP. Users can generate and create PRs end-to-end.

---

## Phase 5: User Story 2 - Customize Branch Targets (Priority: P2)

**Goal**: Support CLI arguments for specifying custom base and head branches

**Independent Test**: Run `npx tsx src/pr/pr-cli.ts --base develop --head feature-x`, verify PR is analyzed between correct branches

### Implementation for User Story 2

- [X] T021 [P] [US2] Add CLI argument parsing in src/pr/pr-cli.ts using process.argv for --base and --head flags
- [X] T022 [US2] Implement branch validation in src/pr/git-analyzer.ts to check if specified branches exist
- [X] T023 [US2] Add default branch logic in src/pr/pr-cli.ts (default to "main" for base, fail with error if main doesn't exist)
- [X] T024 [US2] Update BranchReference construction in src/pr/pr-cli.ts to use CLI args or defaults
- [X] T025 [US2] Add help text display in src/pr/pr-cli.ts showing usage with --base and --head options

**Checkpoint**: All user stories (P1 MVP + P2 enhancement) are now independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T026 [P] Add comprehensive error messages for all edge cases in src/pr/pr-cli.ts (no changes/commits between branches, invalid branches, auth failures, rate limits)
- [X] T027 [P] Add uncommitted changes warning in src/pr/pr-cli.ts before analysis begins
- [X] T028 [P] Add validation in src/pr/pr-cli.ts that main branch exists when using default, show helpful error if not
- [X] T029 [P] Update package.json with new script: "pr:create": "tsx src/pr/pr-cli.ts"
- [X] T030 Validate quickstart.md instructions by running through complete workflow
- [X] T031 [P] Add logging statements for debugging in src/pr/pr-generator.ts and src/pr/github-client.ts

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2)
- **User Story 3 (Phase 4)**: Depends on Foundational (Phase 2) AND User Story 1 (Phase 3) - needs PR content generation
- **User Story 2 (Phase 5)**: Depends on Foundational (Phase 2) - can run parallel to User Story 1 & 3 but lower priority
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 3 (P1)**: Depends on User Story 1 - needs generated PR content to create PR
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Independent of other stories (just adds CLI args)

### Within Each User Story

**User Story 1**:
- T007 (git functions) and T008 (Changeset builder) can run in parallel
- T009, T010 (PR generation) depend on T008
- T011 (commit type detection) can run parallel to T009-T010
- T012 (formatting) can run parallel to T009-T011
- T013 (validation) depends on T009-T012

**User Story 3**:
- T014 (GitHub auth) and T015 (repo detection) can run in parallel
- T016 (create PR) depends on T014-T015
- T017 (error handling) depends on T016
- T018-T020 (CLI integration) depend on T016-T017

**User Story 2**:
- All T021-T025 can proceed in sequence (simple CLI argument additions)

### Parallel Opportunities

- All Setup tasks (T001-T003) marked [P] can run in parallel
- In Foundational phase: T006 can run independently while T004→T005 run in sequence
- Within User Story 1:
  - T007 and T008 together
  - T011 and T012 together (after T008 done)
- Within User Story 3:
  - T014 and T015 together
- All Polish tasks marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# After Foundational phase completes, launch in parallel:
Task T007: "Implement git diff analysis functions in src/pr/git-analyzer.ts"
Task T008: "Implement Changeset builder in src/pr/git-analyzer.ts"

# Once T008 completes, launch in parallel:
Task T011: "Add conventional commit type detection in src/pr/pr-generator.ts"
Task T012: "Implement PR content formatting in src/pr/pr-formatter.ts"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 3 Only) - Recommended

1. Complete Phase 1: Setup (~10 minutes)
2. Complete Phase 2: Foundational (~1-2 hours)
3. Complete Phase 3: User Story 1 (~3-4 hours)
4. Complete Phase 4: User Story 3 (~2-3 hours)
5. **STOP and VALIDATE**: Test complete PR generation and creation workflow
6. **MVP COMPLETE**: Can generate PRs from current branch to main with AI descriptions

**Estimated MVP time**: ~1 day

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready (~1-2 hours)
2. Add User Story 1 → Test independently → Can preview PR content! (~3-4 hours)
3. Add User Story 3 → Test independently → Can create PRs end-to-end! (~2-3 hours)
4. **Deploy MVP** - Feature is useful at this point
5. Add User Story 2 → Test independently → Can target custom branches! (~1-2 hours)
6. Polish → Clean up edge cases and error messages (~1-2 hours)

**Total estimated time**: ~2 days for complete feature

### Parallel Team Strategy

With 2 developers after Foundational phase:

1. Team completes Setup + Foundational together (~1-2 hours)
2. Once Foundational is done:
   - Developer A: User Story 1 (T007-T013) - PR generation
   - Developer B: User Story 2 (T021-T025) - CLI arguments
3. Developer A then does User Story 3 (T014-T020) - GitHub creation (depends on US1)
4. Both do Polish tasks in parallel

---

## Notes

- [P] tasks = different files or independent functions, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- No tests included (not requested in specification)
- Testing not requested means no TDD workflow - implement and manually verify
- Phase 3 (US1) produces the MVP alongside Phase 4 (US3)
- Phase 5 (US2) is P2 priority enhancement
