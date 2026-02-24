# ClutterCut — Product Requirements Document

**Version:** 1.0 (MVP)
**Status:** Draft
**Authors:** Heather Carminati, Edward Chan
**Last Updated:** February 23, 2026

---

## 1. Overview

### 1.1 Product Summary

ClutterCut is a cross-platform Electron desktop application that helps users automatically organize files in a selected directory by applying user-defined rules. Before any changes are made, users review a full preview of the planned operations and can undo any run via a saved file tree snapshot. Authenticated users have their organization history synced to the cloud via Supabase.

### 1.2 Problem Statement

Users across technical skill levels struggle with file system clutter. They lose significant time searching for files, have failed to maintain self-imposed folder systems, and distrust automated tools that operate without transparency. Existing solutions like Hazel lack a pre-execution preview, causing users to lose trust after a single bad experience. The core insight from user research is that **transparency and reversibility are non-negotiable** — they are the primary trust signals that determine whether a user will adopt an organizational tool.

### 1.3 Target Users

| Persona                      | Description                                     | Key Need                                                |
| ---------------------------- | ----------------------------------------------- | ------------------------------------------------------- |
| Creative Freelancer (Maya)   | Freelance designer, works from home, Mac user   | Client-based organization, preview before execution     |
| CS Graduate Student (Daniel) | PhD student, power user, privacy-conscious      | Dry-run preview, guaranteed undo, local-first trust     |
| Everyday User (Carol)        | Office manager, low technical literacy, PC user | Simplicity, fear of deletion, visible safety mechanisms |

### 1.4 Goals

- Deliver a trustworthy, transparent file organization experience
- Reduce time lost searching for misplaced files
- Provide full reversibility so users never feel at risk
- Support authenticated and guest usage patterns

### 1.5 Non-Goals (Post-MVP)

- AI-suggested or auto-generated rules
- Recursive/nested subfolder organization
- Multi-condition (AND/OR) rule logic
- Cloud folder support (iCloud, Google Drive, Dropbox)
- Client-based or project-based organizational templates
- In-app account creation / guest-to-account upgrade flow
- Linux support

---

## 2. Tech Stack

| Layer                     | Technology                            |
| ------------------------- | ------------------------------------- |
| Desktop Shell             | Electron                              |
| Frontend                  | React                                 |
| Backend / File Operations | Node.js (Electron main process)       |
| Server State & Caching    | TanStack Query                        |
| Cloud Database & Auth     | Supabase (PostgreSQL + Supabase Auth) |
| Distribution              | GitHub Releases (macOS + Windows)     |

### 2.1 Architecture Notes

- All file system operations (read, move, snapshot) run in the **Electron main process** via Node.js `fs` APIs. The renderer process never touches the file system directly.
- Supabase handles authentication and cloud persistence of organization history (including rule sets and before/after snapshots).
- When the user is offline but authenticated, organization runs execute locally and are queued for Supabase sync when connectivity is restored.
- Guest users operate entirely locally with no persistence layer.

---

## 3. Authentication & User Modes

### 3.1 Modes

| Mode          | Auth State                  | History                                       | Sync                                   |
| ------------- | --------------------------- | --------------------------------------------- | -------------------------------------- |
| Authenticated | Logged in via Supabase Auth | Stored in Supabase, accessible across devices | Syncs when online; queues when offline |
| Guest         | Not logged in               | Unavailable                                   | None                                   |

### 3.2 Auth Requirements

- Login via email + password using Supabase Auth
- Session persisted locally in Electron so users stay logged in across app restarts
- Sign up via email + password directly within the Electron app
- Login via email + password using Supabase Auth
- No guest-to-account upgrade flow for MVP

### 3.3 Offline Behavior (Authenticated Users)

- The app detects network connectivity state on launch and continuously monitors it
- If offline: organizing is fully functional; completed runs are stored in a local queue
- When connectivity is restored: queued runs (history records + snapshots) are synced to Supabase automatically in the background
- The UI should clearly indicate offline status and pending sync state

---

## 4. Feature Requirements

### 4.1 Folder Selection

**Description:** The user selects a top-level folder to organize. Only files at the immediate top level of the selected folder are in scope — subdirectories and their contents are untouched.

