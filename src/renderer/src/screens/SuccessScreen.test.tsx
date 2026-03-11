import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import userEvent from '@testing-library/user-event'
import SuccessScreen from './SuccessScreen'

describe('SuccessScreen', () => {
  it('renders success message and stats correctly', () => {
    const mockState = {
      response: {
        success: true,
        movedCount: 42,
        failedCount: 0,
        errors: [],
        beforeSnapshot: {},
        afterSnapshot: {}
      }
    }

    render(
      <MemoryRouter initialEntries={[{ pathname: '/organize/success', state: mockState }]}>
        <Routes>
          <Route path="/organize/success" element={<SuccessScreen />} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Success!')).toBeInTheDocument()
    expect(screen.getByText(/Successfully organized/)).toBeInTheDocument()
    // 42 files moved
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Organize More Files/i })).toBeInTheDocument()
  })

  it('navigates back to organize screen when button is clicked', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={[{ pathname: '/organize/success' }]}>
        <Routes>
          <Route path="/organize/success" element={<SuccessScreen />} />
          <Route path="/organize" element={<div>Organize Home</div>} />
        </Routes>
      </MemoryRouter>
    )

    const btn = screen.getByRole('button', { name: /Organize More Files/i })
    await user.click(btn)

    // Verify it navigated to organize home
    expect(screen.getByText('Organize Home')).toBeInTheDocument()
  })
})
