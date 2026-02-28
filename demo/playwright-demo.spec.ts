/**
 * IAB Deals MCP Server - Playwright Demo Recording
 *
 * Records a video demo styled as Claude Desktop with the iab-deals MCP server.
 * Clean, minimalistic theme matching Claude's actual UI.
 *
 * Usage:
 *   npx playwright test --config demo/playwright.config.ts
 *
 * Prerequisites:
 *   - Playwright installed: npx playwright install chromium
 */

import { test, type Page } from '@playwright/test'
import * as path from 'path'
import * as fs from 'fs'
import { fileURLToPath } from 'url'

// ============================================
// Configuration
// ============================================

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const VIDEO_DIR = path.join(__dirname, 'test-results', 'videos')
const SCREENSHOT_DIR = path.join(__dirname, 'test-results', 'screenshots')

// Scene durations in ms (voiceover duration + buffer)
const SCENE_DURATIONS: Record<string, number> = {
  '0.1': 11000,
  '0.2': 12000,
  '1.1': 9000,
  '1.2': 15000,
  '2.1': 9000,
  '2.2': 15000,
  '3.1': 13000,
  '3.2': 11000,
  '4.1': 11000,
  '5.1': 11000,
  '5.2': 9000,
  '6.1': 13000,
  '6.2': 11000,
}

// ============================================
// Claude Desktop UI — Clean, Minimal Theme
// ============================================

function getDemoPageHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Claude</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

    :root {
      --bg: #f9f5ef;
      --bg-sidebar: #2c2b28;
      --bg-white: #ffffff;
      --text: #1a1a1a;
      --text-secondary: #6b6b6b;
      --text-light: #999;
      --border: #e8e4de;
      --accent: #c96442;
      --accent-bg: #faf6f0;
      --tool-bg: #f5f1eb;
      --tool-border: #e0dbd3;
      --green: #2d8659;
      --amber: #b5850a;
      --red: #c4403a;
      --blue: #3b6fb5;
    }

    body {
      font-family: 'Inter', -apple-system, system-ui, sans-serif;
      background: var(--bg);
      color: var(--text);
      height: 100vh;
      overflow: hidden;
      display: flex;
      -webkit-font-smoothing: antialiased;
    }

    /* ---- Sidebar ---- */
    .sidebar {
      width: 260px;
      background: var(--bg-sidebar);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
    }
    .sidebar-header {
      padding: 16px 18px;
      display: flex;
      align-items: center;
      gap: 10px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }
    .sidebar-logo {
      width: 26px; height: 26px;
      background: var(--accent);
      border-radius: 6px;
      display: flex; align-items: center; justify-content: center;
    }
    .sidebar-logo svg { width: 16px; height: 16px; fill: #fff; }
    .sidebar-title { color: #e8e4de; font-size: 14px; font-weight: 500; }
    .sidebar-new {
      margin: 12px 14px;
      padding: 8px 14px;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px;
      color: #ccc;
      font-size: 13px;
      cursor: pointer;
      text-align: left;
    }
    .sidebar-chats {
      flex: 1;
      padding: 4px 8px;
      overflow: hidden;
    }
    .sidebar-chat {
      padding: 8px 12px;
      border-radius: 6px;
      color: #aaa;
      font-size: 13px;
      margin-bottom: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .sidebar-chat.active {
      background: rgba(255,255,255,0.08);
      color: #e8e4de;
    }
    .sidebar-mcp {
      padding: 14px 18px;
      border-top: 1px solid rgba(255,255,255,0.08);
    }
    .sidebar-mcp-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #666;
      margin-bottom: 8px;
    }
    .sidebar-mcp-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 5px 0;
      font-size: 12px;
      color: #999;
    }
    .mcp-dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: var(--green);
      flex-shrink: 0;
    }

    /* ---- Main content ---- */
    .main {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    /* ---- Chat area ---- */
    .chat-area {
      flex: 1;
      overflow-y: auto;
      padding: 32px 0;
      scroll-behavior: smooth;
    }
    .chat-inner {
      max-width: 680px;
      margin: 0 auto;
      padding: 0 24px;
    }

    /* ---- Messages ---- */
    .msg {
      margin-bottom: 28px;
      opacity: 0;
      transform: translateY(8px);
      transition: opacity 0.35s ease, transform 0.35s ease;
    }
    .msg.visible { opacity: 1; transform: translateY(0); }

    .msg-user {
      display: flex;
      justify-content: flex-end;
    }
    .msg-user .msg-bubble {
      background: var(--bg-sidebar);
      color: #e8e4de;
      border-radius: 20px 20px 4px 20px;
      padding: 12px 18px;
      max-width: 520px;
      font-size: 14px;
      line-height: 1.55;
    }

    .msg-claude .msg-label {
      display: flex;
      align-items: center;
      gap: 7px;
      margin-bottom: 8px;
    }
    .msg-claude .msg-avatar {
      width: 22px; height: 22px;
      background: var(--accent);
      border-radius: 6px;
      display: flex; align-items: center; justify-content: center;
    }
    .msg-claude .msg-avatar svg { width: 13px; height: 13px; fill: #fff; }
    .msg-claude .msg-name {
      font-size: 13px;
      font-weight: 500;
      color: var(--text);
    }

    .msg-text {
      font-size: 14px;
      line-height: 1.65;
      color: var(--text);
    }

    /* ---- Tool call (accordion style) ---- */
    .tool-block {
      background: var(--tool-bg);
      border: 1px solid var(--tool-border);
      border-radius: 10px;
      margin: 10px 0;
      overflow: hidden;
    }
    .tool-header {
      padding: 10px 14px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      font-weight: 500;
      color: var(--text-secondary);
      cursor: pointer;
    }
    .tool-header svg {
      width: 14px; height: 14px;
      flex-shrink: 0;
      fill: var(--text-light);
    }
    .tool-name {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      color: var(--text);
    }
    .tool-status {
      margin-left: auto;
      font-size: 11px;
      color: var(--green);
      display: flex; align-items: center; gap: 4px;
    }
    .tool-status svg { width: 12px; height: 12px; fill: var(--green); }
    .tool-body {
      padding: 0 14px 14px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      line-height: 1.7;
      color: #444;
      white-space: pre-wrap;
    }
    .tool-body .k { color: var(--text-secondary); }
    .tool-body .s { color: var(--text); font-weight: 500; }
    .tool-body .n { color: var(--accent); font-weight: 500; }
    .tool-body .active { color: var(--green); font-weight: 600; }
    .tool-body .pending { color: var(--amber); font-weight: 600; }
    .tool-body .paused { color: var(--red); font-weight: 600; }

    /* ---- Input bar ---- */
    .input-bar {
      padding: 12px 24px 20px;
      display: flex;
      justify-content: center;
    }
    .input-box {
      max-width: 680px;
      width: 100%;
      background: var(--bg-white);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 14px 18px;
      font-size: 14px;
      color: var(--text-light);
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }

    /* ---- Typing dots ---- */
    .typing { display: flex; gap: 5px; padding: 6px 0; }
    .typing span {
      width: 7px; height: 7px;
      background: #bbb;
      border-radius: 50%;
      animation: pulse 1.3s infinite;
    }
    .typing span:nth-child(2) { animation-delay: 0.15s; }
    .typing span:nth-child(3) { animation-delay: 0.3s; }
    @keyframes pulse {
      0%, 60%, 100% { opacity: 0.3; transform: scale(1); }
      30% { opacity: 1; transform: scale(1.15); }
    }

    /* ---- Overlay system ---- */
    #overlay-container {
      position: fixed;
      top: 0; left: 260px; right: 0; bottom: 0;
      pointer-events: none;
      z-index: 800;
    }
    .ov {
      position: absolute;
      opacity: 0;
      transition: opacity 0.5s ease, transform 0.5s ease;
    }
    .ov.show { opacity: 1; }
    .ov-banner {
      top: 14px; left: 50%;
      transform: translateX(-50%) translateY(-6px);
      background: rgba(44,43,40,0.92);
      border-radius: 10px;
      padding: 10px 24px;
      font-size: 14px;
      font-weight: 500;
      color: #f0ece6;
      backdrop-filter: blur(12px);
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    }
    .ov-banner.show { transform: translateX(-50%) translateY(0); }

    /* ---- Full-screen slides (intro, arch, closing) ---- */
    .slide {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 900;
      opacity: 1;
      transition: opacity 0.7s ease;
    }
    .slide.out { opacity: 0; pointer-events: none; }
    .slide.hidden { display: none; }

    /* Title slide */
    .slide-title {
      background: #faf6f0;
    }
    .slide-title h1 {
      font-size: 44px;
      font-weight: 600;
      color: var(--text);
      letter-spacing: -0.5px;
      margin-bottom: 12px;
    }
    .slide-title h2 {
      font-size: 18px;
      font-weight: 300;
      color: var(--text-secondary);
      margin-bottom: 36px;
    }
    .slide-tags {
      display: flex; gap: 10px;
    }
    .slide-tag {
      background: var(--bg-white);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 8px 16px;
      font-size: 13px;
      color: var(--text-secondary);
      font-weight: 400;
    }
    .slide-footer {
      font-size: 13px;
      color: var(--text-light);
      margin-top: 48px;
    }

    /* Architecture slide */
    .slide-arch {
      background: #faf6f0;
    }
    .slide-arch .arch-title {
      font-size: 26px;
      font-weight: 600;
      color: var(--text);
      margin-bottom: 44px;
    }
    .arch-flow {
      display: flex;
      align-items: center;
      gap: 20px;
    }
    .arch-node {
      background: var(--bg-white);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 22px 28px;
      text-align: center;
      min-width: 155px;
      opacity: 0;
      transform: translateY(16px);
      transition: all 0.45s ease;
    }
    .arch-node.show { opacity: 1; transform: translateY(0); }
    .arch-node h3 {
      font-size: 14px;
      font-weight: 600;
      color: var(--accent);
      margin-bottom: 6px;
    }
    .arch-node p {
      font-size: 12px;
      color: var(--text-secondary);
      line-height: 1.4;
    }
    .arch-arrow {
      font-size: 20px;
      color: #ccc;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    .arch-arrow.show { opacity: 1; }
    .arch-tools-label {
      font-size: 13px;
      color: var(--text-light);
      margin-top: 36px;
      margin-bottom: 14px;
    }
    .arch-tools {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      justify-content: center;
      max-width: 640px;
    }
    .arch-pill {
      background: var(--bg-white);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 5px 12px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      color: var(--text-secondary);
      opacity: 0;
      transition: opacity 0.25s ease;
    }
    .arch-pill.show { opacity: 1; }

    /* Closing slide */
    .slide-close {
      background: #faf6f0;
    }
    .slide-close h2 {
      font-size: 28px;
      font-weight: 600;
      color: var(--text);
      margin-bottom: 32px;
    }
    .close-points {
      display: flex;
      flex-direction: column;
      gap: 14px;
      margin-bottom: 36px;
    }
    .close-pt {
      font-size: 15px;
      color: var(--text-secondary);
      opacity: 0;
      transform: translateX(-12px);
      transition: all 0.4s ease;
    }
    .close-pt.show { opacity: 1; transform: translateX(0); }
    .close-pt strong { color: var(--text); font-weight: 500; }
    .close-repo {
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      color: var(--blue);
      background: var(--bg-white);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 12px 24px;
      opacity: 0;
      transition: opacity 0.5s ease;
    }
    .close-repo.show { opacity: 1; }
    .close-iab {
      font-size: 13px;
      color: var(--text-light);
      margin-top: 20px;
      opacity: 0;
      transition: opacity 0.5s ease;
    }
    .close-iab.show { opacity: 1; }
  </style>
</head>
<body>

  <!-- ====== Title Slide ====== -->
  <div class="slide slide-title" id="slideTitle">
    <h1>IAB Deals MCP Server</h1>
    <h2>Programmatic Deal Management via AI Agents</h2>
    <div class="slide-tags">
      <div class="slide-tag">IAB Deals API v1.0</div>
      <div class="slide-tag">Model Context Protocol</div>
      <div class="slide-tag">TypeScript + SQLite</div>
    </div>
    <div class="slide-footer">IAB Tech Lab Agentic Task Force &middot; March 2026</div>
  </div>

  <!-- ====== Architecture Slide ====== -->
  <div class="slide slide-arch hidden" id="slideArch">
    <div class="arch-title">Architecture</div>
    <div class="arch-flow">
      <div class="arch-node" id="n-agent"><h3>AI Agent</h3><p>Claude Desktop<br>or any MCP client</p></div>
      <div class="arch-arrow" id="a1">&rarr;</div>
      <div class="arch-node" id="n-mcp"><h3>MCP Server</h3><p>9 Deal Tools<br>Zod Validation</p></div>
      <div class="arch-arrow" id="a2">&rarr;</div>
      <div class="arch-node" id="n-db"><h3>SQLite DB</h3><p>Deals, Terms<br>Buyer Seats</p></div>
      <div class="arch-arrow" id="a3">&rarr;</div>
      <div class="arch-node" id="n-prov"><h3>Providers</h3><p>TTD, DV360<br>Mock (demo)</p></div>
    </div>
    <div class="arch-tools-label">9 MCP Tools for Complete Deal Lifecycle</div>
    <div class="arch-tools" id="archTools">
      <div class="arch-pill">deals_create</div>
      <div class="arch-pill">deals_update</div>
      <div class="arch-pill">deals_send</div>
      <div class="arch-pill">deals_confirm</div>
      <div class="arch-pill">deals_status</div>
      <div class="arch-pill">deals_list</div>
      <div class="arch-pill">deals_pause</div>
      <div class="arch-pill">deals_resume</div>
      <div class="arch-pill">providers_list</div>
    </div>
  </div>

  <!-- ====== Closing Slide ====== -->
  <div class="slide slide-close hidden" id="slideClose">
    <h2>Key Takeaways</h2>
    <div class="close-points">
      <div class="close-pt"><strong>Standards Compliant</strong> &mdash; Built on IAB Deals API v1.0</div>
      <div class="close-pt"><strong>AI-Native</strong> &mdash; Designed for agentic workflows</div>
      <div class="close-pt"><strong>Extensible</strong> &mdash; Add real DSP/SSP providers</div>
      <div class="close-pt"><strong>Open Source</strong> &mdash; Reference implementation for the community</div>
    </div>
    <div class="close-repo" id="closeRepo">github.com/Hypermindz-AI/iab-deals-mcp-server</div>
    <div class="close-iab" id="closeIab">IAB Tech Lab Agentic Task Force &middot; iabtechlab.com</div>
  </div>

  <!-- ====== Claude Desktop Layout ====== -->
  <div class="sidebar">
    <div class="sidebar-header">
      <div class="sidebar-logo">
        <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
      </div>
      <span class="sidebar-title">Claude</span>
    </div>
    <div class="sidebar-new">New chat</div>
    <div class="sidebar-chats">
      <div class="sidebar-chat active">IAB Deals Demo</div>
      <div class="sidebar-chat">Campaign optimization</div>
      <div class="sidebar-chat">DV360 integration notes</div>
    </div>
    <div class="sidebar-mcp">
      <div class="sidebar-mcp-label">MCP Servers</div>
      <div class="sidebar-mcp-item"><span class="mcp-dot"></span>iab-deals</div>
    </div>
  </div>

  <div class="main">
    <div class="chat-area" id="chatArea">
      <div class="chat-inner" id="chatInner"></div>
    </div>
    <div class="input-bar">
      <div class="input-box">Message Claude...</div>
    </div>
  </div>

  <!-- ====== Overlay ====== -->
  <div id="overlay-container">
    <div class="ov ov-banner" id="ovBanner"></div>
  </div>

</body>
</html>`
}

// ============================================
// Helpers
// ============================================

const CLAUDE_SVG = `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>`

async function showBanner(page: Page, text: string): Promise<void> {
  await page.evaluate((t) => {
    const b = document.getElementById('ovBanner')!
    b.textContent = t
    b.classList.add('show')
  }, text)
}

async function hideBanner(page: Page): Promise<void> {
  await page.evaluate(() => {
    document.getElementById('ovBanner')?.classList.remove('show')
  })
}

async function userMsg(page: Page, text: string): Promise<void> {
  await page.evaluate((t) => {
    const inner = document.getElementById('chatInner')!
    const el = document.createElement('div')
    el.className = 'msg msg-user'
    el.innerHTML = \`<div class="msg-bubble">\${t}</div>\`
    inner.appendChild(el)
    requestAnimationFrame(() => {
      el.classList.add('visible')
      el.closest('.chat-area')!.scrollTop = el.closest('.chat-area')!.scrollHeight
    })
  }, text)
  await page.waitForTimeout(250)
}

async function showTyping(page: Page): Promise<void> {
  await page.evaluate(() => {
    const inner = document.getElementById('chatInner')!
    const el = document.createElement('div')
    el.className = 'msg msg-claude visible'
    el.id = 'typing'
    el.innerHTML = \`<div class="msg-label">
      <div class="msg-avatar"><svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg></div>
      <span class="msg-name">Claude</span>
    </div><div class="typing"><span></span><span></span><span></span></div>\`
    inner.appendChild(el)
    el.closest('.chat-area')!.scrollTop = el.closest('.chat-area')!.scrollHeight
  })
}

async function hideTyping(page: Page): Promise<void> {
  await page.evaluate(() => document.getElementById('typing')?.remove())
}

async function claudeToolMsg(
  page: Page,
  toolName: string,
  body: string,
  summary: string
): Promise<void> {
  await page.evaluate(({ toolName, body, summary }) => {
    const inner = document.getElementById('chatInner')!
    const el = document.createElement('div')
    el.className = 'msg msg-claude'
    el.innerHTML = \`<div class="msg-label">
      <div class="msg-avatar"><svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg></div>
      <span class="msg-name">Claude</span>
    </div>
    <div class="tool-block">
      <div class="tool-header">
        <svg viewBox="0 0 24 24"><path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/></svg>
        <span class="tool-name">\${toolName}</span>
        <span class="tool-status"><svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg></span>
      </div>
      <div class="tool-body">\${body}</div>
    </div>
    <div class="msg-text">\${summary}</div>\`
    inner.appendChild(el)
    requestAnimationFrame(() => {
      el.classList.add('visible')
      el.closest('.chat-area')!.scrollTop = el.closest('.chat-area')!.scrollHeight
    })
  }, { toolName, body, summary })
  await page.waitForTimeout(250)
}

async function playScene(page: Page, id: string, fn: () => Promise<void>): Promise<void> {
  const dur = SCENE_DURATIONS[id] || 10000
  const t0 = Date.now()
  await fn()
  const left = Math.max(0, dur - (Date.now() - t0))
  if (left > 0) await page.waitForTimeout(left)
}

// ============================================
// Test
// ============================================

test.describe('IAB Deals MCP Demo', () => {
  test.use({ viewport: { width: 1920, height: 1080 } })

  test('Record Demo', async ({ browser }) => {
    for (const d of [VIDEO_DIR, SCREENSHOT_DIR]) {
      if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true })
    }

    const ctx = await browser.newContext({
      recordVideo: { dir: VIDEO_DIR, size: { width: 1920, height: 1080 } },
      viewport: { width: 1920, height: 1080 },
      screen: { width: 1920, height: 1080 },
      deviceScaleFactor: 1,
    })
    const page = await ctx.newPage()
    await page.setContent(getDemoPageHtml())
    await page.waitForTimeout(1000)

    console.log('Recording IAB Deals MCP Demo...\n')

    // ---- 0.1 Title ----
    console.log('0.1 Title')
    await playScene(page, '0.1', async () => {
      await page.waitForTimeout(8500)
      await page.evaluate(() => document.getElementById('slideTitle')?.classList.add('out'))
      await page.waitForTimeout(700)
      await page.evaluate(() => document.getElementById('slideTitle')?.classList.add('hidden'))
    })

    // ---- 0.2 Architecture ----
    console.log('0.2 Architecture')
    await playScene(page, '0.2', async () => {
      await page.evaluate(() => {
        const s = document.getElementById('slideArch')!
        s.classList.remove('hidden')
      })
      await page.waitForTimeout(600)

      for (const id of ['n-agent', 'a1', 'n-mcp', 'a2', 'n-db', 'a3', 'n-prov']) {
        await page.evaluate((i) => document.getElementById(i)?.classList.add('show'), id)
        await page.waitForTimeout(350)
      }

      await page.waitForTimeout(400)
      await page.evaluate(() => {
        document.querySelectorAll('.arch-pill').forEach((el, i) => {
          setTimeout(() => el.classList.add('show'), i * 120)
        })
      })
      await page.waitForTimeout(9 * 120 + 800)

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'architecture.png') })

      await page.evaluate(() => document.getElementById('slideArch')?.classList.add('out'))
      await page.waitForTimeout(700)
      await page.evaluate(() => document.getElementById('slideArch')?.classList.add('hidden'))
    })

    // ---- 1.1 List intro ----
    console.log('1.1 List Deals')
    await playScene(page, '1.1', async () => {
      await showBanner(page, 'Browse Existing Deals')
      await page.waitForTimeout(2000)
      await userMsg(page, 'List all available programmatic deals')
      await showTyping(page)
    })

    // ---- 1.2 List results ----
    console.log('1.2 Results')
    await playScene(page, '1.2', async () => {
      await hideBanner(page)
      await hideTyping(page)

      const body = [
        ['Q1 Premium CTV Campaign', 'IAB-170800-ABC1', '35.00', 'Video', 'active', 'ACTIVE'],
        ['Holiday Retail PMP 2026', 'IAB-170800-DEF4', '28.00', 'Banner, Native', 'active', 'ACTIVE'],
        ['DOOH Sports Venue Network', 'IAB-170800-GHI7', '45.00', 'Banner, Video', 'pending', 'PENDING'],
        ['Premium Podcast Network', 'IAB-170800-JKL0', '18.00', 'Audio', 'active', 'ACTIVE'],
        ['Gaming &amp; Esports Sponsorship', 'IAB-170800-MNO3', '22.00', 'Video, Native', 'active', 'ACTIVE'],
      ].map(([name, id, cpm, types, cls, label], i) =>
        `<span class="k">${i + 1}.</span>  <span class="s">${name}</span>\n   ID: <span class="k">${id}</span>  CPM: <span class="n">$${cpm}</span>  Types: ${types}\n   Status: <span class="${cls}">${label}</span>`
      ).join('\n\n')

      await claudeToolMsg(page, 'deals_list', body,
        'Found 5 deals across CTV, display, DOOH, audio, and gaming inventory.')
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'list-deals.png') })
    })

    // ---- 2.1 Create intro ----
    console.log('2.1 Create Deal')
    await playScene(page, '2.1', async () => {
      await showBanner(page, 'Create a New Deal')
      await page.waitForTimeout(2000)
      await userMsg(page, 'Create a new deal for our summer video campaign. $30 CPM floor price for video ads starting June 1st 2026 on streaming.example.com.')
      await showTyping(page)
    })

    // ---- 2.2 Create result ----
    console.log('2.2 Created')
    await playScene(page, '2.2', async () => {
      await hideBanner(page)
      await hideTyping(page)

      const body = `<span class="k">Name</span>      <span class="s">Summer Video Campaign</span>
<span class="k">Deal ID</span>   <span class="s">IAB-1740000-XYZ7</span>
<span class="k">Seller</span>    streaming.example.com
<span class="k">CPM</span>       <span class="n">$30.00</span> USD
<span class="k">Ad Types</span>  Video
<span class="k">Start</span>     2026-06-01
<span class="k">Status</span>    <span class="pending">PENDING</span>`

      await claudeToolMsg(page, 'deals_create', body,
        'Deal created in PENDING status. Natural language was converted into IAB-compliant data structures with a formatted external deal ID.')
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'create-deal.png') })
    })

    // ---- 3.1 Send intro ----
    console.log('3.1 Send to Provider')
    await playScene(page, '3.1', async () => {
      await showBanner(page, 'Send to DSP Provider')
      await page.waitForTimeout(2000)
      await userMsg(page, 'Send this deal to our DSP partner for approval. Use seat ID \'summer-campaign-001\'.')
      await showTyping(page)
    })

    // ---- 3.2 Send result ----
    console.log('3.2 Sent')
    await playScene(page, '3.2', async () => {
      await hideBanner(page)
      await hideTyping(page)

      const body = `<span class="k">Deal</span>        <span class="s">Summer Video Campaign</span>
<span class="k">Status</span>      <span class="active">ACTIVE</span>

<span class="k">Buyer Seat</span>  summer-campaign-001
<span class="k">Provider</span>    Mock DSP Provider
<span class="k">Buyer</span>       <span class="pending">PENDING</span>
<span class="k">Platform</span>    MOCK-PD-a1b2c3d4`

      await claudeToolMsg(page, 'deals_send', body,
        'Deal sent to the Mock DSP Provider. In production, this integrates with The Trade Desk, DV360, or other DSPs via their APIs.')
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'send-deal.png') })
    })

    // ---- 4.1 Confirm ----
    console.log('4.1 Confirm')
    await playScene(page, '4.1', async () => {
      await showBanner(page, 'Confirm & Activate')
      await page.waitForTimeout(1200)
      await userMsg(page, 'Confirm and activate the summer campaign deal.')
      await showTyping(page)
      await page.waitForTimeout(1500)
      await hideTyping(page)
      await hideBanner(page)

      const body = `<span class="k">Deal</span>        <span class="s">Summer Video Campaign</span>
<span class="k">Status</span>      <span class="active">ACTIVE</span>

<span class="k">Buyer Seat</span>  summer-campaign-001
<span class="k">Buyer</span>       <span class="active">ACCEPTED</span>`

      await claudeToolMsg(page, 'deals_confirm', body, 'Deal confirmed and activated. All buyer seats marked as ACCEPTED.')
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'confirm-deal.png') })
    })

    // ---- 5.1 Pause ----
    console.log('5.1 Pause')
    await playScene(page, '5.1', async () => {
      await showBanner(page, 'Pause & Resume')
      await page.waitForTimeout(1200)
      await userMsg(page, 'Pause the summer campaign deal \u2014 we need to adjust creative.')
      await showTyping(page)
      await page.waitForTimeout(1500)
      await hideTyping(page)
      await hideBanner(page)

      const body = `<span class="k">Deal</span>        <span class="s">Summer Video Campaign</span>
<span class="k">Status</span>      <span class="paused">PAUSED</span>

<span class="k">Buyer Seat</span>  summer-campaign-001
<span class="k">Buyer</span>       <span class="paused">PAUSED</span>`

      await claudeToolMsg(page, 'deals_pause', body, 'Deal paused. All connected providers have been notified.')
    })

    // ---- 5.2 Resume ----
    console.log('5.2 Resume')
    await playScene(page, '5.2', async () => {
      await userMsg(page, 'Resume the summer campaign.')
      await showTyping(page)
      await page.waitForTimeout(1500)
      await hideTyping(page)

      const body = `<span class="k">Deal</span>        <span class="s">Summer Video Campaign</span>
<span class="k">Status</span>      <span class="active">ACTIVE</span>

<span class="k">Buyer Seat</span>  summer-campaign-001
<span class="k">Buyer</span>       <span class="active">ACCEPTED</span>`

      await claudeToolMsg(page, 'deals_resume', body, 'Deal resumed. Full lifecycle management through natural language with audit trails.')
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'resume-deal.png') })
    })

    // ---- 6.1 Closing ----
    console.log('6.1 Closing')
    await playScene(page, '6.1', async () => {
      await page.evaluate(() => {
        const s = document.getElementById('slideClose')!
        s.classList.remove('hidden')
      })
      await page.waitForTimeout(600)

      const pts = await page.$$('.close-pt')
      for (const pt of pts) {
        await pt.evaluate((el) => el.classList.add('show'))
        await page.waitForTimeout(500)
      }
    })

    // ---- 6.2 Resources ----
    console.log('6.2 Resources')
    await playScene(page, '6.2', async () => {
      await page.evaluate(() => document.getElementById('closeRepo')?.classList.add('show'))
      await page.waitForTimeout(800)
      await page.evaluate(() => document.getElementById('closeIab')?.classList.add('show'))
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'closing.png') })
    })

    // ---- Done ----
    console.log('\nDone!')
    await page.waitForTimeout(2000)
    await page.close()
    await ctx.close()

    console.log(`Video: ${VIDEO_DIR}`)
    console.log(`Screenshots: ${SCREENSHOT_DIR}`)
  })
})
