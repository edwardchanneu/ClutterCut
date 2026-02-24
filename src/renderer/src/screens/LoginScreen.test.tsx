import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import LoginScreen from './LoginScreen'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom')
    return {
        ...actual,
        useNavigate: () => mockNavigate
    }
})

describe('LoginScreen', () => {
    it('renders login screen with email field, password field, and Login button', () => {
        render(
            <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <LoginScreen />
            </MemoryRouter>
        )

        expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /continue as guest/i })).toBeInTheDocument()
    })

    it('validates empty fields client-side before submission', () => {
        render(
            <MemoryRouter>
                <LoginScreen />
            </MemoryRouter>
        )

        fireEvent.click(screen.getByRole('button', { name: /login/i }))

        expect(screen.getByText(/please fill in both email and password/i)).toBeInTheDocument()
        expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('validates email format client-side before submission', () => {
        render(
            <MemoryRouter>
                <LoginScreen />
            </MemoryRouter>
        )

        fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'invalid-email' } })
        fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } })
        fireEvent.click(screen.getByRole('button', { name: /login/i }))

        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
        expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('displays a clear inline error message for invalid credentials', () => {
        render(
            <MemoryRouter>
                <LoginScreen />
            </MemoryRouter>
        )

        fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'wrong@example.com' } })
        fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpass' } })
        fireEvent.click(screen.getByRole('button', { name: /login/i }))

        expect(screen.getByText(/incorrect email or password/i)).toBeInTheDocument()
        expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('authenticates valid credentials and navigates to the folder selection screen', () => {
        render(
            <MemoryRouter>
                <LoginScreen />
            </MemoryRouter>
        )

        fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } })
        fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password' } })
        fireEvent.click(screen.getByRole('button', { name: /login/i }))

        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
        expect(mockNavigate).toHaveBeenCalledWith('/organize')
    })

    it('navigates to organize screen when "Continue as Guest" is clicked', () => {
        render(
            <MemoryRouter>
                <LoginScreen />
            </MemoryRouter>
        )

        fireEvent.click(screen.getByRole('button', { name: /continue as guest/i }))
        expect(mockNavigate).toHaveBeenCalledWith('/organize')
    })
})
