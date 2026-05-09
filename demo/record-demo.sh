#!/bin/bash

#
# IAB Deals MCP Server - Real Demo Recording Script
#
# Records your screen while you interact with Claude Desktop,
# guiding you through each demo scene with clipboard prompts.
#
# Usage:
#   ./demo/record-demo.sh
#
# Prerequisites:
#   - ffmpeg installed (brew install ffmpeg)
#   - Claude Desktop running with iab-deals MCP server configured
#   - MCP server built (npm run build)
#
# After recording:
#   npx tsx demo/generate-voiceover.ts
#   ./demo/merge-video-audio.sh
#

set -e

# ─── Configuration ──────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
SCENES_FILE="${SCRIPT_DIR}/scenes.json"
OUTPUT_DIR="${SCRIPT_DIR}/test-results"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
RAW_FILE="${OUTPUT_DIR}/raw-recording-${TIMESTAMP}.mov"
OUTPUT_FILE="${OUTPUT_DIR}/demo-recording-${TIMESTAMP}.mp4"
FFMPEG_PID=""

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m' # No Color

# ─── Helper Functions ───────────────────────────────────────────────────────

print_header() {
    echo ""
    echo -e "${BOLD}${BLUE}════════════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}${BLUE}  IAB Deals MCP Server - Demo Recorder${NC}"
    echo -e "${BOLD}${BLUE}════════════════════════════════════════════════════════${NC}"
    echo ""
}

print_scene() {
    local id="$1"
    local act="$2"
    local title="$3"
    local instruction="$4"

    echo ""
    echo -e "${BOLD}${CYAN}────────────────────────────────────────────────────────${NC}"
    echo -e "${BOLD}${CYAN}  Scene ${id}: ${act} — ${title}${NC}"
    echo -e "${BOLD}${CYAN}────────────────────────────────────────────────────────${NC}"
    echo ""
    echo -e "${YELLOW}  ${instruction}${NC}"
    echo ""
}

print_prompt() {
    local prompt="$1"
    echo -e "${GREEN}  Prompt (copied to clipboard):${NC}"
    echo -e "${DIM}  ┌─────────────────────────────────────────────────────${NC}"
    echo -e "${DIM}  │${NC} ${prompt}"
    echo -e "${DIM}  └─────────────────────────────────────────────────────${NC}"
    echo ""
}

cleanup() {
    if [ -n "$FFMPEG_PID" ] && kill -0 "$FFMPEG_PID" 2>/dev/null; then
        echo ""
        echo -e "${YELLOW}Stopping recording...${NC}"
        kill -INT "$FFMPEG_PID" 2>/dev/null
        wait "$FFMPEG_PID" 2>/dev/null || true
    fi
}

trap cleanup EXIT INT TERM

# ─── Pre-flight Checks ─────────────────────────────────────────────────────

print_header

echo -e "${BOLD}Pre-flight Checks${NC}"
echo ""

# Check ffmpeg
if ! command -v ffmpeg &>/dev/null; then
    echo -e "${RED}  [FAIL] ffmpeg is not installed${NC}"
    echo "         Install with: brew install ffmpeg"
    exit 1
fi
echo -e "${GREEN}  [OK] ffmpeg installed${NC}"

# Check jq (needed to parse scenes.json)
if ! command -v jq &>/dev/null; then
    echo -e "${RED}  [FAIL] jq is not installed${NC}"
    echo "         Install with: brew install jq"
    exit 1
fi
echo -e "${GREEN}  [OK] jq installed${NC}"

# Check scenes file
if [ ! -f "$SCENES_FILE" ]; then
    echo -e "${RED}  [FAIL] scenes.json not found at ${SCENES_FILE}${NC}"
    exit 1
fi
echo -e "${GREEN}  [OK] scenes.json found${NC}"

# Check MCP server is built
if [ ! -f "${PROJECT_DIR}/dist/index.js" ]; then
    echo -e "${YELLOW}  [WARN] MCP server not built. Building now...${NC}"
    (cd "$PROJECT_DIR" && npm run build)
