# User Stories & Acceptance Criteria

## Feature 1: Folder Selection and Organization Flow
**As a** user,
**I want to** select an unorganized folder on my computer,
**So that** I can apply rules to it.

### Acceptance Criteria
- [x] User can click the "Browse" button to open the native OS file picker.
- [x] If the user selects an empty folder, they see an informative message ("This folder is empty.") and cannot proceed.
- [x] If the user selects a valid folder containing files, the path is displayed and the "Start Organizing" button is enabled.

---

## Feature 2: Rule Configuration and Preview
**As a** user,
**I want to** create rules to organize my files,
**So that** I can preview the changes before they are applied to my hard drive.

### Acceptance Criteria
- [x] User can create a "File Extension" rule (e.g., match `.pdf` -> move to `Documents` folder).
- [x] User can create a "Name Contains" rule (e.g., match `invoice` -> move to `Invoices` folder).
- [x] User can click "Preview Changes" and see their files grouped by the chosen folder destinations.
- [x] User can cancel the preview and return to the folder selection screen.
- [x] User can click "Back to Rules" and their inputted rules remain intact.

---

## Feature 3: Authentication & History Tracking
**As a** user,
**I want to** securely log in to the application and view my past organizations,
**So that** I have a permanent record of changes made.

### Acceptance Criteria
- [x] User can sign up with email/password, or use the app as a "Guest."
- [x] Valid login credentials direct the user to the `/organize` screen.
- [x] Invalid login credentials show an inline error.
- [x] Only authenticated users can access the `/history` route; guests are redirected.
- [x] Past organization runs are saved to Supabase with snapshots of the folder before and after.
