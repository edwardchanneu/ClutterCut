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

### Development

```bash
$ npm run dev
```

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

