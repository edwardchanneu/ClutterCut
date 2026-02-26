import { test, expect, _electron as electron, ElectronApplication, Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

let app: ElectronApplication
let page: Page

// A unique test user created during the sign up flow
const TEARDOWN_EMAIL = `test_e2e_${Date.now()}@example.com`
const TEARDOWN_PASSWORD = 'Password123!'

// An existing user assumed to be seeded in the DB or created via Playwright fixture/setup
const EXISTING_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@test.com'
const EXISTING_USER_PASSWORD = process.env.TEST_USER_PASSWORD || '12345678'

test.describe('Auth Flows', () => {
  test.beforeEach(async () => {
    app = await electron.launch({ args: ['.', '--no-sandbox'] })
    page = await app.firstWindow()
    await page.waitForTimeout(1000) // Wait for React to load

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

  test.afterAll(async () => {
    // Cleanup user from Supabase using the secure RPC function.
    // This removes the need to store the highly-privileged Service Role Key in .env.
    const supabaseUrl = process.env.VITE_SUPABASE_URL
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY

    if (supabaseUrl && anonKey) {
      const supabase = createClient(supabaseUrl, anonKey)

      // 1. Sign in as the user we just created
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: TEARDOWN_EMAIL,
        password: TEARDOWN_PASSWORD
      })

      if (!signInError && authData.session) {
        // 2. Call the RPC function to self-delete
        await supabase.rpc('delete_test_user')

        // 3. Explicitly sign out to clear the session
        await supabase.auth.signOut()
      }
    }
  })

  test('New user signs up and lands on /organize', async () => {
    // App loads to /login by default catch-all route
    await expect(page.locator('text=Login to ClutterCut')).toBeVisible({ timeout: 5000 })

    // Navigate to Sign Up
    await page.click('span:has-text("Sign up")')
    await expect(page.locator('text=Create an Account')).toBeVisible({ timeout: 10000 })

    // Fill credentials
    await page.fill('input[type="email"]', TEARDOWN_EMAIL)
    await page.fill('input[type="password"]', TEARDOWN_PASSWORD)

    // Click Sign Up
    await page.click('button:has-text("Sign Up")')

    // Assert navigation to /organize by checking for a unique element
    await expect(page.locator('text=Select Folder to Organize')).toBeVisible({ timeout: 15000 })
    expect(page.url()).toContain('#/organize')
  })

  test('Existing user logs in with valid credentials', async () => {
    // App loads to /login by default
    await expect(page.locator('text=Login to ClutterCut')).toBeVisible({ timeout: 5000 })

    await page.fill('input[type="email"]', EXISTING_USER_EMAIL)
    await page.fill('input[type="password"]', EXISTING_USER_PASSWORD)

    await page.click('button:has-text("Login")')

    await expect(page.locator('text=Select Folder to Organize')).toBeVisible({ timeout: 15000 })
    expect(page.url()).toContain('#/organize')
  })

  test('User logs in with invalid credentials shows inline error', async () => {
    // App loads to /login by default
    await expect(page.locator('text=Login to ClutterCut')).toBeVisible({ timeout: 5000 })

    await page.fill('input[type="email"]', 'wrong@example.com')
    await page.fill('input[type="password"]', 'WrongPassword123!')

    await page.click('button:has-text("Login")')

    // Expect inline error "Invalid login credentials" (Supabase default)
    const errorLocator = page.locator('div[role="alert"]')
    await expect(errorLocator).toBeVisible({ timeout: 10000 })
    await expect(errorLocator).toContainText('Invalid login credentials')

    // Verify we are still on the login page
    expect(page.url()).toContain('#/login')
  })

  test('User clicks "Continue as Guest" bypasses auth to /organize', async () => {
    // App loads to /login by default
    await expect(page.locator('text=Login to ClutterCut')).toBeVisible({ timeout: 5000 })

    await page.click('button:has-text("Continue as Guest")')

    await expect(page.locator('text=Select Folder to Organize')).toBeVisible({ timeout: 10000 })
    expect(page.url()).toContain('#/organize')
  })

  test('Authenticated user signs out and is redirected, history navigation redirects back', async () => {
    // App loads to /login by default
    await expect(page.locator('text=Login to ClutterCut')).toBeVisible({ timeout: 5000 })

    // Complete the login flow
    await page.fill('input[type="email"]', EXISTING_USER_EMAIL)
    await page.fill('input[type="password"]', EXISTING_USER_PASSWORD)
    await page.click('button:has-text("Login")')
    await expect(page.locator('text=Select Folder to Organize')).toBeVisible({ timeout: 15000 })

    // Click Sign Out
    await expect(page.locator('button:has-text("Sign Out")')).toBeVisible({ timeout: 10000 })
    await page.click('button:has-text("Sign Out")')

    // Assert redirected to login
    await expect(page.locator('text=Login to ClutterCut')).toBeVisible({ timeout: 10000 })
    expect(page.url()).toContain('#/login')

    // Attempt to navigate to history directly
    await page.evaluate(() => {
      window.location.hash = '/history'
    })

    // Should immediately redirect back to login
    await expect(page.locator('text=Login to ClutterCut')).toBeVisible({ timeout: 5000 })
    expect(page.url()).toContain('#/login')
  })
})