fi
echo -e "${GREEN}  [OK] MCP server built (dist/index.js)${NC}"

# Check Claude Desktop is running
if ! pgrep -x "Claude" >/dev/null 2>&1; then
    echo -e "${YELLOW}  [WARN] Claude Desktop is not running${NC}"
    echo -e "         Opening Claude Desktop..."
    open -a "Claude"
    sleep 3
fi
echo -e "${GREEN}  [OK] Claude Desktop is running${NC}"

echo ""

# ─── Reset Demo Database ───────────────────────────────────────────────────

echo -e "${BOLD}Database Reset${NC}"
echo ""

DB_FILE="${PROJECT_DIR}/data/deals.db"
if [ -f "$DB_FILE" ]; then
    rm -f "$DB_FILE"
    echo -e "${GREEN}  [OK] Deleted existing deals.db${NC}"
else
    echo -e "${DIM}  [OK] No existing deals.db (clean state)${NC}"
fi

echo ""
echo -e "${YELLOW}  IMPORTANT: Restart Claude Desktop to pick up fresh seed data.${NC}"
echo -e "${YELLOW}  You can do this by quitting Claude (Cmd+Q) and reopening it.${NC}"
echo ""
read -rp "  Press Enter when Claude Desktop is restarted and ready... "

# ─── Create Output Directory ───────────────────────────────────────────────

mkdir -p "$OUTPUT_DIR"

# ─── Positioning ────────────────────────────────────────────────────────────

echo ""
echo -e "${BOLD}Window Setup${NC}"
echo ""
echo -e "  Position Claude Desktop so it fills most of your screen."
echo -e "  Make sure the MCP server ${CYAN}iab-deals${NC} is visible in Claude's"
echo -e "  tool list (click the hammer icon)."
echo ""
echo -e "${DIM}  Recommended: Use a clean conversation (Cmd+N for new chat).${NC}"
echo ""
read -rp "  Press Enter when your window is positioned and ready to record... "

# ─── Start FFmpeg Recording ────────────────────────────────────────────────

echo ""
echo -e "${BOLD}Starting Screen Recording${NC}"
echo ""

# List available screens
echo -e "${DIM}  Available capture devices:${NC}"
ffmpeg -f avfoundation -list_devices true -i "" 2>&1 | grep -E "^\[AVFoundation" | grep -i "screen\|capture\|display" || true
echo ""

# Default to screen index 1 (main display on most Macs)
SCREEN_INDEX="${SCREEN_INDEX:-1}"
echo -e "  Recording screen index: ${CYAN}${SCREEN_INDEX}${NC}"
echo -e "${DIM}  (Set SCREEN_INDEX env var to change, e.g., SCREEN_INDEX=2 ./demo/record-demo.sh)${NC}"
echo ""

# Start recording in the background
ffmpeg -f avfoundation -capture_cursor 1 -capture_mouse_clicks 1 \
    -framerate 30 -i "${SCREEN_INDEX}:none" \
    -c:v libx264 -preset ultrafast -crf 18 \
    -pix_fmt yuv420p \
    "$RAW_FILE" \
    -loglevel warning \
    </dev/null &
FFMPEG_PID=$!

# Give ffmpeg a moment to start
sleep 2

if ! kill -0 "$FFMPEG_PID" 2>/dev/null; then
    echo -e "${RED}  [FAIL] ffmpeg failed to start recording${NC}"
    echo "         Try a different SCREEN_INDEX value."
    exit 1
fi

echo -e "${GREEN}  [OK] Recording started (PID: ${FFMPEG_PID})${NC}"
echo ""
echo -e "${RED}${BOLD}  >>> RECORDING IS LIVE <<<${NC}"
echo ""

# ─── Scene Loop ─────────────────────────────────────────────────────────────

SCENE_COUNT=$(jq length "$SCENES_FILE")