**Requirements:**

- User opens a native OS folder picker dialog
- Selected folder path is displayed in the UI before proceeding
- The app reads and lists all top-level files in the selected folder (not subdirectories)
- The app does not modify anything at this stage

**Edge Cases:**

- Empty folder: inform the user no files were found, do not proceed to rules
- Folder with only subdirectories and no top-level files: same behavior as empty
- Folder read permission denied: display a clear error message

---

### 4.2 Rule Configuration

**Description:** The user defines one or more rules. Each rule has a single condition and a destination folder name. Rules are evaluated top-to-bottom. A file matches the first rule it satisfies.

**Rule Structure:**

```
Rule = {
  condition_type: "file_extension" | "name_contains",
  condition_value: string,         // e.g. "pdf" or "invoice"
  destination_folder: string       // e.g. "Documents" or "Invoices 2026"
}
```

**Condition Types (MVP):**
| Type | Behavior | Example |
|---|---|---|
| File Extension | Matches files whose extension equals the value (case-insensitive) | `pdf` matches `report.PDF`, `invoice.pdf` |
| Name Contains | Matches files whose full filename (including extension) contains the value (case-insensitive) | `invoice` matches `Invoice_Jan.pdf`, `my_invoice.xlsx` |

**Requirements:**

- User can add multiple rules via an "+ Add Rule" control
- User can delete any rule via a delete/trash control on each rule row
- Rules are ordered and numbered; order determines priority (first match wins)
- Rule reordering is post-MVP
- Destination folder is a free-text input; the user types the folder name they want
- Unmatched files (no rule applies) are left in place and not moved
- The "Preview Changes" button is the only way to proceed; there is no direct "Run" from this screen

**Validation:**

- Condition value must not be empty
- Destination folder name must not be empty
- Destination folder name must not contain characters illegal on the OS (e.g., `\ / : * ? " < > |` on Windows)
- Duplicate rules (same condition type + value) should surface a warning but not block the user

---

### 4.3 Preview

**Description:** Before any files are moved, the user sees a complete breakdown of what will happen. This is the primary trust-building feature of ClutterCut.

**Requirements:**

- Display total number of files that will be moved
- Group files by destination folder, showing each destination folder and the files that will be moved into it
- Files that match no rule are listed separately as "No changes" or simply omitted with a note
- Show a clear "Back to Rules" navigation so the user can revise rules without losing them
- Two actions available: **Cancel** (returns to folder selection) and **Approve & Organize** (executes the run)
- No files are moved until the user explicitly clicks "Approve & Organize"

---

### 4.4 File Organization (Execution)

**Description:** After the user approves, ClutterCut executes the file moves.

**Requirements:**

- Before moving any files, capture a **before snapshot**: a text-based recursive file tree of the selected folder
- Move files according to rules, top-to-bottom priority
- If a destination folder does not exist, create it inside the selected folder
- If a destination folder already exists, move files into it (do not overwrite existing files with the same name — append a suffix like `_1`, `_2` if a filename conflict occurs)
- After all moves, capture an **after snapshot**: a text-based recursive file tree of the selected folder
- On success: navigate to a success confirmation screen
- On partial failure (one or more files could not be moved): display which files failed and why; successfully moved files are not rolled back automatically but the user is informed and can use Undo

**Snapshot Format:**

The snapshot is a JSON object keyed by the selected root directory. Its value is an array containing filenames and subdirectory names that exist at the top level.

**Before snapshot** — all top-level files and subdirectories are represented as plain strings. Subdirectory contents are never read or included.

```json
{
  "/Desktop": [
    "invoice_2026_01.pdf",
    "taxes_2025.pdf",
    "client_feedback.pdf",
    "/Documents",
    "/Images"
  ]
}
```

**After snapshot** — folders that ClutterCut moved files into are represented as objects where the key is the folder name and the value is an array of the files ClutterCut placed inside it. Folders that existed before the run and were not touched by ClutterCut remain as plain strings.

```json
{
  "/Desktop": [
    "/Invoices": {
      "invoice_2026_01.pdf"
    },
    "/Taxes": {
      "taxes_2025.pdf"
    },
    "/Documents": {
      "client_feedback.pdf"
    },
    "/Images"
  ]
}
```

