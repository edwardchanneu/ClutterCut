import { useNavigate, useLocation } from 'react-router-dom'
import type { ExecuteRulesResponse } from '../../../shared/ipcChannels'

interface LocationState {
  response?: ExecuteRulesResponse
}

export default function SuccessScreen(): React.JSX.Element {
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state as LocationState | null) ?? {}
  const response = state.response

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFB] items-center justify-center p-6">
      <div className="bg-white rounded-xl shadow-sm p-8 text-center max-w-md w-full border border-gray-100">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
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
        <h1 className="text-2xl font-bold text-primary mb-2">Success!</h1>
        <p className="text-muted mb-6">
          Successfully organized{' '}
          <strong className="text-primary">{response?.movedCount ?? 0}</strong> files.
        </p>
        <button
          onClick={() => navigate('/organize')}
          className="w-full px-5 py-3 rounded-xl bg-[#0A0A0A] text-white text-sm font-semibold hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary transition-opacity"
        >
          Organize More Files
        </button>
      </div>
    </div>
  )
}
