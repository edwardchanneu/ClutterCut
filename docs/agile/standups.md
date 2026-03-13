# Daily Standup Updates

## Sprint 1 (Auth, Guest Mode, CI/CD)

**Feb 24, 2026**
* **Heather Carminati:** 
  * Yesterday: Sprint Start
  * Today: Setting up the GitHub Actions CI/CD pipeline (Issue #3) and cleaning up duplicate architecture rules (Issue #11).
  * Blockers: None.
* **Edward Chan:**
  * Yesterday: Created the initial Email/Password Login Screen UI (Issue #1).
  * Today: Setting up the Supabase Project (Issue #2) and connecting the Login Screen to Supabase Auth (Issue #4).
  * Blockers: None.

**Feb 25, 2026**
* **Heather Carminati:**
  * Yesterday: Finished CI/CD pipeline and in-app sign-up via Supabase Auth (Issue #5).
  * Today: Implementing the Sign Out feature (Issue #7) and beginning Guest Mode (Issue #8).
  * Blockers: None.
* **Edward Chan:**
  * Yesterday: Finished connecting Login Screen to Supabase Auth.
  * Today: Working on persisting the authenticated session across app restarts (Issue #6).
  * Blockers: None.

**Feb 26, 2026**
* **Heather Carminati:**
  * Yesterday: Working on Guest Mode and configured GitHub Releases for macOS/Windows distribution (Issue #26).
  * Today: Wrapping up Guest Mode (Issue #8) no-auth flows.
  * Blockers: Getting Electron Builder to behave properly on macOS runners.
* **Edward Chan:**
  * Yesterday: Finished persisting the authenticated session.
  * Today: Writing Playwright E2E Tests for the Auth flows (Issue #25).
  * Blockers: None.

---

## Sprint 2 (Folder Selection, Rules, Preview)

**Feb 25, 2026**
* **Heather Carminati:**
  * Yesterday: Wrapping up Sprint 1 features.
  * Today: Started implementing Folder Selection via Native OS File Picker (Issue #18) and the Rule Configuration for File Extensions (Issue #19).
  * Blockers: Passing Electron's `dialog` back to React consistently.
* **Edward Chan:**
  * Yesterday: Finished E2E tests for Auth.
  * Today: Starting work on Multi-Rule Management for adding/deleting rules (Issue #21) and Rule Validation (Issue #22).
  * Blockers: None.

**Feb 26, 2026**
* **Heather Carminati:**
  * Yesterday: Got native folder selection working and file extension rules.
  * Today: Building the Rule Configuration for the "Name Contains" condition (Issue #20).
  * Blockers: None.
* **Edward Chan:**
  * Yesterday: Completed the Multi-Rule additions. 
  * Today: Finished Rule Validation and implementing the core Preview Screen (Issue #23).
  * Blockers: None.

**Feb 27, 2026**
* **Heather Carminati:**
  * Yesterday: Finished the rule state components for "Name Contains" filtering.
  * Today: Assisting with documentation and testing formatting.
  * Blockers: None.
* **Edward Chan:**
  * Yesterday: Built the Preview Screen to group the dry-run operations.
  * Today: Writing Playwright E2E Tests for the Organize Flow (Guest & Authenticated) through the Preview screen (Issue #27).
  * Blockers: None.

---

## Sprint 3 (Execution, History, Undo)

**Mar 10, 2026**
* **Heather Carminati:**
  * Yesterday: Refactoring execution services.
  * Today: Deep into implementing the actual File Organization Execution service using Node `fs` (Issue #28) and the Success Screen (Issue #29). 
  * Blockers: Avoiding silent overwrites on filenames during the copy.
* **Edward Chan:**
  * Yesterday: Wrapped up Sprint 2 testing.
  * Today: Schema design for saving Organization Runs to History for Authenticated Users (Issue #31).
  * Blockers: Deciding on the best JSONB format for the before/after snapshots.

**Mar 11, 2026**
* **Heather Carminati:**
  * Yesterday: Finished the execution service and Success screen.
  * Today: Implementing the Partial Failure Summary Screen (Issue #30) to show exactly which files succeeded and which failed.
  * Blockers: Native file permission errors on test directories throwing uncaught exceptions.
* **Edward Chan:**
  * Yesterday: Finalizing History database schema. 
  * Today: Implementing the Organization History Screen UI (Issue #32) and starting Undo (Issue #34).
  * Blockers: None.

**Mar 12, 2026**
* **Heather Carminati:**
  * Yesterday: Finished the Partial Failure screen.
  * Today: Refining UI copy and assisting with final E2E reviews.
  * Blockers: None.
* **Edward Chan:**
  * Yesterday: Built the core Undo engine for Organization Runs.
  * Today: Writing Playwright E2E Tests for Authenticated Organize, History & Undo (Issue #35).
  * Blockers: None.
