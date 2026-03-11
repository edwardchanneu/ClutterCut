import { useNavigate, useLocation } from 'react-router-dom'
import type { ExecuteRulesResponse } from '../../../shared/ipcChannels'
<<<<<<< feat/30-implement-partial-failure-summary-screen
import { formatErrorMessage } from '../utils/formatErrorMessage'
import { useAuth } from '../hooks/useAuth'
=======
>>>>>>> develop

interface LocationState {
  response?: ExecuteRulesResponse
}

<<<<<<< feat/30-implement-partial-failure-summary-screen
export default function FailureScreen(): React.JSX.Element {
  const navigate = useNavigate()
  const location = useLocation()
  const { session } = useAuth()
  const state = (location.state as LocationState | null) ?? {}
  const response = state.response

  const isPartialFailure = (response?.movedCount ?? 0) > 0 && (response?.failedCount ?? 0) > 0

  // Extract successfully moved files from the afterSnapshot (same logic as SuccessScreen)
  const successfulMoves: Record<string, string[]> = {}
  if (response?.afterSnapshot) {
    const roots = Object.values(response.afterSnapshot)
    if (roots.length > 0) {
      const topLevelItems = roots[0]
      for (const item of topLevelItems) {
        if (typeof item === 'object' && item !== null) {
          const folderName = Object.keys(item)[0]
          const filesInFolder = (item as Record<string, unknown>)[folderName]
          if (Array.isArray(filesInFolder) && filesInFolder.length > 0) {
            successfulMoves[folderName] = filesInFolder as string[]
          }
        }
      }
    }
  }

  const hasSuccessfulMoves = Object.keys(successfulMoves).length > 0

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFB] p-6">
      <div className="max-w-3xl mx-auto w-full flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div
          className={`p-6 border-b border-gray-100 text-center shrink-0 ${
            isPartialFailure ? 'bg-orange-50/30' : 'bg-red-50/30'
          }`}
        >
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
              isPartialFailure ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'
            }`}
          >
            {isPartialFailure ? (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
              </svg>
            ) : (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="m15 9-6 6" />
                <path d="m9 9 6 6" />
              </svg>
            )}
          </div>
          <h1
            className={`text-xl font-bold mb-1 ${
              isPartialFailure ? 'text-orange-700' : 'text-red-700'
            }`}
          >
            {isPartialFailure ? 'Partial Success' : 'Organization Failed'}
          </h1>
          <p className={`text-sm ${isPartialFailure ? 'text-orange-600/80' : 'text-red-600/80'}`}>
            {isPartialFailure ? (
              <>
                <strong className="text-orange-700">{response?.movedCount ?? 0}</strong> files moved
                successfully, <strong className="text-red-600">{response?.failedCount ?? 0}</strong>{' '}
                failed.
              </>
            ) : (
              <>
                <strong className="text-red-700">{response?.failedCount ?? 0}</strong> files failed
                to move. No files were organized.
              </>
            )}
          </p>
        </div>
        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 space-y-6">
          {/* "Not rolled back" notice — only for partial failures */}
          {isPartialFailure && (
            <div
              role="note"
              className="flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800"
            >
              <svg
                className="mt-0.5 shrink-0 w-4 h-4 text-orange-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
              </svg>
              <p>
                <strong>Successfully moved files have not been rolled back.</strong> Your folder
                reflects the current state. You can undo this partial run from History if needed.
              </p>
            </div>
          )}

          {/* Successfully moved files */}
          {isPartialFailure && hasSuccessfulMoves && (
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" aria-hidden="true" />
                Successfully Moved
              </h2>
              <div className="space-y-3">
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
                        aria-hidden="true"
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

          {/* Failed moves */}
          {response?.errors && response.errors.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" aria-hidden="true" />
=======
function formatErrorMessage(rawError: string): React.ReactNode {
  let friendlyMessage = rawError

  if (rawError.includes('EACCES: permission denied') || rawError.includes('EPERM')) {
    friendlyMessage = 'Permission denied. The file or destination folder might be read-only.'
  } else if (rawError.includes('ENOENT: no such file or directory')) {
    friendlyMessage = 'File or destination folder could not be found.'
  } else if (rawError.includes('ENOSPC: no space left on device')) {
    friendlyMessage = 'Not enough disk space to move this file.'
  } else if (rawError.includes('EBUSY: resource busy or locked')) {
    friendlyMessage = 'The file is currently being used by another program.'
  }

  // Extract paths from raw node rename error: "rename '/path/to/src' -> '/path/to/dest'"
  const renameMatch = rawError.match(/rename '(.*?)' -> '(.*?)'/)

  // Extract path from single path operations: "mkdir '/path/to/dest'", "scandir '/path'", etc.
  const singlePathMatch = rawError.match(/(?:mkdir|scandir|stat|access|open|read) '(.*?)'/)

  if (renameMatch) {
    const src = renameMatch[1]
    const dest = renameMatch[2]
    return (
      <div className="flex flex-col gap-1.5 mt-1">
        <span>{friendlyMessage}</span>
        <div className="bg-red-50 p-2.5 rounded border border-red-100 mt-1 font-mono text-[11px] text-red-800 break-all space-y-1">
          <div>
            <span className="font-semibold text-red-900">Original:</span> {src}
          </div>
          <div>
            <span className="font-semibold text-red-900">Destination:</span> {dest}
          </div>
        </div>
      </div>
    )
  }

  if (singlePathMatch) {
    const targetPath = singlePathMatch[1]
    return (
      <div className="flex flex-col gap-1.5 mt-1">
        <span>{friendlyMessage}</span>
        <div className="bg-red-50 p-2.5 rounded border border-red-100 mt-1 font-mono text-[11px] text-red-800 break-all space-y-1">
          <div>
            <span className="font-semibold text-red-900">Target Path:</span> {targetPath}
          </div>
        </div>
      </div>
    )
  }

  return <span>{friendlyMessage}</span>
}

export default function FailureScreen(): React.JSX.Element {
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state as LocationState | null) ?? {}
  const response = state.response

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFB] p-6">
      <div className="max-w-3xl mx-auto w-full flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-red-50/30 text-center shrink-0">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-red-700 mb-1">Partial Success</h1>
          <p className="text-sm text-red-600/80">
            Moved <strong className="text-red-700">{response?.movedCount ?? 0}</strong> files, but{' '}
            <strong className="text-red-700">{response?.failedCount ?? 0}</strong> failed.
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 space-y-6">
          {response?.errors && response.errors.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" />
>>>>>>> develop
                Failed Moves
              </h2>
              <ul className="space-y-3">
                {response.errors.map((err, idx) => (
                  <li
                    key={idx}
<<<<<<< feat/30-implement-partial-failure-summary-screen
                    className="bg-white rounded-lg border border-red-100 shadow-sm overflow-hidden"
                  >
                    <div className="bg-red-50/50 px-4 py-2 border-b border-red-100 flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-red-500 shrink-0"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      <span className="font-semibold text-sm text-red-800 font-mono break-all">
                        {err.fileName}
                      </span>
                    </div>
                    <div className="px-4 py-3 text-xs text-red-500">
                      {formatErrorMessage(err.reason)}
                    </div>
=======
                    className="bg-white p-4 rounded-lg border border-red-100 shadow-sm flex flex-col gap-1"
                  >
                    <span className="font-mono text-sm text-gray-800">{err.fileName}</span>
                    <div className="text-xs text-red-500">{formatErrorMessage(err.reason)}</div>
>>>>>>> develop
                  </li>
                ))}
              </ul>
            </div>
          )}
<<<<<<< feat/30-implement-partial-failure-summary-screen
        </div>

        {/* Footer CTAs */}
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
            onClick={() => navigate('/organize')}
            className="flex-1 px-5 py-3 rounded-xl bg-[#0A0A0A] text-white text-sm font-semibold hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary transition-opacity"
          >
            Start New Run
=======

        </div>
        <div className="p-4 border-t border-gray-100 bg-white shrink-0">
          <button
            onClick={() => navigate('/organize')}
            className="w-full px-5 py-3 rounded-xl bg-[#0A0A0A] text-white text-sm font-semibold hover:opacity-90 focus:outline-none transition-opacity"
          >
            Acknowledge & Return
>>>>>>> develop
          </button>
        </div>
      </div>
    </div>
  )
}
