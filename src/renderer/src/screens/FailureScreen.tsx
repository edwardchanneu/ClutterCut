import { useNavigate, useLocation } from 'react-router-dom'
import type { ExecuteRulesResponse } from '../../../shared/ipcChannels'

interface LocationState {
  response?: ExecuteRulesResponse
}

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
                Failed Moves
              </h2>
              <ul className="space-y-3">
                {response.errors.map((err, idx) => (
                  <li
                    key={idx}
                    className="bg-white p-4 rounded-lg border border-red-100 shadow-sm flex flex-col gap-1"
                  >
                    <span className="font-mono text-sm text-gray-800">{err.fileName}</span>
                    <div className="text-xs text-red-500">{formatErrorMessage(err.reason)}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {response?.successes && response.successes.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Successful Moves
              </h2>
              <ul className="space-y-3">
                {response.successes.map((success, idx) => (
                  <li
                    key={`success-${idx}`}
                    className="bg-white p-4 rounded-lg border border-green-100 shadow-sm flex flex-col gap-1.5"
                  >
                    <span className="font-mono text-sm text-gray-800">{success.fileName}</span>
                    <div className="bg-green-50 p-2.5 rounded border border-green-100 font-mono text-[11px] text-green-800 break-all">
                      <span className="font-semibold text-green-900">Destination:</span> {success.destination}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-gray-100 bg-white shrink-0">
          <button
            onClick={() => navigate('/organize')}
            className="w-full px-5 py-3 rounded-xl bg-[#0A0A0A] text-white text-sm font-semibold hover:opacity-90 focus:outline-none transition-opacity"
          >
            Acknowledge & Return
          </button>
        </div>
      </div>
    </div>
  )
}
