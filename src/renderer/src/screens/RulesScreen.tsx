import { useState, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import type { ConditionType, ReadFolderEntry } from '../../../shared/ipcChannels'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RuleRow {
  id: string
  conditionType: ConditionType
  conditionValue: string
  destinationFolder: string
}

interface LocationState {
  folderPath?: string
  files?: ReadFolderEntry[]
}

// OS-illegal characters for destination folder names (Windows superset covers macOS too)
const ILLEGAL_FOLDER_CHARS = /[\\/:*?"<>|]/

function getRowError(row: RuleRow): string | null {
  if (row.conditionValue.trim() === '') {
    return 'Condition value must not be empty.'
  }
  if (row.destinationFolder.trim() === '') {
    return 'Destination folder must not be empty.'
  }
  if (ILLEGAL_FOLDER_CHARS.test(row.destinationFolder)) {
    return 'Destination folder contains illegal characters.'
  }
  return null
}

function makeEmptyRow(): RuleRow {
  return {
    id: crypto.randomUUID(),
    conditionType: 'file_extension',
    conditionValue: '',
    destinationFolder: ''
  }
}

/** Returns just the extension portion (without dot), lower-cased, or '' */
function extOf(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : ''
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface FilePanelProps {
  files: ReadFolderEntry[]
  activeExtensions: string[]
}

function FilePanel({ files, activeExtensions }: FilePanelProps): React.JSX.Element {
  const fileEntries = files.filter((f) => f.isFile)
  const dirEntries = files.filter((f) => !f.isFile)

  return (
    <aside
      aria-label="Files in selected folder"
      className="flex flex-col bg-white rounded-xl shadow-sm overflow-hidden min-w-0"
    >
      <div className="px-4 py-3 border-b border-gray-100">
        <p className="text-sm font-semibold text-primary">Folder Contents</p>
        <p className="text-xs text-muted mt-0.5">{fileEntries.length} file(s)</p>
      </div>
      <ul className="flex-1 overflow-auto divide-y divide-gray-50 p-2">
        {dirEntries.map((entry) => (
          <li
            key={entry.name}
            className="flex items-center gap-2 px-2 py-1.5 rounded text-xs text-muted font-mono"
          >
            <span aria-hidden="true">📁</span>
            <span className="whitespace-nowrap">{entry.name}</span>
          </li>
        ))}
        {fileEntries.map((entry) => {
          const ext = extOf(entry.name)
          const isHighlighted = activeExtensions.includes(ext)
          return (
            <li
              key={entry.name}
              className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs font-mono transition-colors ${isHighlighted ? 'bg-amber-50 text-primary font-semibold' : 'text-muted'
                }`}
            >
              <span aria-hidden="true">📄</span>
              <span className="whitespace-nowrap" title={entry.name}>
                {entry.name}
              </span>
              {isHighlighted && (
                <span className="ml-auto shrink-0 text-[10px] font-semibold text-amber-600 bg-amber-100 rounded px-1 py-0.5 uppercase">
                  {ext}
                </span>
              )}
            </li>
          )
        })}
        {files.length === 0 && (
          <li className="px-2 py-4 text-xs text-muted text-center">No files found.</li>
        )}
      </ul>
    </aside>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function RulesScreen(): React.JSX.Element {
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state as LocationState | null) ?? {}
  const folderPath = state.folderPath ?? null
  const files = state.files ?? []

  const [rows, setRows] = useState<RuleRow[]>([makeEmptyRow()])

  // -------------------------------------------------------------------------
  // Derived state
  // -------------------------------------------------------------------------

  const allValid = rows.every((r) => getRowError(r) === null)

  // Collect all non-empty file_extension values so the file panel can highlight them
  const activeExtensions = rows
    .filter((r) => r.conditionType === 'file_extension' && r.conditionValue.trim() !== '')
    .map((r) => r.conditionValue.trim().replace(/^\./, '').toLowerCase())

  const hasAnyInput = rows.some((r) => r.conditionValue !== '' || r.destinationFolder !== '')

  // -------------------------------------------------------------------------
  // Row handlers
  // -------------------------------------------------------------------------

  const addRow = useCallback((): void => {
    setRows((prev) => [...prev, makeEmptyRow()])
  }, [])

  const deleteRow = useCallback((id: string): void => {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev))
  }, [])

  const updateRow = useCallback((id: string, patch: Partial<Omit<RuleRow, 'id'>>): void => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }, [])

  // -------------------------------------------------------------------------
  // Navigation
  // -------------------------------------------------------------------------

  const handleBack = (): void => {
    navigate('/organize')
  }

  const handlePreview = (): void => {
    if (!allValid) return
    // Navigation to /organize/preview will be wired in the next issue
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFB]">
      {/* App header */}
      <header className="flex items-center px-6 py-3 bg-white border-b border-gray-100 shadow-sm shrink-0">
        <button
          id="back-btn"
          type="button"
          onClick={handleBack}
          aria-label="Back to folder selection"
          className="flex items-center gap-1 text-sm font-medium text-muted hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-2 py-1 transition-colors"
        >
          <span aria-hidden="true">←</span>
          Back
        </button>
      </header>

      {/* Split layout */}
      <div className="flex flex-1 gap-4 p-6 overflow-hidden">
        {/* ---- Left: File reference panel ---- */}
        <div className="w-64 shrink-0 flex flex-col overflow-hidden">
          <FilePanel files={files} activeExtensions={activeExtensions} />
        </div>

        {/* ---- Right: Rules panel ---- */}
        <main className="flex flex-col flex-1 min-w-0 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col gap-4">
            <div>
              <h1 className="text-xl font-semibold text-primary mb-1">
                Configure Organization Rules
              </h1>
              {folderPath && (
                <p className="text-xs text-[#2563EB] font-mono truncate" title={folderPath}>
                  {folderPath}
                </p>
              )}
            </div>

            {/* Rule rows */}
            <ol aria-label="Organization rules" className="space-y-3">
              {rows.map((row, index) => {
                const rowError = getRowError(row)
                const ruleNumber = index + 1
                const showError =
                  rowError !== null && (row.conditionValue !== '' || row.destinationFolder !== '')

                return (
                  <li
                    key={row.id}
                    className="flex flex-col gap-3 border border-gray-200 rounded-lg p-4"
                  >
                    {/* Top row: numbered badge + condition dropdown + trash */}
                    <div className="flex items-center gap-3">
                      <span
                        aria-label={`Rule ${ruleNumber}`}
                        className="flex-none w-7 h-7 rounded-full bg-[#0A0A0A] text-white text-xs font-semibold flex items-center justify-center"
                      >
                        {ruleNumber}
                      </span>

                      <div className="flex-1">
                        <label
                          htmlFor={`condition-type-${row.id}`}
                          className="block text-xs font-medium text-muted mb-1"
                        >
                          Condition
                        </label>
                        <div className="relative">
                          <select
                            id={`condition-type-${row.id}`}
                            value={row.conditionType}
                            onChange={(e) =>
                              updateRow(row.id, { conditionType: e.target.value as ConditionType })
                            }
                            className="w-full appearance-none rounded-lg border border-gray-300 bg-white pl-3 pr-8 py-2 text-sm text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          >
                            <option value="file_extension">File Extension</option>
                          </select>
                          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                            >
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => deleteRow(row.id)}
                        disabled={rows.length === 1}
                        aria-label={`Delete rule ${ruleNumber}`}
                        className="flex-none mt-5 p-1.5 rounded text-muted hover:text-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 transition-colors disabled:opacity-30"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6M14 11v6" />
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                      </button>
                    </div>

                    {/* Bottom row: value input + destination input */}
                    <div className="flex gap-3 pl-10">
                      <div className="flex-1">
                        <label
                          htmlFor={`condition-value-${row.id}`}
                          className="block text-xs font-medium text-muted mb-1"
                        >
                          Extension <span className="font-normal">(e.g. pdf, jpg)</span>
                        </label>
                        <input
                          id={`condition-value-${row.id}`}
                          type="text"
                          value={row.conditionValue}
                          onChange={(e) => updateRow(row.id, { conditionValue: e.target.value })}
                          placeholder="pdf"
                          aria-describedby={showError ? `row-error-${row.id}` : undefined}
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-primary placeholder:text-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        />
                      </div>

                      <div className="flex-1">
                        <label
                          htmlFor={`destination-${row.id}`}
                          className="block text-xs font-medium text-muted mb-1"
                        >
                          Move to Folder
                        </label>
                        <input
                          id={`destination-${row.id}`}
                          type="text"
                          value={row.destinationFolder}
                          onChange={(e) => updateRow(row.id, { destinationFolder: e.target.value })}
                          placeholder="Documents"
                          aria-describedby={showError ? `row-error-${row.id}` : undefined}
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-primary placeholder:text-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        />
                      </div>
                    </div>

                    {/* Inline validation error */}
                    {showError && (
                      <p
                        id={`row-error-${row.id}`}
                        role="alert"
                        className="pl-10 text-xs text-red-500"
                      >
                        {rowError}
                      </p>
                    )}
                  </li>
                )
              })}
            </ol>

            {/* Add Rule button */}
            <button
              id="add-rule-btn"
              type="button"
              onClick={addRow}
              className="w-full py-2.5 rounded-lg border-2 border-dashed border-gray-300 text-sm font-medium text-muted hover:border-primary hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
            >
              + Add Rule
            </button>

            {/* Validation summary */}
            {!allValid && hasAnyInput && (
              <p role="status" className="text-xs text-muted text-center -mt-2">
                Complete all rule fields to enable Preview.
              </p>
            )}

            {/* Preview Changes CTA */}
            <button
              id="preview-btn"
              type="button"
              onClick={handlePreview}
              disabled={!allValid}
              aria-disabled={!allValid}
              className="w-full py-3 rounded-lg bg-[#0A0A0A] text-white text-sm font-semibold transition-opacity disabled:opacity-40 hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
            >
              Preview Changes
            </button>
          </div>
        </main>
      </div>
    </div>
  )
}
