# Data Model — ClutterCut

## TypeScript Types

```typescript
// src/shared/types.ts

type ConditionType = 'file_extension' | 'name_contains';

interface Rule {
  id: string;           // uuid, client-generated
  condition_type: ConditionType;
  condition_value: string;
  destination_folder: string;
}

interface OrganizationRun {
  id: string;           // uuid
  user_id: string;
  folder_path: string;
  ran_at: string;       // ISO timestamp
  synced_at: string | null;
  rules: Rule[];
  before_snapshot: string;  // plain-text file tree
  after_snapshot: string;
  files_affected: number;
  is_undone?: boolean;
}
```

## Supabase Table

**Table:** `organization_runs`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `user_id` | `uuid` | FK → `auth.users` |
| `folder_path` | `text` | |
| `ran_at` | `timestamptz` | |
| `synced_at` | `timestamptz` | `null` if not yet synced |
| `rules` | `jsonb` | Ordered array of `Rule` objects |
| `before_snapshot` | `jsonb` | JSON snapshot — root dir as key, array of top-level files and subdirectory names as plain strings |
| `after_snapshot` | `jsonb` | JSON snapshot — ClutterCut-touched folders as objects with moved files as values; untouched subdirectories remain as plain strings |
| `files_affected` | `integer` | |
| `is_undo` | `boolean` | `true` if this entry was created by an undo operation |
| `undone` | `boolean` | `true` if this run has been undone by a subsequent undo |
| `parent_run_id` | `uuid` (nullable) | FK → `organization_runs.id`; references the original run this undo was derived from |

**Row Level Security (RLS):** Enabled. Policy for all operations: `user_id = auth.uid()`. Users can only read and write their own records.
