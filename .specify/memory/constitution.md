<!--
SYNC IMPACT REPORT (Version 1.0.0)
===========================================
VERSION CHANGE: Initial constitution → 1.0.0
RATIONALE: First formal ratification of SpecKit governance principles

PRINCIPLES ESTABLISHED:
  - I. Specification-First Development (NEW)
  - II. Agent-Driven Workflow (NEW)
  - III. Template-Based Consistency (NEW)
  - IV. Progressive Disclosure (NEW)
  - V. Independent Testability (NEW)
  - VI. TypeScript + Zod Schema Validation (NEW)
  - VII. UI Layer Separation (NEW)
  - VIII. Constitution as Source of Truth (NEW)

SECTIONS ADDED:
  - Technology Stack & Architecture (NEW)
  - Validation Gates & Quality Assurance (NEW)

TEMPLATE SYNC STATUS:
  ✅ plan-template.md - Constitution Check section already present
  ✅ spec-template.md - User story prioritization aligns with Principle V
  ✅ tasks-template.md - Story-based organization aligns with Principle V
  ✅ Agent files - All 9 agents validated for constitution references

FOLLOW-UP ACTIONS:
  - None required
===========================================
-->

# SpecKit Constitution

## Core Principles

### I. Specification-First Development

Every feature MUST originate from a complete, approved specification before any implementation begins. Specifications MUST be technology-agnostic, focusing on WHAT the system delivers rather than HOW it is built. The specification defines user scenarios, acceptance criteria, and business requirements without prescribing technical solutions.

**Non-Negotiable Rules:**
- No code implementation without a validated `spec.md` file
- Specifications MUST declare user stories with Given-When-Then acceptance scenarios
- All downstream artifacts (`plan.md`, `tasks.md`) MUST derive from and trace back to the specification
- Changes to requirements MUST update the specification before modifying implementation

**Rationale**: Specification-first ensures alignment between stakeholders and implementers, reduces rework from misunderstood requirements, and provides a single source of truth for feature scope. It separates problem definition from solution design.

### II. Agent-Driven Workflow

The development lifecycle is orchestrated by specialized AI agents, each responsible for a distinct phase. Agents MUST hand off work products to the next phase through well-defined artifacts. Human approval is required at specification gates before proceeding to implementation planning.

**Non-Negotiable Rules:**
- Each workflow phase MUST have a dedicated agent defined in `.github/agents/*.agent.md`
- Agents MUST document their inputs, outputs, and handoff artifacts explicitly
- Agent prompts MUST be version-controlled and include constitution validation steps
- The workflow sequence is: Specify → Clarify → Plan → Analyze → Tasks → Implement
- Human approval MUST be obtained after Specify and Clarify phases before proceeding

**Rationale**: Agent specialization ensures each phase receives expert attention without phase bleed. Version-controlled agents provide predictable, auditable workflows. Human gates prevent premature commitment to implementation before requirements are solidified.

### III. Template-Based Consistency

All workflow artifacts MUST conform to canonical templates defined in `.specify/templates/`. Templates enforce mandatory sections, provide structural consistency, and act as implicit validation checklists. Deviations MUST be justified and documented.

**Non-Negotiable Rules:**
- `spec.md` MUST follow `spec-template.md` structure
- `plan.md` MUST follow `plan-template.md` structure with Constitution Check section
- `tasks.md` MUST follow `tasks-template.md` structure with user story grouping
- Checklists MUST use sequential `CHK###` IDs with traceability markers
- All placeholders (e.g., `[NEEDS CLARIFICATION]`) MUST be resolved before phase handoff
- No "hallucinated" content - unknowns MUST be explicitly marked for clarification

**Rationale**: Templates reduce cognitive load, ensure completeness, and enable automated validation. They serve as forcing functions for quality, preventing incomplete or ambiguous artifacts from propagating downstream.

### IV. Progressive Disclosure

