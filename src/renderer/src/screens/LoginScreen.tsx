import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useGuest } from '../context/GuestContext'

export default function LoginScreen(): React.JSX.Element {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { setIsGuest } = useGuest()

  const handleLogin = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Please fill in both email and password.')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.')
      return
    }

    try {
      const { data, error: sbError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (sbError) {
        setError(sbError.message)
        return
      }

      if (data.session) {
        localStorage.setItem('supabase-session', JSON.stringify(data.session))
        setIsGuest(false)
        navigate('/organize')
      }
    } catch {
      setError('A network error occurred. Please try again later.')
    }
  }

  const handleGuest = (): void => {
    setIsGuest(true)
    navigate('/organize')
  }

  return (
    <div className="flex h-screen items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-sm w-full max-w-sm">
        <h1 className="text-2xl font-semibold mb-6 text-center text-primary">
          Login to ClutterCut
        </h1>

        <form onSubmit={handleLogin} className="space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-primary mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-[#F8FAFB] border border-transparent rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-primary mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-[#F8FAFB] border border-transparent rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm mt-2" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-primary text-white font-medium py-2 rounded-[8px] hover:bg-black/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors mt-6"
          >
            Login
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={handleGuest}
            className="text-muted text-sm hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-2"
          >
            Continue as Guest
          </button>
        </div>

        <div className="mt-2 text-center">
          <button
            type="button"
            onClick={() => navigate('/signup')}
            className="text-muted text-sm hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-2"
          >
            Don&apos;t have an account? <span className="font-medium text-primary">Sign up</span>
          </button>
        </div>
      </div>
    </div>
  )
}
