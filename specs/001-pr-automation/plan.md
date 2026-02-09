# Implementation Plan: Automated Pull Request Creation

**Branch**: `001-pr-automation` | **Date**: February 6, 2026 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-pr-automation/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Automate the creation of GitHub pull requests by analyzing git changes and using AI to generate well-structured PR descriptions. The system will analyze committed changes between branches, use Google Gemini to generate contextual descriptions following conventional commits and PR best practices, preview the content, and create the PR upon confirmation. Default flow: current branch → main, with support for custom branch targets.

## Technical Context

**Language/Version**: TypeScript 5.9+
**Primary Dependencies**: @google/genai ^1.38.0 (Gemini AI), zod ^4.3.6 (schema validation), @octokit/rest (GitHub API client - to be added)
**Storage**: File system (local git repository access)
**Testing**: N/A (testing not specified in requirements)
**Target Platform**: Node.js CLI (cross-platform: Windows, macOS, Linux)
**Project Type**: Single project (CLI tool)
**Performance Goals**: Generate complete PR description in <1 minute (per SC-001)
**Constraints**: Committed changes only (warns on uncommitted), requires GitHub authentication, requires "main" branch or explicit base
**Scale/Scope**: Single-user CLI tool, processes git diffs of typical feature branches (~5-50 files per PR)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Validation |
|-----------|--------|------------|
| **I. Specification-First Development** | ✅ PASS | Complete spec.md exists with user stories, acceptance criteria, and no implementation details. All requirements are technology-agnostic. |
| **II. Agent-Driven Workflow** | ✅ PASS | Following Specify → Clarify → Plan workflow. Clarification session completed with 5 Q&A. Human approval obtained before planning. |
| **III. Template-Based Consistency** | ✅ PASS | Using spec-template.md and plan-template.md. All clarifications resolved (no NEEDS CLARIFICATION markers remain). |
| **IV. Progressive Disclosure** | ✅ PASS | Loading minimal context per decision. Spec focused on 3 prioritized user stories. Using targeted file reads instead of full dumps. |
| **V. Independent Testability** | ✅ PASS | User stories prioritized (2xP1, 1xP2). Each story includes Independent Test description. P1 stories (generate + create) form complete MVP. |
| **VI. TypeScript + Zod Schema Validation** | ✅ PASS | Project uses TypeScript 5.9+ with strict mode. Zod 4.x already in dependencies. Will validate PR content schemas and GitHub API responses. |
| **VII. UI Layer Separation** | ✅ PASS | CLI-only feature. No UI layer involved. Business logic (git analysis, AI generation) will be in reusable TypeScript services. |
| **VIII. Constitution as Source of Truth** | ✅ PASS | This Constitution Check validates all outputs. No deviations required. |

**Overall Status**: ✅ ALL GATES PASSED - Proceed to Phase 0

**Justification for Complexity**: No additional complexity beyond constitution requirements. Single CLI project, reuses existing Gemini integration pattern from ticket triage.

## Project Structure

### Documentation (this feature)

```text
specs/001-pr-automation/
├── spec.md              # Feature specification (complete)
├── plan.md              # This file (in progress)
├── research.md          # Phase 0 output (pending)
├── data-model.md        # Phase 1 output (pending)
├── quickstart.md        # Phase 1 output (pending)
├── contracts/           # Phase 1 output (pending)
│   └── github-pr.json   # GitHub PR API contract
└── checklists/
    └── requirements.md  # Quality validation checklist (complete)
```

### Source Code (repository root)

```text
src/
├── cli.ts                    # Existing ticket triage CLI
├── gemini.ts                 # Existing Gemini AI client
├── schema.ts                 # Existing Zod schemas (ticket triage)
├── triage.ts                 # Existing ticket triage logic
├── rules.ts                  # Existing ticket rules
├── list-models.ts            # Existing Gemini model lister
├── pr/                       # NEW: PR automation feature
│   ├── pr-cli.ts             # New CLI entry point for PR automation
│   ├── git-analyzer.ts       # Git diff analysis service
│   ├── pr-generator.ts       # AI-powered PR description generator
│   ├── github-client.ts      # GitHub API integration
│   ├── pr-schema.ts          # Zod schemas for PR content
│   └── pr-formatter.ts       # Format PR content for display
└── lib/                      # Shared utilities (if needed)

data/
├── tickets/                  # Existing ticket data
└── .env                      # Environment variables (GEMINI_API_KEY, GITHUB_TOKEN)
```

