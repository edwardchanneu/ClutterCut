import { defineConfig } from '@playwright/test'
import * as dotenv from 'dotenv'

dotenv.config()

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  expect: { timeout: 5000 },
  fullyParallel: false, // Run auth tests sequentially to avoid state collisions
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Avoid running multiple electron instances at once
  reporter: 'html',
  use: {
    actionTimeout: 10000,
    trace: 'on-first-retry'
  }
})
