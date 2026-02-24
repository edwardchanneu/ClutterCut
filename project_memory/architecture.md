# Architecture Overview — ClutterCut

## Folder Structure

```
ClutterCut/
├── src/
│   ├── main/                    # Electron main process (Node.js)
│   │   ├── index.ts             # App entry, window creation
│   │   ├── ipc/                 # IPC handler registrations
│   │   │   ├── folderHandlers.ts
│   │   │   ├── organizeHandlers.ts
│   │   │   └── authHandlers.ts
│   │   ├── services/            # Core logic (file ops, snapshots, undo)
│   │   │   ├── fileOrganizer.ts
│   │   │   ├── snapshotService.ts
│   │   │   ├── undoService.ts
│   │   │   └── offlineQueue.ts
│   │   └── store/               # Electron local storage (session, queue)
│   │       └── localStore.ts
│   ├── renderer/                # React app (renderer process)
│   │   ├── main.tsx             # React entry
│   │   ├── App.tsx              # Router root
│   │   ├── routes/              # One file per route/screen
│   │   │   ├── Login.tsx
│   │   │   ├── Organize.tsx
│   │   │   ├── Rules.tsx
│   │   │   ├── Preview.tsx
│   │   │   ├── Success.tsx
│   │   │   └── History.tsx
│   │   ├── components/          # Shared UI components
│   │   │   ├── AppShell.tsx     # Header, nav, offline indicator
│   │   │   ├── RuleRow.tsx
│   │   │   ├── PreviewGroup.tsx
│   │   │   ├── HistoryEntry.tsx
│   │   │   └── ConfirmDialog.tsx
│   │   ├── hooks/               # Custom React hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useOfflineStatus.ts
│   │   │   └── useOrganizeSession.ts
│   │   ├── lib/                 # Supabase client, TanStack Query setup
│   │   │   ├── supabase.ts
│   │   │   └── queryClient.ts
│   │   └── types/               # Shared TypeScript types
│   │       └── index.ts
│   └── shared/                  # Types/constants shared between main and renderer
│       └── ipcChannels.ts       # Typed IPC channel name constants
├── e2e/                         # Playwright E2E tests
├── project_memory/
│   ├── mockups/
│   ├── clutter-cut-prd.md
│   ├── clutter-cut-issues.md
│   ├── project-overview.md
│   ├── architecture.md
│   ├── data-model.md
│   ├── screens-and-routes.md
│   ├── ui-components.md
│   └── user-flows.md
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── release.yml
├── electron-builder.config.ts
├── CLAUDE.md
└── package.json
```

## Key Architectural Rules

1. **The renderer process NEVER touches the file system.** All `fs` operations happen in `src/main/services/`. The renderer invokes them via typed IPC channels defined in `src/shared/ipcChannels.ts`.
2. **All IPC channels are typed end-to-end.** Define request/response types in `src/shared/ipcChannels.ts` and use them in both `ipcMain.handle()` and `ipcRenderer.invoke()`.
3. **Supabase is only accessed from the renderer** via the client in `src/renderer/lib/supabase.ts`. The main process never makes Supabase calls directly.
4. **TanStack Query wraps all Supabase reads.** Never use raw `supabase.from()` calls in component bodies — always go through a query hook in `src/renderer/hooks/`.
5. **Offline queue is persisted to disk** in Electron's `app.getPath('userData')` directory as a JSON file. It must survive app restarts.