The distinction between a plain string and an object in the after snapshot is the key signal used by the Undo operation to determine which files ClutterCut moved and where they originated from.

---

### 4.5 Organization History

**Description:** Authenticated users can view a log of all past organization runs, including what rules were applied, which files were moved, and the before/after snapshots.

**Data Model (Supabase):**

```
organization_runs
  id: uuid
  user_id: uuid (FK → auth.users)
  folder_path: string
  ran_at: timestamp
  synced_at: timestamp (nullable — null if not yet synced)
  rules: jsonb                  // ordered array of rule objects, e.g. [{ "condition_type": "file_extension", "condition_value": "pdf", "destination_folder": "Documents" }, { "condition_type": "name_contains", "condition_value": "invoice", "destination_folder": "Invoices" }]
  before_snapshot: jsonb        // JSON snapshot — root dir as key, array of top-level files and subdirectory names as plain strings
  after_snapshot: jsonb         // JSON snapshot — ClutterCut-touched folders as objects with moved files as values; untouched subdirectories remain as plain strings
  files_affected: integer
  is_undo: boolean              // true if this entry was created by an undo operation
  undone: boolean               // true if this run has been undone by a subsequent undo
  parent_run_id: uuid (nullable, FK → organization_runs.id) // references the original run this undo was derived from
```

**Requirements:**

- History is scoped to the authenticated user
- Runs are displayed in reverse chronological order
- Each history entry shows: folder path, timestamp, files affected count
- Each entry is expandable to show: rules applied, file moves grouped by destination, before/after snapshots
- Undo is available from the history view (see 4.6)
- Guest users: history screen is not accessible; history nav item is hidden or replaced with a prompt to log in
- Offline: completed runs are stored locally and synced to Supabase on reconnection; until synced, they are still visible in the history UI with a "pending sync" indicator

---

### 4.6 Undo

**Description:** Users can reverse a past organization run by restoring files to their original locations using the saved before-snapshot as the source of truth. Each undo is itself recorded as a new history entry, making it fully reversible.

**Requirements:**

- Undo is available for every run in the history list that has not already been undone
- Undo reads the **before snapshot** to determine original file locations, then moves files back accordingly
- Undo only moves files that ClutterCut placed — it uses the delta between before and after snapshots to determine which files to move back
- If a file that was moved has since been deleted or moved by the user manually, skip that file and report it as unresolvable in a post-undo summary
- Undo does not require re-confirming rules but does require a confirmation dialog ("Are you sure you want to undo this organization run?")
- After a successful undo, a **new history entry** is created representing the undo operation, with its own before and after snapshots captured at the time of the undo
- The original run is marked as undone in the history log but is not deleted
- The undo history entry is itself undoable — the user can undo an undo, which restores files to the state after the original run

---

### 4.7 Success Screen

**Requirements:**

- Displayed after a successful organization run
- Shows confirmation message and files affected count
- Two CTAs: "View History" and "Organize Another Folder"

---

## 5. User Stories

### 5.1 Authentication & Onboarding

| ID    | As a...                          | I want to...                                           | So that...                                          | Acceptance Criteria                                                                                                                                                            |
| ----- | -------------------------------- | ------------------------------------------------------ | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| US-01 | new user                         | sign up with my email and password from within the app | I can create an account without leaving the app     | A "Sign Up" option is available on the login screen; submitting valid credentials creates a Supabase account and logs the user in, landing them on the folder selection screen |
| US-02 | new user                         | log in with my email and password                      | I can access my organization history across devices | Given valid credentials, the user is authenticated and lands on the folder selection screen                                                                                    |
| US-03 | returning user                   | stay logged in between app restarts                    | I don't have to re-enter my credentials every time  | Session persists in Electron local storage; user is not prompted to log in again unless session expires                                                                        |
| US-04 | user who doesn't want an account | use the app as a guest                                 | I can organize files without signing up             | A "Continue as Guest" option is available on the login screen; guest users access all core organize features except history                                                    |

---

### 5.2 Folder Selection

