import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Login from './Login'

// Mock the navigate function
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom')
    return {
        ...actual,
        useNavigate: () => mockNavigate
    }
})

// Mock Supabase
const mockSignInWithPassword = vi.fn()
vi.mock('../lib/supabase', () => ({
    supabase: {
        auth: {
            signInWithPassword: (...args: any[]) => mockSignInWithPassword(...args)
        }
    }
}))

describe('Login Component', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders login form correctly', () => {
        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        )

        expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /continue as guest/i })).toBeInTheDocument()
    })

    it('shows error when fields are empty', async () => {
        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        )

        fireEvent.click(screen.getByRole('button', { name: 'Login' }))

        expect(screen.getByText(/email and password cannot be empty/i)).toBeInTheDocument()
        expect(mockSignInWithPassword).not.toHaveBeenCalled()
    })

    it('shows error for invalid email format', async () => {
        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        )

        fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'invalid-email' } })
        fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } })
        fireEvent.click(screen.getByRole('button', { name: 'Login' }))

        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
        expect(mockSignInWithPassword).not.toHaveBeenCalled()
    })

    it('handles successful login and navigation', async () => {
        mockSignInWithPassword.mockResolvedValueOnce({ data: { user: {} }, error: null })

        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        )

        fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } })
        fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } })
        fireEvent.click(screen.getByRole('button', { name: 'Login' }))

        // Loading state check
        expect(screen.getByRole('button', { name: /logging in\.\.\./i })).toBeInTheDocument()

        await waitFor(() => {
            expect(mockSignInWithPassword).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'password123'
            })
            expect(mockNavigate).toHaveBeenCalledWith('/organize')
        })
    })

    it('handles login error from Supabase', async () => {
        mockSignInWithPassword.mockResolvedValueOnce({ data: null, error: { message: 'Invalid login credentials' } })

        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        )

        fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } })
        fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpassword' } })
        fireEvent.click(screen.getByRole('button', { name: 'Login' }))

        await waitFor(() => {
            expect(screen.getByText(/invalid login credentials/i)).toBeInTheDocument()
            expect(mockNavigate).not.toHaveBeenCalled()
        })
    })

    it('navigates to organize when "Continue as Guest" is clicked', () => {
        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        )

        fireEvent.click(screen.getByRole('button', { name: /continue as guest/i }))

        expect(mockNavigate).toHaveBeenCalledWith('/organize')
        expect(mockSignInWithPassword).not.toHaveBeenCalled()
    })
})
