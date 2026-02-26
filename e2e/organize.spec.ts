import { test, expect, _electron as electron, ElectronApplication, Page } from '@playwright/test'
import path from 'path'
import fs from 'fs'

let app: ElectronApplication
let page: Page

const FIXTURES_DIR = path.resolve(__dirname, 'fixtures')
const TEST_FOLDER = path.join(FIXTURES_DIR, 'test-folder')
let EMPTY_FOLDER: string

// A unique test user created during the sign up flow for authenticated test
const EXISTING_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@test.com'
const EXISTING_USER_PASSWORD = process.env.TEST_USER_PASSWORD || '12345678'

test.describe('Organize Flow E2E', () => {
  test.beforeAll(() => {
    const timestamp = Date.now()
    EMPTY_FOLDER = path.join(FIXTURES_DIR, `empty-folder-${timestamp}`)
    if (!fs.existsSync(EMPTY_FOLDER)) {
      fs.mkdirSync(EMPTY_FOLDER, { recursive: true })
    }
  })

  test.afterAll(() => {
    if (fs.existsSync(EMPTY_FOLDER)) {
      fs.rmSync(EMPTY_FOLDER, { recursive: true, force: true })
    }
  })

  test.beforeEach(async () => {
    app = await electron.launch({ args: ['.', '--no-sandbox'] })
    page = await app.firstWindow()
    await page.waitForTimeout(1000)

    // Explicitly sign out if a session somehow survived (Supabase in-memory or persisted)
    const signOutBtn = page.locator('button:has-text("Sign Out")')
    if (await signOutBtn.isVisible()) {
      await signOutBtn.click()
      await expect(page.locator('text=Login to ClutterCut')).toBeVisible({ timeout: 5000 })
    }

    // Clear any existing session that might be cached in Electron's localStorage
    await page.evaluate(() => {
      window.localStorage.clear()
    })

    // Reload to ensure the app boots to the unauthenticated /login state
    await page.reload()
    await page.waitForTimeout(1000)
  })

  test.afterEach(async () => {
    if (app) {
      await app.close()
    }
  })

  /**
   * Helper function to mock the folder selection dialog in the Electron main process
   */
  async function mockSelectFolderDialog(folderPath: string): Promise<void> {
    await app.evaluate(async ({ dialog }, contextPath) => {
      dialog.showOpenDialog = () => Promise.resolve({ canceled: false, filePaths: [contextPath] })
    }, folderPath)
  }

  test.describe('Guest User', () => {
    test.beforeEach(async () => {
      // Bypass auth via guest mode
      await expect(page.locator('text=Login to ClutterCut')).toBeVisible({ timeout: 5000 })
      await page.click('button:has-text("Continue as Guest")')
      await expect(page.locator('text=Select Folder to Organize')).toBeVisible({ timeout: 10000 })
    })

    test('selects an empty folder - informative message shown, cannot proceed', async () => {
      await mockSelectFolderDialog(EMPTY_FOLDER)
      await page.click('button:has-text("Browse")')

      // Assert informative message is shown
      await expect(page.locator('text=This folder is empty.')).toBeVisible()

      // The 'Start Organizing' button should be disabled
      const startOrganizingButton = page.locator('button:has-text("Start Organizing")')
      await expect(startOrganizingButton).toBeDisabled()
    })

    test('selects a valid folder, configure rules, and proceeds to preview', async () => {
      await mockSelectFolderDialog(TEST_FOLDER)
      await page.click('button:has-text("Browse")')

      // Since we selected a valid folder, expect its path to be shown
      await expect(page.locator('#selected-path')).toHaveText(TEST_FOLDER)

      const startOrganizingButton = page.locator('button:has-text("Start Organizing")')
      await expect(startOrganizingButton).toBeEnabled()
      await startOrganizingButton.click()

      // Should transition to Rules screen
      await expect(page.locator('h1:has-text("Configure Organization Rules")')).toBeVisible({
        timeout: 5000
      })

      // Create a "File Extension" rule matching '.txt' -> 'Text Files'
      const guestFirstRow = page.locator('ol > li').nth(0)
      await guestFirstRow.locator('select').selectOption({ label: 'File Extension' })
      await guestFirstRow.locator('input[placeholder="pdf"]').fill('.txt')
      await guestFirstRow.locator('input[placeholder="Documents"]').fill('Text Files')

      // Add a second rule for Name Contains
      await page.click('button:has-text("Add Rule")')

      const guestSecondRow = page.locator('ol > li').nth(1)
      await guestSecondRow.locator('select').selectOption({ label: 'Name Contains' })
      await guestSecondRow.locator('input[placeholder="invoice"]').fill('image')
      await guestSecondRow.locator('input[placeholder="Documents"]').fill('Images')

      // Proceed to Preview Screen
      const generatePreviewButton = page.locator('button:has-text("Preview Changes")')
      await expect(generatePreviewButton).toBeEnabled()
      await generatePreviewButton.click()

      // Should transition to Preview screen
      await expect(page.locator('h1:has-text("Preview Changes")')).toBeVisible({ timeout: 5000 })

      // Verify correct files are grouped
      // Group: Text Files
      await expect(page.locator('h3:has-text("Text Files")')).toBeVisible()
      await expect(
        page.locator('div:has(h3:has-text("Text Files"))').locator('text=test1.txt').first()
      ).toBeVisible()

      // Group: Images
      await expect(page.locator('h3:has-text("Images")')).toBeVisible()
      await expect(
        page.locator('div:has(h3:has-text("Images"))').locator('text=image.png').first()
      ).toBeVisible()

      // Check 'Back to Rules' behavior
      await page.click('button:has-text("Back to Rules")')
      await expect(page.locator('h1:has-text("Configure Organization Rules")')).toBeVisible({
        timeout: 5000
      })

      // Verify inputs remain intact
      const ruleRow1 = page.locator('ol > li').nth(0)
      const ruleRow2 = page.locator('ol > li').nth(1)
      await expect(ruleRow1.locator('input[placeholder="pdf"]')).toHaveValue('.txt')
      await expect(ruleRow1.locator('input[placeholder="Documents"]')).toHaveValue('Text Files')
      await expect(ruleRow2.locator('input[placeholder="invoice"]')).toHaveValue('image')
      await expect(ruleRow2.locator('input[placeholder="Documents"]')).toHaveValue('Images')

      // Go to preview again to test Cancel
      await generatePreviewButton.click()
      await expect(page.locator('h1:has-text("Preview Changes")')).toBeVisible({ timeout: 5000 })

      // Click Cancel on preview
      await page.click('button:has-text("Cancel")')

      // Verify returned to folder selection
      await expect(page.locator('text=Select Folder to Organize')).toBeVisible({ timeout: 5000 })
      // No folder selected after cancel
      await expect(page.locator('#selected-path')).not.toBeVisible()
    })
  })

  test.describe('Authenticated User', () => {
    test.beforeEach(async () => {
      // Login with valid credentials
      await expect(page.locator('text=Login to ClutterCut')).toBeVisible({ timeout: 5000 })
      await page.fill('input[type="email"]', EXISTING_USER_EMAIL)
      await page.fill('input[type="password"]', EXISTING_USER_PASSWORD)
      await page.click('button:has-text("Login")')
      await expect(page.locator('text=Select Folder to Organize')).toBeVisible({ timeout: 15000 })
    })

    test('selects folder, configures rules, proceeds to preview, and cancels', async () => {
      await mockSelectFolderDialog(TEST_FOLDER)
      await page.click('button:has-text("Browse")')

      // Since we selected a valid folder, expect its path to be shown
      await expect(page.locator('#selected-path')).toHaveText(TEST_FOLDER)

      await page.locator('button:has-text("Start Organizing")').click()
      await expect(page.locator('h1:has-text("Configure Organization Rules")')).toBeVisible({
        timeout: 5000
      })

      // Create a "File Extension" rule matching '.pdf' -> 'Documents'
      const authFirstRow = page.locator('ol > li').nth(0)
      await authFirstRow.locator('select').selectOption({ label: 'File Extension' })
      await authFirstRow.locator('input[placeholder="pdf"]').fill('.pdf')
      await authFirstRow.locator('input[placeholder="Documents"]').fill('Documents')

      const generatePreviewButton = page.locator('button:has-text("Preview Changes")')
      await expect(generatePreviewButton).toBeEnabled()
      await generatePreviewButton.click()

      // Preview screen
      await expect(page.locator('h1:has-text("Preview Changes")')).toBeVisible({ timeout: 5000 })

      // Verify correct files are grouped
      await expect(page.locator('h3:has-text("Documents")')).toBeVisible()
      await expect(
        page.locator('div:has(h3:has-text("Documents"))').locator('text=document.pdf').first()
      ).toBeVisible()

      // Check 'Cancel' behavior for authenticated user
      await page.click('button:has-text("Cancel")')

      // Verify returned to folder selection
      await expect(page.locator('text=Select Folder to Organize')).toBeVisible({ timeout: 5000 })
      await expect(page.locator('#selected-path')).not.toBeVisible()
    })
  })
})
