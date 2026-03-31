#!/bin/bash
# Flow Agents — Install Script (macOS / Linux / Git Bash on Windows)
# Usage: ./install.sh [--update]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMANDS_SRC="$SCRIPT_DIR/commands"
COMMANDS_DST="$HOME/.claude/commands"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo "========================================="
echo "  Flow Agents — Multi-Agent Pipeline"
echo "========================================="
echo ""

# Check source files exist
if [ ! -d "$COMMANDS_SRC" ]; then
  echo "Error: commands/ directory not found. Run this script from the repo root."
  exit 1
fi

# Create target directory
mkdir -p "$COMMANDS_DST"

# Count files
TOTAL=$(ls "$COMMANDS_SRC"/flow*.md 2>/dev/null | wc -l)

if [ "$TOTAL" -eq 0 ]; then
  echo "Error: No flow*.md files found in commands/"
  exit 1
fi

# Copy commands
echo "Installing $TOTAL agent commands to $COMMANDS_DST ..."
echo ""

for file in "$COMMANDS_SRC"/flow*.md; do
  filename=$(basename "$file")
  cp "$file" "$COMMANDS_DST/$filename"
  echo -e "  ${GREEN}+${NC} $filename"
done

echo ""
echo -e "${GREEN}Installation complete!${NC}"
echo ""
echo "Available commands:"
echo "  /flow-init      Initialize pipeline in any project"
echo "  /flow           Coordinator: orchestrate the pipeline"
echo "  /flow-analyze   Agent 1: Parse & analyze requirements"
echo "  /flow-plan      Agent 2: Generate PRD & acceptance criteria"
echo "  /flow-build     Agent 3: Implement, deploy & self-test"
echo "  /flow-review    Agent 4: Code review, security scan, QA"
echo "  /flow-research  Agent 5: Deep research & stability audit"
echo ""
echo "Quick start:"
echo "  1. Open Claude Code in any project"
echo "  2. Run /flow-init to create the pipeline workspace"
echo "  3. Drop requirements in .pipeline/inbox/"
echo "  4. Run /flow to start"
echo ""

# Check if in a project directory, offer to init
if [ "$1" != "--update" ] && [ ! -d ".pipeline" ]; then
  echo -e "${YELLOW}Tip:${NC} Run /flow-init inside Claude Code to set up the pipeline in your current project."
fi