| ID    | As a... | I want to...                                                          | So that...                                                       | Acceptance Criteria                                                                                         |
| ----- | ------- | --------------------------------------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| US-04 | user    | select a folder from my computer using a familiar dialog              | I can choose exactly which directory to organize                 | Clicking "Browse" opens the native OS folder picker; selected path is displayed in the UI                   |
| US-05 | user    | see the selected folder path before proceeding                        | I know I've chosen the right folder before configuring any rules | The selected folder path is clearly displayed after selection and before moving to rule configuration       |
| US-06 | user    | be informed when a selected folder is empty or has no top-level files | I don't waste time configuring rules for nothing                 | If no top-level files are found, a clear message is shown and the user cannot proceed to rule configuration |

---

### 5.3 Rule Configuration

| ID    | As a... | I want to...                                                              | So that...                                                          | Acceptance Criteria                                                                                                       |
| ----- | ------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| US-07 | user    | create a rule that moves files by file extension                          | I can send all my PDFs or images to a specific folder automatically | A "File Extension" condition type is available; entering "pdf" matches all `.pdf` files case-insensitively                |
| US-08 | user    | create a rule that moves files whose name contains a keyword              | I can group files like invoices or homework by naming pattern       | A "Name Contains" condition type is available; matching is case-insensitive against the full filename including extension |
| US-09 | user    | add multiple rules in a single run                                        | I can organize different file types into different folders at once  | Multiple rules can be added via "+ Add Rule"; each rule is numbered in priority order                                     |
| US-10 | user    | delete a rule I no longer want                                            | I can correct mistakes without starting over                        | Each rule row has a delete control; removing it immediately updates the rule list                                         |
| US-11 | user    | specify a destination folder name for each rule                           | I control exactly where matching files are sent                     | Destination folder is a free-text input per rule; it accepts any valid folder name                                        |
| US-12 | user    | be warned if I leave a rule's condition value or destination folder empty | I don't accidentally create a broken rule                           | Inline validation prevents proceeding to preview if any rule has an empty condition value or destination                  |

---

### 5.4 Preview

| ID    | As a... | I want to...                                                            | So that...                                                           | Acceptance Criteria                                                                                                            |
| ----- | ------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| US-13 | user    | see exactly which files will be moved and where before anything happens | I can catch mistakes before they affect my file system               | Preview screen shows all planned moves grouped by destination folder with file names listed; no files are moved until approval |
| US-14 | user    | see how many files will be affected in total                            | I have a quick sense of the scope of the operation                   | Total file count is displayed prominently at the top of the preview screen                                                     |
| US-15 | user    | go back to edit my rules from the preview screen                        | I can adjust rules without losing my work if the preview looks wrong | "Back to Rules" navigation returns to rule configuration with all existing rules intact                                        |
| US-16 | user    | cancel the operation entirely from the preview screen                   | I can abort without making any changes                               | "Cancel" returns the user to folder selection; no files are moved                                                              |

---

### 5.5 File Organization (Execution)

| ID    | As a... | I want to...                                                              | So that...                                                                                      | Acceptance Criteria                                                                                                        |
| ----- | ------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| US-17 | user    | have my files moved only after I explicitly approve the preview           | I am always in control; nothing happens without my consent                                      | Files are only moved after the user clicks "Approve & Organize" on the preview screen                                      |
| US-18 | user    | have destination folders created automatically if they don't exist        | I don't have to manually create folders before running a rule                                   | If a destination folder does not exist inside the selected folder, ClutterCut creates it before moving files               |
| US-19 | user    | have files moved into an existing destination folder if it already exists | My existing folder structure is respected and extended                                          | If the destination folder already exists, files are moved into it without replacing the folder                             |
| US-20 | user    | have filename conflicts resolved automatically                            | I don't lose existing files when a moved file shares a name with one already in the destination | If a filename conflict occurs, the moved file is renamed with a numeric suffix (e.g. `report_1.pdf`); the user is informed |
| US-21 | user    | be notified if any files could not be moved                               | I know when something went wrong and can take action                                            | A post-run summary lists any files that failed to move with a reason; successfully moved files are not rolled back         |

---

### 5.6 History