Load and process context incrementally rather than dumping entire codebases or documents. Prioritize high-signal findings over exhaustive documentation. Optimize for token efficiency and focused decision-making.

**Non-Negotiable Rules:**
- Agents MUST load only the minimal necessary context per decision point
- Use targeted searches (semantic, grep) before reading full files
- Limit clarification questions to 3-5 critical items maximum per interaction
- Default to informed industry standards rather than asking for every minor detail
- Analysis reports MUST surface CRITICAL and MAJOR issues first, grouping MINOR items

**Rationale**: Token efficiency reduces costs and latency. Progressive disclosure keeps agents focused on high-impact decisions rather than drowning in low-value details. Informed defaults accelerate workflows without sacrificing quality.

### V. Independent Testability

User stories MUST be independently implementable, testable, and deployable. Each story represents a vertical slice of functionality that delivers value in isolation. Prioritization (P1, P2, P3) enables MVP-first delivery without dependency hell.

**Non-Negotiable Rules:**
- User stories MUST be prioritized (P1 for critical MVP features, P2/P3 for enhancements)
- Each user story MUST include an "Independent Test" description proving it can be validated standalone
- Acceptance scenarios MUST use Given-When-Then format
- Tasks MUST be organized by user story to enable parallel team execution
- P1 stories collectively MUST form a complete, demonstrable MVP

**Rationale**: Independent stories enable agile iteration, parallel development, and incremental delivery. They reduce integration risk and allow early validation with users. MVP-first focus prevents gold-plating before proving core value.

### VI. TypeScript + Zod Schema Validation

All core logic MUST be written in TypeScript with strict type checking enabled. All structured data (inputs, outputs, API contracts) MUST be validated using Zod schemas before processing.

**Non-Negotiable Rules:**
- TypeScript MUST be used for all source code in `src/`
- `tsconfig.json` MUST enable strict mode (`"strict": true`)
- Zod schemas MUST validate all external inputs (CLI args, API requests, file contents)
- JSON MUST be the primary data interchange format for inter-agent communication
- CLI tools MUST support both JSON output (`--json`) and human-readable formats

**Rationale**: TypeScript catches type errors at compile time, reducing runtime failures. Zod provides runtime validation that mirrors TypeScript types, ensuring data integrity at system boundaries. JSON enables programmatic composition of tools.

### VII. UI Layer Separation

The planned Nuxt 4 UI layer MUST remain a thin presentation layer, consuming existing TypeScript services without duplicating business logic. API contracts define clear boundaries between backend services and frontend.

**Non-Negotiable Rules:**
- Backend services MUST be reusable across both CLI and web UI contexts
- API contracts in `contracts/` MUST define all frontend-backend interactions
- Nuxt components MUST NOT contain business logic or direct data transformations
- Server-side logic MUST be implemented in standalone TypeScript modules first
- UI state management MUST be limited to presentation concerns (loading, validation errors)

**Rationale**: Separating business logic from presentation prevents duplication, ensures consistency between CLI and web interfaces, and maintains testability. Backend services remain the authoritative implementation regardless of UI technology changes.

### VIII. Constitution as Source of Truth

This constitution supersedes all other development practices, conventions, and informal agreements. All agents MUST validate their outputs against constitution principles before handoff. Violations MUST be flagged as CRITICAL issues.

**Non-Negotiable Rules:**
- Agents MUST include constitution validation as an explicit step in their workflow
- The `/speckit.analyze` command MUST flag constitution violations as CRITICAL priority
- Constitution amendments MUST follow the governance process defined below
- Breaking a principle requires explicit justification in a "Constitution Deviation" section of the plan
- Complexity not justified by constitution principles MUST be removed

**Rationale**: A single, authoritative governance document prevents divergence, ensures predictable quality, and provides an appeals mechanism for architectural decisions. It empowers developers to reject unjustified complexity.

## Technology Stack & Architecture

