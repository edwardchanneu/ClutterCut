import { test, expect, _electron as electron, ElectronApplication, Page } from '@playwright/test'
import path from 'path'
import fs from 'fs'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FIXTURES_DIR = path.resolve(__dirname, 'fixtures')
const SOURCE_FOLDER = path.join(FIXTURES_DIR, 'test-folder')

const EXISTING_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@test.com'
const EXISTING_USER_PASSWORD = process.env.TEST_USER_PASSWORD || '12345678'

// The single rule used across all authenticated tests:
//   File Extension ".txt" → "TextFiles"
// Only test1.txt in the fixture matches, so movedCount === 1.
const RULE_EXTENSION = '.txt'
const RULE_DESTINATION = 'TextFiles'

// ---------------------------------------------------------------------------
// Fixtures helpers
// ---------------------------------------------------------------------------

/**
 * Copy the canonical test-folder to a unique temp path so each test
 * starts from a known-clean state. Returns the temp folder path.
 */
function copyFixture(): string {
  const runFolder = path.join(FIXTURES_DIR, `run-${Date.now()}`)
  fs.cpSync(SOURCE_FOLDER, runFolder, { recursive: true })
  return runFolder
}

/** Delete the temp folder created by copyFixture(). */
function cleanFixture(runFolder: string): void {
  if (fs.existsSync(runFolder)) {
    fs.rmSync(runFolder, { recursive: true, force: true })
  }
}

// ---------------------------------------------------------------------------
// App helpers
// ---------------------------------------------------------------------------

async function launchApp(): Promise<{ app: ElectronApplication; page: Page }> {
  const app = await electron.launch({ args: ['.', '--no-sandbox'] })
  const page = await app.firstWindow()
  await page.waitForTimeout(1000)

  // Sign out any stale session
  const signOutBtn = page.locator('button:has-text("Sign Out")')
  if (await signOutBtn.isVisible()) {
    await signOutBtn.click()
    await expect(page.locator('text=Login to ClutterCut')).toBeVisible({ timeout: 5000 })
  }

  // Clear any cached session
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()
  await page.waitForTimeout(1000)

  return { app, page }
}

async function mockSelectFolderDialog(app: ElectronApplication, folderPath: string): Promise<void> {
  await app.evaluate(async ({ dialog }, contextPath) => {
    dialog.showOpenDialog = () => Promise.resolve({ canceled: false, filePaths: [contextPath] })
  }, folderPath)
}

async function loginAs(page: Page, email: string, password: string): Promise<void> {
  await expect(page.locator('text=Login to ClutterCut')).toBeVisible({ timeout: 5000 })
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button:has-text("Login")')
  await expect(page.locator('text=Select Folder to Organize')).toBeVisible({ timeout: 15000 })
}

/**
 * Full organize flow: select folder → Start → configure one File Extension rule → Preview → Approve.
 * Waits for navigation away from the preview screen.
 */
async function runOrganizeFlow(
  app: ElectronApplication,
  page: Page,
  folderPath: string,
  ruleExtension: string,
  ruleDestination: string
): Promise<void> {
  await mockSelectFolderDialog(app, folderPath)
  await page.click('button:has-text("Browse")')
  await expect(page.locator('#selected-path')).toHaveText(folderPath)

  await page.locator('button:has-text("Start Organizing")').click()
  await expect(page.locator('h1:has-text("Configure Organization Rules")')).toBeVisible({
    timeout: 5000
  })

  const firstRow = page.locator('ol > li').nth(0)
  await firstRow.locator('select').selectOption({ label: 'File Extension' })
  await firstRow.locator('input[placeholder="pdf"]').fill(ruleExtension)
  await firstRow.locator('input[placeholder="Documents"]').fill(ruleDestination)

  await page.locator('button:has-text("Preview Changes")').click()
  await expect(page.locator('h1:has-text("Preview Changes")')).toBeVisible({ timeout: 5000 })

  await page.locator('[aria-label="Approve and organize files"]').click()

  // Wait until we leave the preview screen (either success or failure)
  await expect(page.locator('h1:has-text("Preview Changes")')).not.toBeVisible({ timeout: 15000 })
}

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

