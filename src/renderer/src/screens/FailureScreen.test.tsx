import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import userEvent from '@testing-library/user-event'
import FailureScreen from './FailureScreen'

describe('FailureScreen', () => {
  it('renders failure summary and error details', () => {
    const mockState = {
      response: {
        success: false,
        movedCount: 5,
        failedCount: 2,
        errors: [
          { fileName: 'file1.pdf', reason: 'Permission denied' },
          { fileName: 'file2.jpg', reason: 'EBUSY' }
        ],
        beforeSnapshot: {},
        afterSnapshot: {}
      }
    }

    render(
      <MemoryRouter initialEntries={[{ pathname: '/organize/failure', state: mockState }]}>
        <Routes>
          <Route path="/organize/failure" element={<FailureScreen />} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Partial Success')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument() // Moved count
    expect(screen.getByText('2')).toBeInTheDocument() // Failed count

    expect(screen.getByText('file1.pdf')).toBeInTheDocument()
    expect(screen.getByText('Permission denied')).toBeInTheDocument()
    expect(screen.getByText('file2.jpg')).toBeInTheDocument()
    expect(screen.getByText('EBUSY')).toBeInTheDocument()

    expect(screen.getByRole('button', { name: /Acknowledge & Return/i })).toBeInTheDocument()
  })

  it('navigates back to organize screen when button is clicked', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={[{ pathname: '/organize/failure' }]}>
        <Routes>
          <Route path="/organize/failure" element={<FailureScreen />} />
          <Route path="/organize" element={<div>Organize Home</div>} />
        </Routes>
      </MemoryRouter>
    )

    const btn = screen.getByRole('button', { name: /Acknowledge & Return/i })
    await user.click(btn)

    expect(screen.getByText('Organize Home')).toBeInTheDocument()
  })
})
