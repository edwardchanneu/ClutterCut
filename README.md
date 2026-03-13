# ClutterCut

[![CI](https://github.com/edwardchanneu/ClutterCut/actions/workflows/ci.yml/badge.svg)](https://github.com/edwardchanneu/ClutterCut/actions/workflows/ci.yml)

An Electron application with React and TypeScript

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Project Setup

### Install

```bash
$ npm install
```

### Supabase Setup

1. Create a Supabase project and enable **Email** Authentication (under Authentication -> Providers).
2. Go to the **SQL Editor** in Supabase and run the script located at `project_memory/database-setup.sql` to create the schema and enable RLS.
3. Copy `.env.example` to `.env` and fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from your project's API settings.
4. If you plan to run End-to-End tests (`npm run test:e2e`), you must also fill in `TEST_USER_EMAIL` and `TEST_USER_PASSWORD` in your `.env` file so the tests can log in successfully.

### Development

```bash
$ npm run dev
```

## 🧪 Testing & Quality Dashboards

ClutterCut includes visual dashboards for testing and code coverage.

### Unit Tests (Vitest)

- **Standard Run:** `npm run test`
- **UI Dashboard:** `npm run test:ui` (Opens a beautiful browser interface to manage and run tests)
- **Code Coverage:** `npm run test:coverage` (Generates and automatically opens an interactive HTML coverage report)

### End-to-End Tests (Playwright)

- **Run E2E Tests:** `npm run test:e2e`
- **HTML Report:** `npm run test:e2e:report` (Opens the dashboard for the latest Playwright test run)

### Build

```bash
# For windows
$ npm run build:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux
```

## 🚀 Releases & Installation

ClutterCut is automatically packaged and published using GitHub Actions.

### For Users: Installing the Application

**Windows:**

1. Go to the [Releases page](../../releases) and download the latest `.exe` installer.
2. Double click the `.exe` file to install.

**macOS:**
Because this app is open-source and not notarized via a paid Apple Developer account, macOS Gatekeeper will show an "App is damaged" error by default. Follow these steps to install:

1. Download the `.dmg` from the [Releases page](../../releases) and open it.
2. Drag `ClutterCut.app` into your **Applications** folder.
3. Open your **Terminal** (CMD + Space, type "Terminal").
4. Run the following command to remove the Apple quarantine flag:
   ```bash
   xattr -cr /Applications/ClutterCut.app
   ```
5. You can now launch ClutterCut normally from your Applications folder!