test.describe('History & Undo E2E', () => {
  let app: ElectronApplication
  let page: Page

  test.beforeEach(async () => {
    ;({ app, page } = await launchApp())
  })

  test.afterEach(async () => {
    if (app) await app.close()
  })

  // -------------------------------------------------------------------------
  // AC1: Authenticated user approves preview → success screen with correct count
  // -------------------------------------------------------------------------
  test('Authenticated: approve preview → success screen shows correct file count', async () => {
    const runFolder = copyFixture()

    try {
      await loginAs(page, EXISTING_USER_EMAIL, EXISTING_USER_PASSWORD)
      await runOrganizeFlow(app, page, runFolder, RULE_EXTENSION, RULE_DESTINATION)

      // Assert success screen
      await expect(page.locator('h1:has-text("Success!")')).toBeVisible({ timeout: 10000 })

      // Assert the reported moved count matches our expectation (1 .txt file in test-folder)
      await expect(page.locator('text=Successfully organized')).toBeVisible()
      await expect(page.locator('strong').filter({ hasText: '1' }).first()).toBeVisible()
    } finally {
      cleanFixture(runFolder)
    }
  })

  // -------------------------------------------------------------------------
  // AC2: Authenticated user completes run → history entry appears
  // -------------------------------------------------------------------------
  test('Authenticated: completed run appears in history with folder path and file count', async () => {
    const runFolder = copyFixture()

    try {
      await loginAs(page, EXISTING_USER_EMAIL, EXISTING_USER_PASSWORD)
      await runOrganizeFlow(app, page, runFolder, RULE_EXTENSION, RULE_DESTINATION)

      // Wait for success screen then navigate to History
      await expect(page.locator('h1:has-text("Success!")')).toBeVisible({ timeout: 10000 })
      await page.locator('button:has-text("View History")').click()

      // History screen should load
      await expect(page.locator('h1:has-text("Organization History")')).toBeVisible({
        timeout: 10000
      })

      // The folder group header for our run folder should be visible
      await expect(page.getByText(runFolder).first()).toBeVisible({ timeout: 10000 })

      // Expand the folder group to reveal the run entry
      await page.locator('[role="button"]').filter({ hasText: runFolder }).click()

      // The entry should report 1 file affected
      await expect(page.locator('text=1 file affected')).toBeVisible({ timeout: 5000 })
    } finally {
      cleanFixture(runFolder)
    }
  })

  // -------------------------------------------------------------------------
  // AC3: Authenticated user confirms Undo → entry marked as Undone
  // -------------------------------------------------------------------------
  test('Authenticated: undo confirmed → history entry marked as Undone', async () => {
    const runFolder = copyFixture()

    try {
      await loginAs(page, EXISTING_USER_EMAIL, EXISTING_USER_PASSWORD)
      await runOrganizeFlow(app, page, runFolder, RULE_EXTENSION, RULE_DESTINATION)

      // Navigate to History
      await expect(page.locator('h1:has-text("Success!")')).toBeVisible({ timeout: 10000 })
      await page.locator('button:has-text("View History")').click()
      await expect(page.locator('h1:has-text("Organization History")')).toBeVisible({
        timeout: 10000
      })

      // Expand the folder group
      await expect(page.getByText(runFolder).first()).toBeVisible({ timeout: 10000 })
      await page.locator('[role="button"]').filter({ hasText: runFolder }).click()

      // Click the Undo button on the entry
      await expect(page.locator('button:has-text("Undo")')).toBeVisible({ timeout: 5000 })
      await page.locator('button:has-text("Undo")').click()

      // Confirm dialog appears
      await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 })
      await expect(page.locator('text=Undo Organization Run?')).toBeVisible()

      // Confirm the undo
      await page.locator('button:has-text("Confirm Undo")').click()

      // Dialog closes and post-undo summary appears, then close it
      await expect(page.locator('text=Undo Completed')).toBeVisible({ timeout: 15000 })
      await page.locator('button:has-text("Close")').click()

      // The history entry should now show the "Undone" badge
      await expect(page.locator('text=Undone')).toBeVisible({ timeout: 10000 })

      // The Undo button should no longer be present on this entry
      expect(await page.locator('button:has-text("Undo")').count()).toBe(0)
    } finally {
      cleanFixture(runFolder)
    }
  })

  // -------------------------------------------------------------------------
  // AC4: Guest user completes run → success screen → history nav not accessible
  // -------------------------------------------------------------------------
  test('Guest: success screen shown after run, history is not accessible', async () => {
    const runFolder = copyFixture()

    try {
      // Enter guest mode
      await expect(page.locator('text=Login to ClutterCut')).toBeVisible({ timeout: 5000 })
      await page.click('button:has-text("Continue as Guest")')
      await expect(page.locator('text=Select Folder to Organize')).toBeVisible({ timeout: 10000 })

      await runOrganizeFlow(app, page, runFolder, RULE_EXTENSION, RULE_DESTINATION)

      // Success screen shown
      await expect(page.locator('h1:has-text("Success!")')).toBeVisible({ timeout: 10000 })

      // "View History" button must NOT appear for guests
      await expect(page.locator('button:has-text("View History")')).not.toBeVisible()

      // Direct navigation to /history should redirect to /login
      await page.evaluate(() => {
        window.location.hash = '/history'
      })
      await expect(page.locator('text=Login to ClutterCut')).toBeVisible({ timeout: 5000 })
    } finally {
      cleanFixture(runFolder)
    }
  })
})
