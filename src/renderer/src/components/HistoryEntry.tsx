import { useState } from 'react'
import type { UnifiedRun } from '../hooks/useHistory'
import type { Rule, UndoRunResponse } from '../../../shared/ipcChannels'
import { useUndo } from '../hooks/useUndo'

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
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [undoSummary, setUndoSummary] = useState<UndoRunResponse | null>(null)
  const { undoRunAction, isUndoing, error } = useUndo()

  const handleUndoClick = async (): Promise<void> => {
    try {
      const response = await undoRunAction(run)
      setShowConfirmDialog(false)
      setUndoSummary(response)
    } catch {
      // The error is already caught and set in the hook to display
    }
  }

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
              setShowConfirmDialog(true)
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
          {/* Rules Section... */}
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

      {/* Undo Confirmation Overlay */}
      {showConfirmDialog && !undoSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby="undo-confirm-title"
          >
            <div className="p-6">
              <h3 id="undo-confirm-title" className="text-xl font-bold text-slate-900">
                Undo Organization Run?
              </h3>
              <p className="mt-3 text-slate-600">
                Are you sure you want to undo this run? {run.files_affected} files will be moved
                back to <strong>{run.folder_path}</strong>. Folders created by this run will remain
                to ensure no personal data is lost.
              </p>
              {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm font-medium rounded-lg border border-red-100">
                  {error.message}
                </div>
              )}
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                onClick={() => setShowConfirmDialog(false)}
                disabled={isUndoing}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 text-sm font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors relative disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]"
                onClick={handleUndoClick}
                disabled={isUndoing}
              >
                {isUndoing ? 'Undoing...' : 'Confirm Undo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post-Undo Summary Modal */}
      {undoSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-[600px] overflow-hidden flex flex-col max-h-[90vh]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="undo-summary-title"
          >
            <div className="p-6 pb-4 border-b border-slate-100">
              <h3
                id="undo-summary-title"
                className="text-xl font-bold flex items-center gap-2 text-slate-900"
              >
                {undoSummary.success ? (
                  <>
                    <svg
                      className="w-6 h-6 text-green-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Undo Completed
                  </>
                ) : (
                  <>
                    <svg
                      className="w-6 h-6 text-amber-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    Undo Partially Completed
                  </>
                )}
              </h3>
              <p className="mt-2 text-slate-600 text-sm">
                Successfully restored <strong>{undoSummary.restoredFiles.length}</strong> file
                {undoSummary.restoredFiles.length !== 1 ? 's' : ''}.
              </p>
            </div>

            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
              {/* Skipped Files */}
              {undoSummary.skippedFiles.length > 0 && (
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
                    Skipped Files ({undoSummary.skippedFiles.length})
                  </h4>
                  <ul className="bg-amber-50 rounded-lg p-1 border border-amber-100/50">
                    {undoSummary.skippedFiles.map((err, i) => (
                      <li key={i} className="px-3 py-2 text-sm flex flex-col">
                        <span className="font-bold text-slate-800 break-all">{err.fileName}</span>
                        <span className="text-slate-600 text-xs mt-0.5">{err.reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Touched Folders left behind */}
              {undoSummary.touchedFolders.length > 0 && (
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400 inline-block"></span>
                    Folders Left Behind ({undoSummary.touchedFolders.length})
                  </h4>
                  <ul className="bg-slate-50 rounded-lg border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                    {undoSummary.touchedFolders.map((folder, i) => (
                      <li
                        key={i}
                        className="px-4 py-2.5 text-sm font-bold text-slate-700 break-all flex items-center gap-3"
                      >
                        <svg
                          className="w-4 h-4 text-slate-400 shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                          />
                        </svg>
                        {folder}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-slate-500 mt-2 px-1">
                    These folders were modified by the organization run. We kept them intact to
                    prevent accidental deletion of personal files.
                  </p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                className="px-5 py-2.5 text-sm font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
                onClick={() => {
                  setUndoSummary(null)
                  // Could optionally trigger a re-fetch of history here if we exposed a refetch method
                  // For now, React Query will refetch on focus or we can rely on polling/cache invalidation
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