| ID    | As a...                    | I want to...                                                           | So that...                                                          | Acceptance Criteria                                                                                                 |
| ----- | -------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| US-22 | authenticated user         | view a list of all my past organization runs                           | I have a full record of what ClutterCut has done to my files        | History screen shows all runs in reverse chronological order with folder path, timestamp, and files affected count  |
| US-23 | authenticated user         | expand a history entry to see the rules that were applied              | I understand what logic drove a past organization run               | Expanding a history entry reveals the ordered list of rules that were used                                          |
| US-24 | authenticated user         | expand a history entry to see the before and after file tree snapshots | I can clearly see what my folder looked like before and after a run | Expanding a history entry shows both the before and after text-based file tree                                      |
| US-25 | authenticated user         | have my history available on any device I log into                     | My records follow me across machines                                | Organization history is stored in Supabase and accessible after logging in on any device                            |
| US-26 | offline authenticated user | have my completed runs synced to my history when I reconnect           | I don't lose records of runs performed while offline                | Runs completed offline are queued locally, survive app restarts, and sync to Supabase automatically on reconnection |
| US-27 | offline authenticated user | see which history entries are pending sync                             | I know which records haven't been saved to the cloud yet            | Pending-sync runs are visually marked in the history list until confirmed synced                                    |

---

### 5.7 Undo

| ID    | As a... | I want to...                                                               | So that...                                                             | Acceptance Criteria                                                                                                                                                                |
| ----- | ------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| US-28 | user    | undo a past organization run and restore files to their original locations | I can reverse a mistake without manually hunting down every moved file | Clicking "Undo" on a history entry moves all affected files back to their original paths as recorded in the before snapshot; a new history entry is created for the undo operation |
| US-29 | user    | be asked to confirm before an undo is executed                             | I don't accidentally trigger an undo                                   | A confirmation dialog appears before undo executes; the operation only proceeds on explicit confirmation                                                                           |
| US-30 | user    | see a summary after an undo completes                                      | I know if any files could not be restored                              | Post-undo summary lists successfully restored files and any files that could not be found or restored, with reasons                                                                |
| US-31 | user    | still see a history entry after it has been undone                         | I have a complete audit trail of all actions including reversals       | Undone runs remain in the history list and are clearly marked as undone                                                                                                            |
| US-32 | user    | undo an undo operation                                                     | I can re-apply an organization run I reversed by mistake               | An undo history entry has its own Undo button; executing it restores files to the state after the original run and creates a new history entry                                     |

---

## 6. User Flows

### 5.1 Primary Flow (Authenticated, Online)

```
Login → Select Folder → Configure Rules → Preview Changes → Approve & Organize → Success → (optional) View History → Undo
```

### 5.2 Guest Flow

```
Continue as Guest → Select Folder → Configure Rules → Preview Changes → Approve & Organize → Success
```

History and Undo are not available to guest users.

### 5.3 Authenticated, Offline Flow

```
Login (cached session) → Select Folder → Configure Rules → Preview Changes → Approve & Organize → Success
→ Run stored locally → Synced to Supabase on reconnection
```

---

## 6. UX & Design Requirements

### 6.1 General Principles

- **Clarity over cleverness:** Every screen should communicate exactly what is happening or about to happen
- **Safety signals:** Preview and Undo must be visually prominent — they are the primary trust mechanisms
- **Minimal cognitive load:** Rule configuration must be approachable for non-technical users (Carol persona); avoid developer-centric terminology
- **Offline awareness:** The UI must clearly communicate offline status and pending sync state at all times

### 6.2 Screen Inventory

| Screen                    | Route / State       |
| ------------------------- | ------------------- |
| Login                     | `/login`            |
| Folder Selection          | `/organize`         |
| Rule Configuration        | `/organize/rules`   |
| Preview                   | `/organize/preview` |
| Success                   | `/organize/success` |
| Organization History      | `/history`          |
| History Detail (expanded) | `/history/:runId`   |

### 6.3 Error States Required

- Folder permission denied
- Empty folder / no top-level files
- File move failure (partial or full)
- Filename conflict on move (auto-resolved with suffix, user informed)
- Supabase sync failure (retry with indicator)
- Undo: file not found / already moved

---

## 7. Non-Functional Requirements

### 7.1 Performance