**Language**: TypeScript 5.9+ with strict mode enabled

**Runtime**: Node.js (ES modules) via `"type": "module"` in package.json

**Validation**: Zod 4.x for runtime schema validation and type inference

**AI Integration**: Google Gemini 1.5 Flash for AI-enhanced processing

**Future UI**: Nuxt 4 + Nuxt UI (presentation layer only, consuming existing backend services)

**Data Format**: JSON for all structured data interchange (CLI I/O, API contracts, agent communication)

**File Structure**:
- `src/` - Core TypeScript services and CLI entry points
- `specs/[###-feature]/` - Feature documentation (spec, plan, research, data-model, contracts, tasks)
- `.specify/templates/` - Canonical templates for all workflow artifacts
- `.specify/memory/` - Constitution and other governance documents
- `.github/agents/` - Agent definition files
- `data/` - Runtime data storage (tickets, outputs, etc.)

**CLI Conventions**:
- All CLI tools MUST support `--json` flag for machine-readable output
- Human-readable output MUST be concise and actionable
- Exit codes: 0 = success, non-zero = error
- Errors MUST be written to stderr, not stdout

## Validation Gates & Quality Assurance

**Phase 0: Specification**
- Constitution validation: Does the feature align with core principles?
- User story completeness: Are scenarios testable and prioritized?
- Acceptance criteria clarity: Can a developer implement without guessing?

**Phase 1: Planning**
- Constitution Check section MUST pass validation
- Technical context MUST resolve all `[NEEDS CLARIFICATION]` placeholders
- Data model MUST define all entities, relationships, and validation rules
- Contracts MUST specify all API endpoints, request/response schemas, error codes

**Phase 2: Task Generation**
- Task organization MUST group by user story (US1, US2, etc.)
- Parallel tasks MUST be marked with `[P]` prefix
- File paths MUST be explicit and match project structure from plan
- Test tasks MUST be included only if explicitly requested in spec

**Phase 3: Analysis**
- Cross-artifact consistency check across spec, plan, tasks
- Constitution violation flagging (CRITICAL priority)
- Ambiguity detection (e.g., same entity defined differently across files)
- Missing traceability (e.g., tasks not mapping back to user stories)

**Phase 4: Implementation**
- Code MUST compile without TypeScript errors
- Zod schemas MUST validate all boundary inputs
- User stories MUST be completable independently
- Each PR MUST reference tasks and link back to spec

## Governance

**Authority**: This constitution is the supreme governing document for SpecKit development. In any conflict between this document and other practices, the constitution prevails.

**Amendment Process**:
1. Proposed changes MUST include rationale, impact analysis, and affected artifacts
2. Version bump MUST follow semantic versioning:
   - **MAJOR**: Backward-incompatible governance changes (principle removal/redefinition)
   - **MINOR**: New principles added or sections materially expanded
   - **PATCH**: Clarifications, wording fixes, non-semantic refinements
3. All templates MUST be updated to reflect amendments before finalization
4. Amendment date MUST be recorded in `LAST_AMENDED_DATE`

**Versioning Policy**: Use semantic versioning (MAJOR.MINOR.PATCH) to communicate impact of changes

**Compliance Review**: The `/speckit.analyze` command enforces constitution compliance and flags violations as CRITICAL issues requiring resolution before implementation

**Deviation Protocol**: If a feature requires violating a principle, it MUST:
- Document the deviation in a "Constitution Deviation" section of `plan.md`
- Provide technical and business justification
- Specify mitigation measures or alternative approaches considered
- Obtain explicit human approval before proceeding

**Template Sync**: All amendments MUST trigger review and update of:
- `.specify/templates/plan-template.md`
- `.specify/templates/spec-template.md`
- `.specify/templates/tasks-template.md`
- `.github/agents/*.agent.md` (if workflow changes)

**Version**: 1.0.0 | **Ratified**: 2026-02-05 | **Last Amended**: 2026-02-05