**Structure Decision**: Single project structure (Option 1) selected. This is a CLI tool that extends the existing ticket-agent codebase. New PR automation code will be isolated in `src/pr/` directory to maintain clear feature boundaries while reusing existing infrastructure (Gemini client, Zod patterns, TypeScript config).

## Complexity Tracking

**Status**: No violations detected. No complexity justification required.

---

## Post-Design Constitution Re-Check

*GATE: Verify design artifacts maintain constitution compliance.*

| Principle | Status | Post-Design Validation |
|-----------|--------|------------------------|
| **I. Specification-First Development** | ✅ PASS | All design derives from spec.md. No implementation details added to spec during planning. |
| **II. Agent-Driven Workflow** | ✅ PASS | Plan phase complete. Phase 0 (research) and Phase 1 (data model, contracts, quickstart) artifacts generated. Ready for Phase 2 (tasks). |
| **III. Template-Based Consistency** | ✅ PASS | research.md, data-model.md, quickstart.md, and contracts/ all created following standard formats. No template deviations. |
| **IV. Progressive Disclosure** | ✅ PASS | Research focused on 5 key decisions. Data model defines 6 entities. Contract covers 3 API endpoints. Appropriate level of detail. |
| **V. Independent Testability** | ✅ PASS | Data model entities map to user stories. Each entity has validation rules enabling independent testing. |
| **VI. TypeScript + Zod Schema Validation** | ✅ PASS | data-model.md defines all Zod schemas needed. Research confirms TypeScript + Zod pattern continues. |
| **VII. UI Layer Separation** | ✅ PASS | All services (git-analyzer, pr-generator, github-client) designed as reusable modules. No UI coupling. |
| **VIII. Constitution as Source of Truth** | ✅ PASS | This re-check confirms compliance. Agent context updated via standard script. |

**Overall Status**: ✅ ALL GATES PASSED - Constitution compliance maintained throughout design

**Changes from Initial Check**: None. Design process introduced no violations.

---

## Planning Phase Summary

### Artifacts Generated

**Phase 0: Research**
- ✅ [research.md](research.md) - 5 technology decisions with rationales

**Phase 1: Design**
- ✅ [data-model.md](data-model.md) - 6 entities with validation rules and relationships
- ✅ [contracts/github-pr-api.json](contracts/github-pr-api.json) - GitHub API contract (3 endpoints)
- ✅ [quickstart.md](quickstart.md) - Complete setup and usage guide
- ✅ Agent context updated (copilot-instructions.md)

**Planning Complete**
- ✅ Technical Context defined (TypeScript, @octokit/rest, Gemini AI, Zod)
- ✅ Project Structure documented (src/pr/ module in single project)
- ✅ Constitution compliance verified (pre and post design)

### Key Decisions

1. **GitHub API Client**: @octokit/rest (official SDK with full TypeScript support)
2. **Git Analysis**: Native git commands via child_process (no additional dependencies)
3. **Authentication**: Personal Access Token in .env (consistent with existing pattern)
4. **Commit Format**: Conventional Commits standard (feat/fix/refactor/etc)
5. **AI Prompting**: Structured prompts with diff context for consistent PR generation

### Dependencies to Add

```json
{
  "@octokit/rest": "^20.0.0"
}
```

Existing dependencies reused: `@google/genai`, `zod`, `dotenv`

### Next Phase

**Ready for**: `/speckit.tasks` - Generate implementation tasks from user stories

**Estimated Implementation**:
- **P1 Stories (MVP)**: 5-8 implementation tasks
- **P2 Story (Custom branches)**: 2-3 implementation tasks
- **Total**: ~7-11 tasks organized by user story priority

**No blockers identified**. All clarifications resolved. Constitution compliant. Ready to implement.
