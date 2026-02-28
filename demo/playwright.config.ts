import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: '.',
  testMatch: 'playwright-demo.spec.ts',
  timeout: 300000, // 5 min for full demo recording
  use: {
    viewport: { width: 1920, height: 1080 },
    video: 'on',
    screenshot: 'on',
  },
  projects: [
    {
      name: 'demo-recording',
      use: {
        browserName: 'chromium',
        launchOptions: {
          args: ['--disable-gpu', '--no-sandbox'],
        },
      },
    },
  ],
})
