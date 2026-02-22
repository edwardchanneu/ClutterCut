import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login(): React.JSX.Element {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    const navigate = useNavigate()

    const validate = (): boolean => {
        if (!email || !password) {
            setError('Email and password cannot be empty')
            return false
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            setError('Please enter a valid email address')
            return false
        }
        setError(null)
        return true
    }

    const handleLogin = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault()
        if (!validate()) return

        setLoading(true)
        const { error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        setLoading(false)

        if (authError) {
            setError(authError.message || 'Incorrect email or password')
        } else {
            navigate('/organize')
        }
    }

    const handleGuest = (): void => {
        navigate('/organize')
    }

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h1 style={styles.title}>Welcome back</h1>
                {error && <div style={styles.error} role="alert">{error}</div>}
                <form onSubmit={handleLogin} style={styles.form} noValidate>
                    <div style={styles.inputGroup}>
                        <label htmlFor="email" style={styles.label}>Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={styles.input}
                            placeholder="you@example.com"
                        />
                    </div>
                    <div style={styles.inputGroup}>
                        <label htmlFor="password" style={styles.label}>Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={styles.input}
                            placeholder="••••••••"
                        />
                    </div>
                    <button type="submit" disabled={loading} style={styles.button}>
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
                <div style={styles.divider}>
                    <span style={styles.dividerText}>OR</span>
                </div>
                <button onClick={handleGuest} style={styles.guestButton}>
                    Continue as Guest
                </button>
            </div>
        </div>
    )
}

const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#1a1a1a',
        fontFamily: 'system-ui, -apple-system, sans-serif'
    },
    card: {
        width: '100%',
        maxWidth: '400px',
        padding: '40px',
        backgroundColor: '#2a2a2a',
        borderRadius: '12px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '20px'
    },
    title: {
        margin: 0,
        fontSize: '24px',
        fontWeight: '600',
        color: '#ffffff',
        textAlign: 'center' as const
    },
    error: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        color: '#ef4444',
        padding: '12px',
        borderRadius: '6px',
        fontSize: '14px',
        textAlign: 'center' as const
    },
    form: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '16px'
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '6px'
    },
    label: {
        fontSize: '14px',
        color: '#a3a3a3',
        fontWeight: '500'
    },
    input: {
        padding: '12px',
        borderRadius: '6px',
        border: '1px solid #404040',
        backgroundColor: '#1a1a1a',
        color: '#ffffff',
        fontSize: '16px',
        outline: 'none',
        transition: 'border-color 0.2s'
    },
    button: {
        padding: '12px',
        borderRadius: '6px',
        backgroundColor: '#3b82f6',
        color: '#ffffff',
        fontSize: '16px',
        fontWeight: '600',
        border: 'none',
        cursor: 'pointer',
        marginTop: '8px',
        transition: 'background-color 0.2s'
    },
    divider: {
        position: 'relative' as const,
        textAlign: 'center' as const,
        margin: '10px 0'
    },
    dividerText: {
        backgroundColor: '#2a2a2a',
        padding: '0 10px',
        color: '#737373',
        fontSize: '14px',
        position: 'relative' as const,
        zIndex: 1
    },
    guestButton: {
        padding: '12px',
        borderRadius: '6px',
        backgroundColor: 'transparent',
        color: '#a3a3a3',
        fontSize: '16px',
        fontWeight: '500',
        border: '1px solid #404040',
        cursor: 'pointer',
        transition: 'background-color 0.2s, color 0.2s'
    }
}