- Folder scanning and rule evaluation should complete in under 2 seconds for folders with up to 1,000 top-level files
- Preview generation should be non-blocking (use async file reads)
- Snapshot capture should not noticeably delay the post-approval execution

### 7.2 Security

- File system access is limited to the folder the user explicitly selects
- No file contents are ever read — only names, extensions, and paths
- No file data is transmitted to Supabase — only metadata (paths, names, rule config, snapshots as text)
- Supabase Row Level Security (RLS) must be enabled so users can only access their own organization history

### 7.3 Reliability

- File moves must be atomic where possible; partial failures must not leave the user with an inconsistent state without notification
- Local queue for offline runs must survive app restarts (persisted to Electron's local app data directory, not memory)

### 7.4 Distribution

- Packaged and distributed via GitHub Releases
- macOS: `.dmg` installer
- Windows: `.exe` installer (NSIS or Squirrel)
- Auto-update mechanism is post-MVP

---

## 8. MoSCoW Prioritization

### Must Have

These are non-negotiable for MVP. The product does not ship without them.

- Folder selection via native OS dialog
- Rule configuration with "File Extension" and "Name Contains" condition types
- Single condition per rule
- Top-level files only (no recursion)
- Pre-execution preview screen showing all planned file moves grouped by destination
- File organization execution (move files per rules, create destination folders if needed)
- Filename conflict resolution (auto-suffix `_1`, `_2`)
- Before and after text-based file tree snapshots captured per run
- Undo from history using before/after snapshot delta
- Supabase Auth (email + password login)
- Organization history stored in Supabase (authenticated users only)
- Rules persisted to Supabase as part of each history record
- In-app signup via Supabase Auth (email + password)
- Guest / offline mode (no history, no sync)
- Offline-first organizing for authenticated users with local queue synced on reconnection
- macOS and Windows builds distributed via GitHub Releases

### Should Have

Important features that significantly improve the experience but won't block launch.

- Pending sync indicator in the UI when runs are queued locally
- Offline status indicator in the app chrome
- Confirmation dialog before executing an undo
- Post-undo summary (reporting any files that could not be restored)
- Expandable history entries showing rules applied and file moves
- Clear, user-friendly error states for all known failure modes (permission denied, empty folder, move failure, sync failure)
- "Organize Another Folder" shortcut from the success screen

### Could Have

Nice-to-have additions if time permits after Must and Should items are complete.

- Visual diff between before/after snapshots in the history detail view
- Warning when duplicate rules are configured (same condition type + value)
- File count badge on the Preview screen per destination folder
- Subtle animations or transitions between screens to reinforce the step-by-step flow

### Won't Have (MVP)

Explicitly deferred. See Section 9 for full out-of-scope list.

- AI/auto-suggested rules
- Multi-condition rules (AND/OR logic)
- Recursive subfolder organization
- Rule reordering (drag-and-drop)
- Saved/reusable rule sets across sessions
- Cloud folder support (iCloud, Google Drive, Dropbox)
- In-app signup or guest-to-account upgrade
- Linux support
- Auto-update mechanism

---

## 9. Out of Scope (MVP)

| Feature                           | Notes                |
| --------------------------------- | -------------------- |
| AI/auto-suggested rules           | Post-MVP             |
| Recursive subfolder organization  | Post-MVP             |
| Multi-condition rules (AND/OR)    | Post-MVP             |
| Rule reordering via drag-and-drop | Post-MVP             |
| Saved/reusable rule sets          | Post-MVP             |
| Cloud folder support              | Post-MVP             |
| Guest-to-account upgrade          | Post-MVP             |
| In-app signup                     | Now in scope for MVP |
| Linux support                     | Post-MVP             |
| Auto-update                       | Post-MVP             |

---

- Filename conflicts are resolved by auto-appending a numeric suffix (`_1`, `_2`, etc.) to the moved file; the user is informed of any renames post-run
- Offline run queue is persisted as a JSON file in Electron's `userData` directory and survives app restarts
- Folders exceeding 1,000 top-level files will surface a size warning before execution; snapshots stored in Supabase are capped at 1MB — if a snapshot exceeds this limit it will be truncated and the user will be informed
- If a user's Supabase session expires while offline, the user is shown a re-authentication prompt on reconnection before any queued runs are synced
