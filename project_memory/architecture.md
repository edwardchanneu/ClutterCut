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
