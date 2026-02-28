/**
 * IAB Deals MCP Server - Voiceover Generator
 *
 * Generates TTS audio files for each scene using OpenAI's TTS API
 *
 * Usage:
 *   npx tsx demo/generate-voiceover.ts
 *
 * Prerequisites:
 *   - OPENAI_API_KEY environment variable set
 *   - ffmpeg installed for audio concatenation
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { parse } from 'csv-parse/sync'
import OpenAI from 'openai'
import { execSync } from 'child_process'

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configuration
const VOICE = 'nova' // Options: alloy, echo, fable, nova, onyx, shimmer
const MODEL = 'tts-1-hd' // Options: tts-1, tts-1-hd
const OUTPUT_DIR = path.join(__dirname, 'test-results', 'audio')
const CSV_PATH = path.join(__dirname, 'iab-demo-spec.csv')

// Scene metadata interface
interface Scene {
  scene_id: string
  act: string
  title: string
  voiceover_text: string
  overlay: string
  duration_sec: string
  notes: string
}

// OpenAI client (initialized lazily in main after env check)
let openai: OpenAI

async function generateSceneAudio(
  scene: Scene,
  outputPath: string
): Promise<{ duration: number }> {
  if (!scene.voiceover_text || scene.voiceover_text.trim() === '') {
    console.log(`   Skipping ${scene.scene_id}: No voiceover text`)
    return { duration: 0 }
  }

  console.log(`   Generating ${scene.scene_id}: ${scene.title}`)

  const response = await openai.audio.speech.create({
    model: MODEL,
    voice: VOICE,
    input: scene.voiceover_text,
  })

  const buffer = Buffer.from(await response.arrayBuffer())
  fs.writeFileSync(outputPath, buffer)

  // Get audio duration using ffprobe
  try {
    const durationOutput = execSync(
      `ffprobe -i "${outputPath}" -show_entries format=duration -v quiet -of csv="p=0"`,
      { encoding: 'utf-8' }
    )
    const duration = parseFloat(durationOutput.trim())
    console.log(
      `      Done: ${path.basename(outputPath)} (${duration.toFixed(2)}s)`
    )
    return { duration }
  } catch {
    console.log(`      Done: ${path.basename(outputPath)}`)
    return { duration: 0 }
  }
}

async function generateSilence(
  durationSec: number,
  outputPath: string
): Promise<void> {
  execSync(
    `ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=stereo -t ${durationSec} -q:a 9 -acodec libmp3lame "${outputPath}"`,
    { stdio: 'pipe' }
  )
}

async function concatenateAudio(
  inputFiles: string[],
  outputPath: string
): Promise<void> {
  // Create concat file list
  const concatListPath = path.join(OUTPUT_DIR, 'concat.txt')
  const concatContent = inputFiles
    .map((f) => `file '${path.basename(f)}'`)
    .join('\n')
  fs.writeFileSync(concatListPath, concatContent)

  // Concatenate using ffmpeg
  execSync(
    `cd "${OUTPUT_DIR}" && ffmpeg -y -f concat -safe 0 -i concat.txt -c copy "${outputPath}"`,
    { stdio: 'pipe' }
  )

  console.log(`   Concatenated audio: ${path.basename(outputPath)}`)
}

async function main() {
  console.log('IAB Deals MCP Server - Voiceover Generator')
  console.log('============================================')
  console.log('')

  // Check for OpenAI API key
  if (!process.env.OPENAI_API_KEY) {
    console.error('Error: OPENAI_API_KEY environment variable not set')
    process.exit(1)
  }

  // Initialize OpenAI client
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })

  // Check for ffmpeg
  try {
    execSync('which ffmpeg', { stdio: 'pipe' })
  } catch {
    console.error('Error: ffmpeg is not installed. Install with: brew install ffmpeg')
    process.exit(1)
  }

  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  // Read and parse CSV
  console.log('Reading demo spec CSV...')
  const csvContent = fs.readFileSync(CSV_PATH, 'utf-8')
  const scenes: Scene[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
  })

  console.log(`   Found ${scenes.length} scenes\n`)

  // Generate audio for each scene
  console.log('Generating voiceover audio...\n')
  const audioFiles: string[] = []
  const metadata: Array<{
    scene_id: string
    title: string
    filename: string
    duration: number
  }> = []
  let totalDuration = 0

  // Generate silence files for pauses
  const silenceFiles: Record<string, string> = {}
  for (const duration of [1, 1.5, 2, 2.5, 3]) {
    const silencePath = path.join(OUTPUT_DIR, `silence_${duration}s.mp3`)
    if (!fs.existsSync(silencePath)) {
      await generateSilence(duration, silencePath)
    }
    silenceFiles[duration] = silencePath
  }

  for (const scene of scenes) {
    const filename = `scene-${scene.scene_id}.mp3`
    const outputPath = path.join(OUTPUT_DIR, filename)

    try {
      const { duration } = await generateSceneAudio(scene, outputPath)

      if (duration > 0) {
        audioFiles.push(outputPath)
        metadata.push({
          scene_id: scene.scene_id,
          title: scene.title,
          filename,
          duration,
        })
        totalDuration += duration

        // Add pause between scenes (1.5s between scenes, 2.5s between acts)
        const nextScene = scenes[scenes.indexOf(scene) + 1]
        if (nextScene) {
          const pauseDuration = nextScene.act !== scene.act ? 2.5 : 1.5
          audioFiles.push(silenceFiles[pauseDuration])
          totalDuration += pauseDuration
        }
      }
    } catch (error) {
      console.error(`   Error generating ${scene.scene_id}:`, error)
    }
  }

  // Concatenate all audio files
  console.log('\nConcatenating audio files...')
  const fullVoiceoverPath = path.join(OUTPUT_DIR, 'voiceover-full-iab.mp3')
  await concatenateAudio(audioFiles, fullVoiceoverPath)

  // Also create M4A version for better compatibility
  console.log('\nConverting to M4A...')
  const m4aPath = path.join(OUTPUT_DIR, 'voiceover-full-iab.m4a')
  execSync(
    `ffmpeg -y -i "${fullVoiceoverPath}" -c:a aac -b:a 192k "${m4aPath}"`,
    { stdio: 'pipe' }
  )
  console.log(`   Created: ${path.basename(m4aPath)}`)

  // Write metadata JSON
  const metadataPath = path.join(OUTPUT_DIR, 'scene-metadata.json')
  fs.writeFileSync(
    metadataPath,
    JSON.stringify(
      {
        version: 'iab-deals-demo',
        voice: VOICE,
        model: MODEL,
        totalScenes: metadata.length,
        totalDuration: totalDuration.toFixed(2),
        scenes: metadata,
      },
      null,
      2
    )
  )

  console.log('\n============================================')
  console.log('VOICEOVER GENERATION COMPLETE!')
  console.log('============================================\n')
  console.log(`Summary:`)
  console.log(`   Scenes: ${metadata.length}`)
  console.log(
    `   Total Duration: ${Math.floor(totalDuration / 60)}m ${Math.floor(totalDuration % 60)}s`
  )
  console.log(`   Voice: ${VOICE}`)
  console.log(`   Model: ${MODEL}`)
  console.log(`\nOutput Files:`)
  console.log(`   ${fullVoiceoverPath}`)
  console.log(`   ${m4aPath}`)
  console.log(`   ${metadataPath}`)
  console.log(`\nNext Step:`)
  console.log(`   npx playwright test demo/playwright-demo.spec.ts`)
  console.log(`   ./demo/merge-video-audio.sh`)
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
