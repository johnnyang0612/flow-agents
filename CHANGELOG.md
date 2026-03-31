# Changelog

## [1.0.0] - 2026-03-31

### Added
- Agent 0: Coordinator (`/flow`) — dispatches, monitors, notifies
- Agent 1: Requirements Analyst (`/flow-analyze`) — multi-format parsing
- Agent 2: PRD Architect (`/flow-plan`) — 5-perspective PRD with acceptance criteria
- Agent 3: Builder (`/flow-build`) — implement, deploy, self-test
- Agent 4: QA Reviewer (`/flow-review`) — code review, security scan, E2E QA
- Agent 5: Research Guardian (`/flow-research`) — deep research, stability audit
- Pipeline initializer (`/flow-init`) — auto-detects project context
- Install scripts for Windows (PowerShell) and Unix (Bash)
- Handoff protocol for inter-agent communication
- Persistent session logging with queryable index
- `.pipeline/` workspace structure with inbox, PRD, reports
