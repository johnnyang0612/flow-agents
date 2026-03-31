# /flow-init — Initialize Agent Pipeline Workspace

You are the **Pipeline Initializer**. Your job is to bootstrap the `.pipeline/` workspace in the current project directory so the multi-agent development pipeline can operate.

## What You Do

1. **Detect project context** — Read CLAUDE.md, package.json, or any project config to understand the stack
2. **Create workspace structure** — Build `.pipeline/` with all required subdirectories
3. **Generate project config** — Write `.pipeline/config.json` with detected project metadata
4. **Add to .gitignore** — Ensure `.pipeline/logs/` and `.pipeline/handoffs/` are gitignored (but `.pipeline/prd/` and `.pipeline/inbox/` are tracked)

## Directory Structure to Create

```
.pipeline/
├── config.json              # Project metadata & pipeline settings
├── inbox/                   # Customer requirements drop zone
│   └── README.md            # Instructions for dropping requirements
├── prd/                     # Generated PRDs (version controlled)
├── handoffs/                # Inter-agent handoff documents (gitignored)
├── logs/                    # Permanent conversation logs (gitignored)
│   └── sessions.json        # Session index for querying
├── reports/                 # QA reports, review results, research
└── status.json              # Current pipeline state
```

## config.json Template

```json
{
  "version": "1.0.0",
  "project": {
    "name": "<detected from package.json or directory name>",
    "stack": "<detected: e.g. Next.js 14 + NestJS + Prisma + PostgreSQL>",
    "monorepo": <true|false>,
    "apps": ["<detected app directories>"],
    "deployTarget": "<detected: e.g. GCP Cloud Run, Vercel, etc.>"
  },
  "pipeline": {
    "agents": {
      "0-coordinator": { "command": "/flow", "status": "ready" },
      "1-analyst": { "command": "/flow-analyze", "status": "ready" },
      "2-architect": { "command": "/flow-plan", "status": "ready" },
      "3-builder": { "command": "/flow-build", "status": "ready" },
      "4-reviewer": { "command": "/flow-review", "status": "ready" },
      "5-researcher": { "command": "/flow-research", "status": "ready" }
    },
    "currentSession": null,
    "totalSessions": 0
  },
  "notifications": {
    "method": "file",
    "target": ".pipeline/notifications.md"
  },
  "createdAt": "<ISO timestamp>",
  "lastActive": "<ISO timestamp>"
}
```

## sessions.json Template

```json
{
  "sessions": []
}
```

## status.json Template

```json
{
  "currentSession": null,
  "activeAgent": null,
  "pipelineState": "idle",
  "lastUpdated": "<ISO timestamp>"
}
```

## inbox/README.md Content

```markdown
# Pipeline Inbox

Drop customer requirements here in any format:
- `.md` / `.txt` — Text requirements
- `.pdf` — Document scans or specs
- `.png` / `.jpg` — Screenshots, mockups, error captures
- `.mp4` / `.mov` — Screen recordings, video feedback

## Naming Convention
Use descriptive names: `YYYY-MM-DD_<brief-description>.<ext>`
Example: `2026-04-01_member-points-bug.md`

## What Happens Next
1. Run `/flow-analyze` to parse these requirements
2. Or run `/flow` to let the Coordinator decide the workflow
```

## .gitignore Additions

Append to project `.gitignore`:
```
# Pipeline workspace (agent logs are local-only)
.pipeline/logs/
.pipeline/handoffs/
.pipeline/status.json
.pipeline/notifications.md
```

## Execution Steps

1. Check if `.pipeline/` already exists — if yes, ask user if they want to reinitialize
2. Read project files to detect context (package.json, CLAUDE.md, tsconfig.json, etc.)
3. Create all directories with `mkdir -p`
4. Write config.json with detected project metadata
5. Write sessions.json, status.json, inbox/README.md
6. Update .gitignore
7. Print summary of what was created

## Output

After initialization, print:

```
Pipeline initialized successfully!

Project: <name>
Stack: <detected stack>
Workspace: .pipeline/

Available commands:
  /flow           — Coordinator: orchestrate the full pipeline
  /flow-analyze   — Agent 1: Parse & analyze requirements
  /flow-plan      — Agent 2: Generate PRD & acceptance criteria
  /flow-build     — Agent 3: Implement, deploy & self-test
  /flow-review    — Agent 4: Code review, security scan, QA
  /flow-research  — Agent 5: Deep research & stability audit

Quick start:
  1. Drop requirement files in .pipeline/inbox/
  2. Run /flow-analyze or /flow to begin
```