for i in $(seq 0 $((SCENE_COUNT - 1))); do
    # Parse scene data
    SCENE_ID=$(jq -r ".[$i].id" "$SCENES_FILE")
    SCENE_ACT=$(jq -r ".[$i].act" "$SCENES_FILE")
    SCENE_TITLE=$(jq -r ".[$i].title" "$SCENES_FILE")
    SCENE_PROMPT=$(jq -r ".[$i].prompt" "$SCENES_FILE")
    SCENE_CLIPBOARD=$(jq -r ".[$i].clipboard" "$SCENES_FILE")
    SCENE_INSTRUCTION=$(jq -r ".[$i].instruction" "$SCENES_FILE")

    # Display scene info
    print_scene "$SCENE_ID" "$SCENE_ACT" "$SCENE_TITLE" "$SCENE_INSTRUCTION"

    # Copy prompt to clipboard if applicable
    if [ "$SCENE_CLIPBOARD" = "true" ] && [ "$SCENE_PROMPT" != "null" ]; then
        echo "$SCENE_PROMPT" | pbcopy
        print_prompt "$SCENE_PROMPT"
    fi

    # Beep to signal scene is ready
    printf '\a'

    # Wait for user to complete the scene
    if [ $i -lt $((SCENE_COUNT - 1)) ]; then
        read -rp "  Press Enter when this scene is complete... "
    else
        read -rp "  Press Enter to stop recording... "
    fi
done

# ─── Stop Recording ────────────────────────────────────────────────────────

echo ""
echo -e "${YELLOW}Stopping recording...${NC}"
kill -INT "$FFMPEG_PID" 2>/dev/null
wait "$FFMPEG_PID" 2>/dev/null || true
FFMPEG_PID=""

sleep 1

# ─── Post-process ──────────────────────────────────────────────────────────

if [ ! -f "$RAW_FILE" ]; then
    echo -e "${RED}  [FAIL] Raw recording not found: ${RAW_FILE}${NC}"
    exit 1
fi

echo ""
echo -e "${BOLD}Post-processing${NC}"
echo ""

RAW_SIZE=$(du -h "$RAW_FILE" | cut -f1)
RAW_DURATION=$(ffprobe -i "$RAW_FILE" -show_entries format=duration -v quiet -of csv="p=0" 2>/dev/null || echo "unknown")
echo -e "  Raw file: ${RAW_FILE}"
echo -e "  Size: ${RAW_SIZE}, Duration: ${RAW_DURATION}s"
echo ""

echo -e "  Converting to MP4 (H.264)..."
ffmpeg -y \
    -i "$RAW_FILE" \
    -c:v libx264 \
    -preset medium \
    -crf 23 \
    -pix_fmt yuv420p \
    -movflags +faststart \
    -an \
    "$OUTPUT_FILE" \
    -loglevel warning

OUTPUT_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
OUTPUT_DURATION=$(ffprobe -i "$OUTPUT_FILE" -show_entries format=duration -v quiet -of csv="p=0" 2>/dev/null || echo "unknown")

echo -e "${GREEN}  [OK] Converted: ${OUTPUT_FILE}${NC}"
echo -e "       Size: ${OUTPUT_SIZE}, Duration: ${OUTPUT_DURATION}s"

# Clean up raw file
rm -f "$RAW_FILE"
echo -e "${DIM}  Removed raw recording${NC}"

# ─── Summary ────────────────────────────────────────────────────────────────

echo ""
echo -e "${BOLD}${GREEN}════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}${GREEN}  Recording Complete!${NC}"
echo -e "${BOLD}${GREEN}════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  Video: ${OUTPUT_FILE}"
echo -e "  Duration: ${OUTPUT_DURATION}s"
echo -e "  Size: ${OUTPUT_SIZE}"
echo ""
echo -e "${BOLD}Next Steps:${NC}"
echo ""
echo -e "  1. Generate voiceover:"
echo -e "     ${CYAN}npx tsx demo/generate-voiceover.ts${NC}"
echo ""
echo -e "  2. Merge video + audio:"
echo -e "     ${CYAN}./demo/merge-video-audio.sh${NC}"
echo ""
