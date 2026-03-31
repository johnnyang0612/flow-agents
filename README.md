# Flow Agents

Multi-agent development pipeline for [Claude Code](https://claude.ai/code). Automates the full SDLC — from customer requirements intake through PRD, implementation, QA review, and deployment.

## Architecture

```
┌─────────────────────────────────────────────────┐
│            Agent 0: /flow (Coordinator)          │
│        Dispatch, monitor, query, notify          │
└─────┬──────┬──────┬──────┬──────┬───────────────┘
      │      │      │      │      │
   ┌──▼─┐ ┌──▼─┐ ┌──▼─┐ ┌──▼─┐ ┌──▼─┐
   │ A1 │→│ A2 │→│ A3 │→│ A4 │ │ A5 │
   │Req │ │PRD │ │Build│ │ QA │ │Res │
   └────┘ └────┘ └────┘ └──┬─┘ └────┘
                            │ FAIL?
                            └→ Back to A1
```

| Agent | Command | Role |
|-------|---------|------|
| 0 | `/flow` | Coordinator — dispatches agents, tracks state, notifies admin |
| 1 | `/flow-analyze` | Requirements Analyst — parses any format (md/txt/pdf/images/video) |
| 2 | `/flow-plan` | PRD Architect — multi-perspective PRD with acceptance criteria |
| 3 | `/flow-build` | Builder — implements, deploys, self-tests against criteria |
| 4 | `/flow-review` | QA Reviewer — code review, security scan, E2E testing |
| 5 | `/flow-research` | Research Guardian — deep research, stability audit |

## Install

### Windows (PowerShell)
```powershell
git clone https://github.com/johnnyang0612/flow-agents.git
cd flow-agents
.\install.ps1
```

### macOS / Linux / Git Bash
```bash
git clone https://github.com/johnnyang0612/flow-agents.git
cd flow-agents
chmod +x install.sh
./install.sh
```

This copies the agent commands to `~/.claude/commands/` — making them available in **every** Claude Code project.

## Update

```bash
cd flow-agents
git pull
./install.sh    # or .\install.ps1 on Windows
```

## Usage

### 1. Initialize in any project

Open Claude Code in your project directory and run:
```
/flow-init
```

This creates a `.pipeline/` workspace:
```
.pipeline/
├── config.json       # Auto-detected project metadata
├── inbox/            # Drop requirements here (any format)
├── prd/              # Generated PRDs (git tracked)
├── handoffs/         # Agent-to-agent communication (gitignored)
├── logs/             # Conversation history (gitignored)
└── reports/          # QA reports, research findings
```

### 2. Drop requirements

Put customer feedback files in `.pipeline/inbox/`:
- Markdown, text, PDF, images, videos — anything goes
- Name them: `YYYY-MM-DD_description.ext`

### 3. Run the pipeline

**Full auto (Coordinator decides):**
```
/flow
```

**Step by step:**
```
/flow-analyze          # Parse requirements
/flow-plan             # Generate PRD
/flow-build            # Implement & deploy
/flow-review           # Code review & QA
/flow-research         # Deep research (on-demand)
```

### 4. Pipeline loop

If `/flow-review` finds issues:
- Minor fixes → Agent 3 fixes → re-review
- Major issues → back to Agent 1 → full cycle
- Max 3 cycles, then escalates to admin

### 5. Check status

```
/flow status           # Current pipeline state
/flow history          # All past sessions
/flow session <ID>     # Specific session details
```

## How It Works

### Handoff Protocol
Each agent writes a structured handoff document when done. The next agent reads it to understand context, decisions, and expected outputs.

### Persistent Logging
Every agent interaction is logged to `.pipeline/logs/SESSION-ID.md`. Sessions are indexed in `sessions.json` for querying.

### Project Detection
`/flow-init` auto-detects your project's stack, monorepo structure, deployment target, and coding conventions from `package.json`, `CLAUDE.md`, `tsconfig.json`, etc.

## Customization

### Per-project config
Edit `.pipeline/config.json` to customize:
- `maxCycles` — max review loops before escalation (default: 3)
- `notifications.method` — how admin gets notified
- `project.deployNotes` — project-specific deployment instructions

### Extend agents
The commands in `~/.claude/commands/flow*.md` are plain Markdown. Edit them to add project-specific rules, tools, or workflows.

## File Structure

```
flow-agents/
├── commands/           # Agent command definitions
│   ├── flow.md         # Agent 0: Coordinator
│   ├── flow-init.md    # Pipeline initializer
│   ├── flow-analyze.md # Agent 1: Requirements
│   ├── flow-plan.md    # Agent 2: PRD
│   ├── flow-build.md   # Agent 3: Builder
│   ├── flow-review.md  # Agent 4: QA
│   └── flow-research.md# Agent 5: Research
├── templates/          # Workspace templates
├── install.sh          # Unix installer
├── install.ps1         # Windows installer
├── README.md
├── CHANGELOG.md
└── LICENSE
```

## License

MIT
