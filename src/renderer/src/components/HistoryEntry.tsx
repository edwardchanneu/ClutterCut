import type { UnifiedRun } from '../hooks/useHistory'
import type { Rule } from '../../../shared/ipcChannels'

// Helper component to render a snapshot object as a file tree
type SnapshotNode = string | { [folderName: string]: SnapshotNode[] }

function SnapshotTree({ snapshot }: { snapshot: unknown }): React.JSX.Element {
  // Gracefully handle parsing the snapshot
  if (!snapshot || typeof snapshot !== 'object') {
    return <div className="text-slate-400 italic px-2 py-1 text-sm">No files</div>
  }

  const snapshotRec = snapshot as Record<string, SnapshotNode[]>

  if (Object.keys(snapshotRec).length === 0) {
    return <div className="text-slate-400 italic px-2 py-1 text-sm">No files</div>
  }

  // We'll recursively parse and render
  const renderNodes = (nodes: SnapshotNode[], depth = 0): React.ReactNode => {
    const files = nodes.filter((n) => typeof n === 'string') as string[]
    const folders = nodes.filter((n) => typeof n === 'object' && n !== null) as Record<
      string,
      SnapshotNode[]
    >[]

    return (
      <>
        {files.map((file, i) => (
          <li
            key={`file-${depth}-${file}-${i}`}
            className="flex items-center text-sm font-medium text-slate-600 py-1"
            style={{ marginLeft: `${depth * 1.5}rem` }}
            title={file}
          >
            <span
              aria-hidden="true"
              className="font-medium text-slate-300 w-5 text-center shrink-0"
            >
              -
            </span>
            <span className="truncate ml-2">{file}</span>
          </li>
        ))}
        {folders.map((folderObj, i) =>
          Object.entries(folderObj).map(([folderName, contents], j) => {
            const itemCount = Array.isArray(contents)
              ? contents.filter((c) => typeof c === 'string').length
              : 0
            return (
              <div key={`folder-${depth}-${folderName}-${i}-${j}`} className="mt-1">
                <li
                  className="flex items-center gap-2 mb-1"
                  style={{ marginLeft: `${depth * 1.5}rem` }}
                  title={folderName}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-slate-400 shrink-0"
                  >
                    <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
                  </svg>
                  <span className="font-bold text-slate-800 truncate">{folderName}</span>
                  {itemCount > 0 && (
                    <span className="text-xs font-normal text-slate-400 shrink-0">
                      ({itemCount} item{itemCount !== 1 ? 's' : ''})
                    </span>
                  )}
                </li>
                {Array.isArray(contents) && renderNodes(contents, depth + 1)}
              </div>
            )
          })
        )}
      </>
    )
  }

  return (
    <ul className="flex flex-col gap-2">
      {Object.values(snapshotRec).map((rootVal, idx) => (
        <div key={idx} className="min-w-0">
          {Array.isArray(rootVal) && renderNodes(rootVal, 0)}
        </div>
      ))}
    </ul>
  )
}

export function HistoryEntry({
  run,
  isExpanded,
  onToggle
}: {
  run: UnifiedRun
  isExpanded: boolean
  onToggle: () => void
}): React.JSX.Element {
  const date = new Date(run.ran_at)
  const formattedDate = date.toLocaleDateString()
  const formattedTime = date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit'
  })

  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl overflow-hidden mb-4 shadow-sm transition-all hover:shadow-md">
      {/* Header */}
      <div className="p-6 flex justify-between items-start">
        <div className="flex flex-col gap-1 flex-1 min-w-0 pr-4">
          {/* Date and Time Header */}
          <h2
            className="text-xl font-extrabold text-slate-800 truncate"
            title={`${formattedDate}, ${formattedTime}`}
          >
            {formattedDate}, {formattedTime}
          </h2>
          {/* Meta Row */}
          <div className="text-sm text-slate-500 font-medium flex items-center gap-2 mt-1 flex-wrap">
            <span>
              {run.files_affected} file{run.files_affected !== 1 ? 's' : ''} affected
            </span>

            {run.undone && (
              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full font-bold ml-2 shrink-0">
                Undone
              </span>
            )}
            {run.isPendingSync && (
              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 text-xs rounded-full font-bold ml-2 shrink-0">
                Pending Sync
              </span>
            )}
          </div>
        </div>

        {/* Right Side Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Undo Button */}
          <button
            type="button"
            className="h-10 px-4 border border-slate-200 rounded-lg flex items-center gap-2 text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 transition-colors shadow-sm disabled:opacity-50"
            disabled={run.undone || run.isPendingSync}
            onClick={(e) => {
              e.stopPropagation()
              // TODO: Implement undo logic
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            Undo
          </button>

          {/* Expand Toggle */}
          <button
            type="button"
            className="h-10 w-10 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-100 flex items-center justify-center transition-colors"
            onClick={onToggle}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
          >
            <svg
              className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-6 pb-6 pt-2 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-6">
          {/* Rules Section */}
          {Array.isArray(run.rules) && run.rules.length > 0 && (
            <div>
              <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 mb-3">
                Rules Applied:
              </h3>
              <div className="flex flex-col gap-2">
                {(run.rules as Rule[]).map((rule, idx) => {
                  const readableType =
                    rule.conditionType === 'file_extension'
                      ? 'Extension'
                      : rule.conditionType === 'name_contains'
                        ? 'Name contains'
                        : rule.conditionType

                  return (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-2 text-sm shadow-sm"
                    >
                      <span className="text-slate-400 font-medium">{idx + 1}.</span>
                      <span className="text-slate-600 font-normal">{readableType}</span>
                      <span className="text-slate-800 font-bold bg-white px-2 py-0.5 rounded border border-slate-200 shadow-sm">
                        {rule.conditionValue}
                      </span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-slate-400 mx-1 shrink-0"
                      >
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                      </svg>
                      <span className="text-slate-800 font-bold">{rule.destinationFolder}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Snapshots Section (File Moves) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 mb-3 mt-2">
                Before:
              </h3>
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm overflow-x-auto max-h-80 overflow-y-auto">
                <SnapshotTree snapshot={run.before_snapshot} />
              </div>
            </div>
            <div>
              <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 mb-3 mt-2">
                After:
              </h3>
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm overflow-x-auto max-h-80 overflow-y-auto">
                <SnapshotTree snapshot={run.after_snapshot} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
