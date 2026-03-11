import { useNavigate, useLocation } from 'react-router-dom'
import type { ExecuteRulesResponse, ReadFolderEntry } from '../../../shared/ipcChannels'
import { useAuth } from '../hooks/useAuth'

interface LocationState {
  response?: ExecuteRulesResponse
  folderPath?: string
  originalFiles?: ReadFolderEntry[]
}

export default function SuccessScreen(): React.JSX.Element {
  const navigate = useNavigate()
  const location = useLocation()
  const { session } = useAuth()
  const state = (location.state as LocationState | null) ?? {}
  const response = state.response

  // Extract successful moves from the afterSnapshot
  const successfulMoves: Record<string, string[]> = {}
  if (response?.afterSnapshot) {
    const roots = Object.values(response.afterSnapshot)
    if (roots.length > 0) {
      const topLevelItems = roots[0]
      for (const item of topLevelItems) {
        if (typeof item === 'object' && item !== null) {
          const folderName = Object.keys(item)[0]
          const filesInFolder = item[folderName]
          if (Array.isArray(filesInFolder) && filesInFolder.length > 0) {
            successfulMoves[folderName] = filesInFolder
          }
        }
      }
    }
  }

  const updatedFiles = (() => {
    if (!state.originalFiles || !response?.afterSnapshot) return undefined
    const nextFiles: ReadFolderEntry[] = []
    const snapshotItems = response.afterSnapshot[state.folderPath || ''] || []

    for (const item of snapshotItems) {
      if (typeof item === 'string') {
        const orig = state.originalFiles.find((f) => f.name === item)
        if (orig) {
          nextFiles.push(orig)
        } else {
          nextFiles.push({ name: item, isFile: true })
        }
      } else if (typeof item === 'object' && item !== null) {
        const folderName = Object.keys(item)[0]
        nextFiles.push({ name: folderName, isFile: false })
      }
    }
    return nextFiles
  })()

  const hasSuccessfulMoves = Object.keys(successfulMoves).length > 0

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFB] p-6">
      <div className="max-w-3xl mx-auto w-full flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header Section */}
        <div className="p-8 border-b border-gray-100 text-center shrink-0 bg-green-50/30">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-green-100 text-green-600">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2 text-green-700">Success!</h1>
          <p className="text-sm text-green-600/80">
            Successfully organized{' '}
            <strong className="text-green-700">{response?.movedCount ?? 0}</strong> files.
          </p>
        </div>

        {/* Scrollable Content Section */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 space-y-8 custom-scrollbar">
          {hasSuccessfulMoves && (
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Organized Files
              </h2>
              <div className="space-y-4">
                {Object.entries(successfulMoves).map(([folderName, files]) => (
                  <div
                    key={folderName}
                    className="bg-white rounded-lg border border-green-100 shadow-sm overflow-hidden"
                  >
                    <div className="bg-green-50/50 px-4 py-2 border-b border-green-100 flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-green-600"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
                      </svg>
                      <span className="font-semibold text-sm text-green-800">{folderName}</span>
                    </div>
                    <ul className="divide-y divide-gray-50">
                      {files.map((fileName, idx) => (
                        <li key={idx} className="px-4 py-2 text-sm text-gray-600 font-mono">
                          {fileName}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 bg-white shrink-0 flex gap-3">
          {session && (
            <button
              onClick={() => navigate('/history')}
              className="flex-1 px-5 py-3 rounded-xl bg-white text-primary border border-gray-200 text-sm font-semibold hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary transition-colors"
            >
              View History
            </button>
          )}
          <button
            onClick={() =>
              navigate('/organize', {
                state: { folderPath: state.folderPath, files: updatedFiles }
              })
            }
            className="flex-1 px-5 py-3 rounded-xl bg-[#0A0A0A] text-white text-sm font-semibold hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary transition-opacity"
          >
            Organize More Files
          </button>
        </div>
      </div>
    </div>
  )
}
