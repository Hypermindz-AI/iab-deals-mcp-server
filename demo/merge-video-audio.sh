#!/bin/bash

#
# IAB Deals MCP Server - Video + Audio Merger
#
# Combines the silent Playwright video recording with TTS voiceover
#
# Usage:
#   ./demo/merge-video-audio.sh
#
# Prerequisites:
#   - ffmpeg installed
#   - Video recording from Playwright in demo/test-results/videos/
#   - Audio from generate-voiceover.ts in demo/test-results/audio/
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VIDEO_DIR="${SCRIPT_DIR}/test-results/videos"
AUDIO_DIR="${SCRIPT_DIR}/test-results/audio"
OUTPUT_DIR="${SCRIPT_DIR}/test-results"

echo "IAB Deals MCP Server - Video + Audio Merger"
echo "============================================="
echo ""

# Check for ffmpeg
if ! command -v ffmpeg &> /dev/null; then
    echo "Error: ffmpeg is not installed"
    echo "   Install with: brew install ffmpeg"
    exit 1
fi

# Find the latest video file
echo "Looking for video files..."
VIDEO_FILE=$(find "${VIDEO_DIR}" -name "*.webm" -type f 2>/dev/null | sort -r | head -1)

if [ -z "$VIDEO_FILE" ]; then
    echo "Error: No video file found in ${VIDEO_DIR}"
    echo "   Run the Playwright demo first:"
    echo "   npx playwright test demo/playwright-demo.spec.ts"
    exit 1
fi

echo "   Found: ${VIDEO_FILE}"

# Check for audio file
AUDIO_FILE="${AUDIO_DIR}/voiceover-full-iab.mp3"
if [ ! -f "$AUDIO_FILE" ]; then
    AUDIO_FILE="${AUDIO_DIR}/voiceover-full-iab.m4a"
fi

if [ ! -f "$AUDIO_FILE" ]; then
    echo "Error: No audio file found"
    echo "   Generate voiceover first:"
    echo "   npx tsx demo/generate-voiceover.ts"
    exit 1
fi

echo "   Found: ${AUDIO_FILE}"
echo ""

# Get video and audio durations
VIDEO_DURATION=$(ffprobe -i "$VIDEO_FILE" -show_entries format=duration -v quiet -of csv="p=0")
AUDIO_DURATION=$(ffprobe -i "$AUDIO_FILE" -show_entries format=duration -v quiet -of csv="p=0")

echo "Durations:"
echo "   Video: ${VIDEO_DURATION}s"
echo "   Audio: ${AUDIO_DURATION}s"
echo ""

# Output filename with timestamp
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
OUTPUT_FILE="${OUTPUT_DIR}/iab-deals-demo-${TIMESTAMP}.mp4"

echo "Merging video and audio..."
echo ""

# Merge video and audio
ffmpeg -y \
    -i "$VIDEO_FILE" \
    -i "$AUDIO_FILE" \
    -c:v libx264 \
    -preset medium \
    -crf 23 \
    -c:a aac \
    -b:a 192k \
    -shortest \
    -movflags +faststart \
    "$OUTPUT_FILE" \
    2>&1 | grep -E "(Duration|Stream|Output|frame=)" || true

echo ""
echo "============================================="
echo "MERGE COMPLETE!"
echo "============================================="
echo ""
echo "Output: ${OUTPUT_FILE}"
echo ""

# Get final file size
FILE_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
FINAL_DURATION=$(ffprobe -i "$OUTPUT_FILE" -show_entries format=duration -v quiet -of csv="p=0")

echo "Final Video Stats:"
echo "   Duration: ${FINAL_DURATION}s"
echo "   Size: ${FILE_SIZE}"
echo "   Format: MP4 (H.264 + AAC)"
echo ""

# Create a copy with a simpler name
SIMPLE_OUTPUT="${OUTPUT_DIR}/iab-deals-demo-final.mp4"
cp "$OUTPUT_FILE" "$SIMPLE_OUTPUT"
echo "Also saved as: ${SIMPLE_OUTPUT}"
echo ""

# Optional: Open the video
if command -v open &> /dev/null; then
    read -p "Open video in default player? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        open "$SIMPLE_OUTPUT"
    fi
fi

echo ""
echo "Done! Your IAB Deals demo video is ready."
