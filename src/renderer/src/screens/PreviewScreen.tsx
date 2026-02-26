import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { ReadFolderEntry } from '../../../shared/ipcChannels'
import { RuleRow, computeFileMatch, ruleColour } from '../lib/ruleMatch'

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

  const [isExecuting, setIsExecuting] = useState(false)

  const fileEntries = files.filter((f) => f.isFile)
  const existingDirs = new Set(files.filter((f) => !f.isFile).map((f) => f.name))

  // Group matched files by destination folder
  const matchMap = new Map<string, ReadFolderEntry[]>()
  const unmatchedFiles: ReadFolderEntry[] = []
  const matchedDestinations = new Map<string, string>()

  let movedCount = 0

  fileEntries.forEach((file) => {
    const match = computeFileMatch(file.name, rows)
    if (match) {
      movedCount++
      matchedDestinations.set(file.name, match.destination)
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

  const newDirs = Array.from(matchMap.keys())
    .filter((d) => !existingDirs.has(d))
    .sort()

  // Give each unique destination folder a consistent colour index
  const allDestinations = [...changedExistingDirs, ...newDirs]
  const destColourIndex = new Map<string, number>()
  allDestinations.forEach((dest, i) => {
    destColourIndex.set(dest, i)
  })

  const originalDirsCount = files.length - fileEntries.length
  const originalFilesCount = fileEntries.length

  const pluralize = (count: number, word: string): string => {
    return `${count} ${word}${count === 1 ? '' : 's'}`
  }

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
      <header className="flex items-center px-6 py-3 bg-white border-b border-gray-100 shadow-sm shrink-0">
        <button
          onClick={handleBackToRules}
          aria-label="Back to rule configuration"
          className="flex items-center gap-1 text-sm font-medium text-muted hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-2 py-1 transition-colors"
        >
          <span aria-hidden="true">←</span>
          Back to Rules
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
            <div className="px-4 py-3 bg-gray-200/50 border-b border-gray-200 shrink-0">
              <h2 className="text-sm font-semibold text-primary">Previous Directory</h2>
              <p className="text-xs text-muted mt-0.5">
                {`${pluralize(originalDirsCount, 'folder')} · ${pluralize(originalFilesCount, 'file')}`}
              </p>
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
                  const destName = matchedDestinations.get(f.name)
                  const isMoved = destName !== undefined
                  const colour =
                    destName !== undefined && destColourIndex.has(destName)
                      ? ruleColour(destColourIndex.get(destName)!)
                      : null
                  return (
                    <li
                      key={f.name}
                      style={colour ? colour.pillStyle : undefined}
                      className={`px-3 py-1.5 text-sm font-mono flex items-center gap-2 ${
                        isMoved ? '' : 'text-muted'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`shrink-0 ${isMoved ? 'opacity-80' : 'text-gray-400'}`}
                        style={colour ? { color: 'inherit' } : undefined}
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
              <p className="text-xs text-muted mt-0.5">
                {`${pluralize(originalDirsCount + newDirs.length, 'folder')} · ${pluralize(originalFilesCount, 'file')}`}
              </p>
            </div>
            <div
              aria-label="New Directory Contents"
              className="flex-1 overflow-y-auto p-4 space-y-4"
            >
              {/* Changed Existing Directories */}
              {changedExistingDirs.map((dest) => {
                const matchedFilesForDest = matchMap.get(dest)!
                const colour = ruleColour(destColourIndex.get(dest)!)
                const borderColor = `hsl(${Math.round((destColourIndex.get(dest)! * 137.508) % 360)}, 55%, 78%)`
                const headerBg = `hsl(${Math.round((destColourIndex.get(dest)! * 137.508) % 360)}, 80%, 96%)`

                return (
                  <div
                    key={dest}
                    style={{ borderColor }}
                    className="bg-white rounded-lg shadow-sm overflow-hidden border"
                  >
                    <div
                      className="px-3 py-2 border-b"
                      style={{ backgroundColor: headerBg, borderColor }}
                    >
                      <h3
                        className="text-sm font-semibold flex items-center gap-2"
                        style={{ color: colour.pillStyle.color }}
                      >
                        <span aria-hidden="true">📁</span>
                        {dest}
                        <span className="text-xs font-normal ml-1 opacity-70">(Existing)</span>
                      </h3>
                      <p
                        className="text-xs mt-0.5 ml-6 opacity-80"
                        style={{ color: colour.pillStyle.color }}
                      >
                        {`1 folder · ${pluralize(matchedFilesForDest.length, 'file')}`}
                      </p>
                    </div>
                    <ul className="divide-y divide-gray-50 max-h-48 overflow-y-auto">
                      {matchedFilesForDest.map((file) => {
                        return (
                          <li
                            key={file.name}
                            className="px-4 py-1.5 text-sm font-mono text-gray-700 flex items-center gap-2"
                          >
                            <span aria-hidden="true" className="shrink-0 text-gray-400">
                              📄
                            </span>
                            {file.name}
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )
              })}

              {/* New Directories */}
              {newDirs.map((dest) => {
                const matchedFilesForDest = matchMap.get(dest)!
                const colour = ruleColour(destColourIndex.get(dest)!)
                const borderColor = `hsl(${Math.round((destColourIndex.get(dest)! * 137.508) % 360)}, 55%, 78%)`
                const headerBg = `hsl(${Math.round((destColourIndex.get(dest)! * 137.508) % 360)}, 80%, 96%)`

                return (
                  <div
                    key={dest}
                    style={{ borderColor }}
                    className="bg-white rounded-lg shadow-sm overflow-hidden border"
                  >
                    <div
                      className="px-3 py-2 border-b"
                      style={{ backgroundColor: headerBg, borderColor }}
                    >
                      <h3
                        className="text-sm font-bold flex items-center gap-2"
                        style={{ color: colour.pillStyle.color }}
                      >
                        <span aria-hidden="true">📁</span>
                        {dest}
                        <span className="text-xs font-normal ml-1 opacity-80">(New)</span>
                      </h3>
                      <p
                        className="text-xs mt-0.5 ml-6 opacity-80"
                        style={{ color: colour.pillStyle.color }}
                      >
                        {`1 folder · ${pluralize(matchedFilesForDest.length, 'file')}`}
                      </p>
                    </div>
                    <ul className="divide-y divide-gray-50 max-h-48 overflow-y-auto">
                      {matchedFilesForDest.map((file) => {
                        return (
                          <li
                            key={file.name}
                            className="px-4 py-1.5 text-sm font-mono text-gray-700 flex items-center gap-2"
                          >
                            <span aria-hidden="true" className="shrink-0 text-gray-400">
                              📄
                            </span>
                            {file.name}
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )
              })}

              {/* Unchanged Directories and Files */}
              {(unchangedDirs.length > 0 || unmatchedFiles.length > 0) && (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
                  <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-muted flex items-center gap-2">
                      <span aria-hidden="true">⚪</span>
                      Unchanged
                    </h3>
                    <p className="text-xs text-muted mt-0.5 ml-6">
                      {`${pluralize(unchangedDirs.length, 'folder')} · ${pluralize(unmatchedFiles.length, 'file')}`}
                    </p>
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
        <div className="mt-6 flex gap-6 shrink-0 max-w-6xl mx-auto w-full">
          <div className="flex-1 flex flex-col">
            <button
              type="button"
              onClick={handleCancel}
              aria-label="Cancel operation"
              className="w-full px-5 py-3 rounded-xl border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:border-gray-400 hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>

          {/* Middle Gutter Spacer */}
          <div className="hidden md:block w-8 shrink-0"></div>

          <div className="flex-1 flex flex-col">
            <button
              type="button"
              onClick={async () => {
                if (!folderPath) return
                setIsExecuting(true)
                try {
                  const req = {
                    folderPath,
                    // Map RulesRow to Rule expected by IPC (only enabled rules)
                    rules: rows.map(r => ({
                      conditionType: r.conditionType,
                      conditionValue: r.conditionValue,
                      destinationFolder: r.destinationFolder
                    }))
                  }
                  
                  // Request main process to execute the move
                  const response = await window.api.executeRules(req)
                  
                  if (response.success && response.failedCount === 0) {
                    navigate('/organize/success', { state: { response } })
                  } else {
                    navigate('/organize/failure', { state: { response } })
                  }
                } catch (err) {
                  console.error('Execution Failed:', err)
                  // Navigate to failure with a simulated error for display
                  navigate('/organize/failure', { 
                    state: { 
                      response: {
                        success: false,
                        movedCount: 0,
                        failedCount: 1,
                        errors: [{ fileName: 'System Error', reason: 'Failed to communicate with execution service.' }],
                        beforeSnapshot: {},
                        afterSnapshot: {}
                      } 
                    } 
                  })
                } finally {
                  setIsExecuting(false)
                }
              }}
              disabled={movedCount === 0 || isExecuting}
              aria-label="Approve and organize files"
              className="w-full px-5 py-3 rounded-xl bg-[#0A0A0A] text-white text-sm font-semibold transition-opacity disabled:opacity-40 hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary flex items-center justify-center gap-2"
            >
              {isExecuting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Organizing...
                </>
              ) : (
                'Approve & Organize'
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
