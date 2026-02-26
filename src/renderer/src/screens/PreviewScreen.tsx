import { useLocation, useNavigate } from 'react-router-dom'
import type { ReadFolderEntry } from '../../../shared/ipcChannels'
import { RuleRow, computeFileMatch } from '../lib/ruleMatch'

interface LocationState {
  folderPath?: string
  files?: ReadFolderEntry[]
  rows?: RuleRow[]
}

export default function PreviewScreen(): React.JSX.Element {
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state as LocationState | null) ?? {}

  const folderPath = state.folderPath ?? null
  const files = state.files ?? []
  const rows = state.rows ?? []

  const fileEntries = files.filter((f) => f.isFile)
  const existingDirs = new Set(files.filter((f) => !f.isFile).map((f) => f.name))

  // Group matched files by destination folder
  const matchMap = new Map<string, ReadFolderEntry[]>()
  const unmatchedFiles: ReadFolderEntry[] = []
  const matchedFileNames = new Set<string>()

  let movedCount = 0

  fileEntries.forEach((file) => {
    const match = computeFileMatch(file.name, rows)
    if (match) {
      movedCount++
      matchedFileNames.add(file.name)
      if (!matchMap.has(match.destination)) {
        matchMap.set(match.destination, [])
      }
      matchMap.get(match.destination)!.push(file)
    } else {
      unmatchedFiles.push(file)
    }
  })

  const changedExistingDirs = Array.from(matchMap.keys())
    .filter((d) => existingDirs.has(d))
    .sort()

  const originalDirsCount = files.length - fileEntries.length
  const originalFilesCount = fileEntries.length

  const pluralize = (count: number, word: string): string => {
    return `${count} ${word}${count === 1 ? '' : 's'}`
  }

  const newDirs = Array.from(matchMap.keys())
    .filter((d) => !existingDirs.has(d))
    .sort()
  const unchangedDirs = Array.from(existingDirs)
    .filter((d) => !matchMap.has(d))
    .sort()

  const handleBackToRules = (): void => {
    navigate('/organize/rules', { state: { folderPath, files, rows } })
  }

  const handleCancel = (): void => {
    navigate('/organize')
  }

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFB]">
      <header className="flex justify-between items-center px-6 py-3 bg-white border-b border-gray-100 shadow-sm shrink-0">
        <button
          onClick={handleBackToRules}
          aria-label="Back to rule configuration"
          className="flex items-center gap-1 text-sm font-medium text-muted hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-2 py-1 transition-colors"
        >
          <span aria-hidden="true">←</span>
          Back to Rules
        </button>
        <button
          onClick={handleCancel}
          aria-label="Cancel operation"
          className="text-sm font-medium text-red-500 hover:text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded px-2 py-1 transition-colors"
        >
          Cancel
        </button>
      </header>

      <main className="flex-1 overflow-hidden p-6 flex flex-col">
        <div className="bg-white rounded-xl shadow-sm p-4 text-center shrink-0 mb-6">
          <h1 className="text-xl font-bold text-primary mb-1">Preview Changes</h1>
          <p className="text-sm text-muted">
            <strong className="text-primary text-lg">{movedCount}</strong> file
            {movedCount !== 1 ? 's' : ''} will be moved.
          </p>
        </div>

        <div className="flex-1 flex gap-6 overflow-hidden max-w-6xl mx-auto w-full">
          {/* Left Column: Original Folder */}
          <div className="flex-1 flex flex-col bg-gray-100 rounded-xl border border-gray-200 overflow-hidden relative shadow-inner">
            <div className="px-4 py-3 bg-gray-200/50 border-b border-gray-200 shrink-0 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-primary">Previous Directory</h2>
              <span className="text-xs font-medium text-muted bg-white px-2 py-0.5 rounded-full border border-gray-200 text-right">
                {`${pluralize(originalDirsCount, 'folder')}, ${pluralize(originalFilesCount, 'file')}`}
              </span>
            </div>
            <ul
              aria-label="Previous Directory Contents"
              className="flex-1 overflow-y-auto p-2 space-y-1"
            >
              {files
                .filter((f) => !f.isFile)
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((f) => (
                  <li
                    key={f.name}
                    className="px-3 py-1.5 text-sm font-mono text-muted flex items-center gap-2"
                  >
                    <span aria-hidden="true" className="shrink-0 text-gray-400">
                      📁
                    </span>
                    {f.name}
                  </li>
                ))}
              {files
                .filter((f) => f.isFile)
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((f) => {
                  const isMoved = matchedFileNames.has(f.name)
                  return (
                    <li
                      key={f.name}
                      className={`px-3 py-1.5 text-sm font-mono flex items-center gap-2 ${
                        isMoved ? 'text-green-700 bg-green-50/50' : 'text-muted'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`shrink-0 ${isMoved ? 'text-green-500' : 'text-gray-400'}`}
                      >
                        📄
                      </span>
                      {f.name}
                    </li>
                  )
                })}
            </ul>
          </div>

          {/* Middle Gutter Arrow */}
          <div className="hidden md:flex flex-col justify-center items-center pb-8">
            <div className="w-8 h-8 bg-white border border-gray-200 shadow-sm rounded-full flex items-center justify-center text-primary/50 shrink-0 select-none">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </div>
          </div>

          {/* Right Column: New Directory */}
          <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 bg-white border-b border-gray-200 shrink-0">
              <h2 className="text-sm font-semibold text-primary">New Directory</h2>
            </div>
            <div
              aria-label="New Directory Contents"
              className="flex-1 overflow-y-auto p-4 space-y-4"
            >
              {/* Changed Existing Directories */}
              {changedExistingDirs.map((dest) => {
                const matchedFilesForDest = matchMap.get(dest)!
                return (
                  <div
                    key={dest}
                    className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200"
                  >
                    <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                        <span aria-hidden="true">📁</span>
                        {dest}
                        <span className="text-xs font-normal text-muted ml-1">(Existing)</span>
                      </h3>
                      <span className="text-xs font-medium text-muted bg-white px-2 py-0.5 rounded-full border border-gray-200 text-right">
                        {`1 folder, ${pluralize(matchedFilesForDest.length, 'file')}`}
                      </span>
                    </div>
                    <ul className="divide-y divide-gray-50 max-h-48 overflow-y-auto">
                      {matchedFilesForDest.map((file) => (
                        <li
                          key={file.name}
                          className="px-4 py-1.5 text-sm font-mono text-green-700 flex items-center gap-2 bg-green-50/50"
                        >
                          <span aria-hidden="true" className="shrink-0 text-green-500">
                            📄
                          </span>
                          {file.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}

              {/* New Directories */}
              {newDirs.map((dest) => {
                const matchedFilesForDest = matchMap.get(dest)!
                return (
                  <div
                    key={dest}
                    className="bg-white rounded-lg shadow-sm overflow-hidden border border-blue-200"
                  >
                    <div className="px-3 py-2 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-blue-700 flex items-center gap-2">
                        <span aria-hidden="true">📁</span>
                        {dest}
                        <span className="text-xs font-normal text-blue-600 ml-1">(New)</span>
                      </h3>
                      <span className="text-xs font-medium text-blue-600 bg-white px-2 py-0.5 rounded-full border border-blue-200">
                        {pluralize(matchedFilesForDest.length, 'file')}
                      </span>
                    </div>
                    <ul className="divide-y divide-blue-50 max-h-48 overflow-y-auto">
                      {matchedFilesForDest.map((file) => (
                        <li
                          key={file.name}
                          className="px-4 py-1.5 text-sm font-mono text-green-700 flex items-center gap-2 bg-green-50/50"
                        >
                          <span aria-hidden="true" className="shrink-0 text-green-500">
                            📄
                          </span>
                          {file.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}

              {/* Unchanged Directories and Files */}
              {(unchangedDirs.length > 0 || unmatchedFiles.length > 0) && (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
                  <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-muted flex items-center gap-2">
                      <span aria-hidden="true">⚪</span>
                      Unchanged
                    </h3>
                    <span className="text-xs font-medium text-muted bg-white px-2 py-0.5 rounded-full border border-gray-200">
                      {`${pluralize(unchangedDirs.length, 'folder')}, ${pluralize(unmatchedFiles.length, 'file')}`}
                    </span>
                  </div>
                  <ul className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
                    {unchangedDirs.map((dir) => (
                      <li
                        key={dir}
                        className="px-4 py-1.5 text-sm font-mono text-gray-500 flex items-center gap-2"
                      >
                        <span aria-hidden="true" className="shrink-0 opacity-50">
                          📁
                        </span>
                        {dir}
                      </li>
                    ))}
                    {unmatchedFiles.map((file) => (
                      <li
                        key={file.name}
                        className="px-4 py-1.5 text-sm font-mono text-gray-500 flex items-center gap-2"
                      >
                        <span aria-hidden="true" className="shrink-0 opacity-50">
                          📄
                        </span>
                        {file.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
