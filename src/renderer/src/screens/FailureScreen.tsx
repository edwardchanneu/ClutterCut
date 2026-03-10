import { useNavigate, useLocation } from 'react-router-dom'
import type { ExecuteRulesResponse } from '../../../shared/ipcChannels'
import { formatErrorMessage } from '../utils/formatErrorMessage'

interface LocationState {
  response?: ExecuteRulesResponse
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
          <h1 className="text-xl font-bold text-red-700 mb-1">Organization Failed</h1>
          <p className="text-sm text-red-600/80">
            <strong className="text-red-700">{response?.failedCount ?? 0}</strong> files failed to
            move. No files were organized.
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
