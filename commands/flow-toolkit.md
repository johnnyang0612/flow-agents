# /flow-toolkit — Shared Toolkit Reference for All Pipeline Agents

This is a reference document. All Flow Agents should use these tools intelligently for maximum quality.

## MCP Tools Available

### Playwright (Browser Automation)
- `browser_navigate` — Open URLs, test deployed apps
- `browser_snapshot` — Get page accessibility tree (fast, use for logic)
- `browser_take_screenshot` — Visual verification (use for UI review)
- `browser_click` / `browser_fill_form` — Interact with pages
- `browser_console_messages` — Check for JS errors
- `browser_network_requests` — Verify API calls
- `browser_evaluate` — Run JS in browser context
- **When:** E2E testing, visual QA, verifying deployed features, taking evidence screenshots

### Exa (Neural Web Search)
- `web_search_exa` — Search web with AI-powered relevance
- `crawling_exa` — Deep crawl a specific URL
- `get_code_context_exa` — Find code examples for a specific topic
- **When:** Researching best practices, finding code patterns, investigating technologies

### Context7 (Library Documentation)
- `resolve-library-id` → `query-docs` — Get current docs for any library/framework
- **When:** Before using ANY library API, checking method signatures, migration guides
- **Critical:** Always check docs before writing code — training data may be outdated

### GitHub
- `search_code` / `search_issues` — Search across repos
- `create_issue` / `add_issue_comment` — Track issues
- `create_pull_request` — Open PRs
- `get_file_contents` — Read files from other repos
- **When:** Researching how others solved similar problems, managing PRs

### Memory (Knowledge Graph)
- `create_entities` / `add_observations` — Store learned patterns
- `search_nodes` / `read_graph` — Recall past knowledge
- **When:** Remembering cross-session patterns, storing research findings

### Sequential Thinking
- `sequentialthinking` — Step-by-step reasoning for complex problems
- **When:** Analyzing complex requirements, making architectural decisions, debugging tricky issues

## ECC Skills Available (invoke via Skill tool)

### For Agent 1 (Requirements Analyst)
- `/deep-research` — Multi-source research when requirements reference external systems
- `/docs` — Look up library docs via Context7

### For Agent 2 (PRD Architect)
- `/plan` — Structured implementation planning
- `/docs` — Verify API availability before specifying in PRD

### For Agent 3 (Builder)
- `/tdd` — Test-driven development workflow (write tests first)
- `/verification-loop` — Comprehensive verification (build, test, lint, typecheck)
- `/simplify` — Review code for quality after writing
- `/e2e` — Generate and run Playwright E2E tests
- `/docs` — Look up library APIs while coding

### For Agent 4 (QA Reviewer)
- `/security-scan` — Scan for security vulnerabilities
- `/simplify` — Review code for reuse/quality/efficiency
- `/e2e` — Generate and run E2E tests for verification
- `/react-best-practices` — Review React/TSX component quality (via Skill tool)
- `/verification-loop` — Full build/test/lint/typecheck cycle

### For Agent 5 (Research Guardian)
- `/deep-research` — Multi-source deep research with citations
- `/docs` — Current library documentation
- `/benchmark` — Performance measurement
- `/security-scan` — Security audit

## Built-in Tools (Always Available)

| Tool | When to Use |
|------|-------------|
| `Agent` | Spawn sub-agents for parallel work |
| `Bash` | Run shell commands: git, pnpm, build, deploy, tests |
| `Read` | Read files, images, PDFs |
| `Write` | Create new files |
| `Edit` | Modify existing files (preferred over Write for changes) |
| `Glob` | Find files by pattern |
| `Grep` | Search file contents |
| `WebFetch` | Fetch a specific URL |
| `WebSearch` | General web search |

## Smart Tool Selection Guidelines

1. **Before writing any code** → Check docs with Context7 for the libraries you'll use
2. **Before making architecture decisions** → Use Sequential Thinking to reason step-by-step
3. **After writing code** → Run /verification-loop or /simplify
4. **For security-sensitive changes** → Run /security-scan
5. **For UI changes** → Use Playwright to visually verify + /react-best-practices
6. **For unknown technologies** → Use /deep-research or Exa search first
7. **For E2E verification** → Use Playwright to test actual user flows
8. **For performance concerns** → Use /benchmark
9. **When stuck on a problem** → Use Sequential Thinking before escalating
