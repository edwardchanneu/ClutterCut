import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
<<<<<<< feat/30-implement-partial-failure-summary-screen
import { describe, it, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import FailureScreen from './FailureScreen'
import { useAuth } from '../hooks/useAuth'

vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn()
}))

const mockUseAuth = vi.mocked(useAuth)

const partialFailureState = {
  response: {
    success: false,
    movedCount: 3,
    failedCount: 2,
    errors: [
      { fileName: 'file1.pdf', reason: 'Permission denied' },
      { fileName: 'file2.jpg', reason: 'EBUSY: resource busy or locked' }
    ],
    beforeSnapshot: {},
    afterSnapshot: {
      '/root': [{ Documents: ['report.pdf', 'notes.txt', 'image.png'] }]
    }
  }
}

const totalFailureState = {
  response: {
    success: false,
    movedCount: 0,
    failedCount: 2,
    errors: [
      { fileName: 'file1.pdf', reason: 'EACCES: permission denied' },
      { fileName: 'file2.jpg', reason: 'ENOENT: no such file or directory' }
    ],
    beforeSnapshot: {},
    afterSnapshot: {}
  }
}

function renderFailureScreen(initialState?: Record<string, unknown>): ReturnType<typeof render> {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/organize/failure', state: initialState }]}>
      <Routes>
        <Route path="/organize/failure" element={<FailureScreen />} />
        <Route path="/organize" element={<div>Organize Home</div>} />
        <Route path="/history" element={<div>History Screen</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('FailureScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({ session: null, loading: false })
  })

  describe('partial failure (some files moved, some failed)', () => {
    it('renders "Partial Success" heading', () => {
      renderFailureScreen(partialFailureState)
      expect(screen.getByRole('heading', { name: 'Partial Success' })).toBeInTheDocument()
    })

    it('shows the moved and failed file counts in the subtitle', () => {
      renderFailureScreen(partialFailureState)
      // movedCount = 3, failedCount = 2
      expect(screen.getByText('3')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
    })

    it('renders the "not rolled back" notice', () => {
      renderFailureScreen(partialFailureState)
      expect(
        screen.getByText(/successfully moved files have not been rolled back/i)
      ).toBeInTheDocument()
    })

    it('renders the "Successfully Moved" section with files from afterSnapshot', () => {
      renderFailureScreen(partialFailureState)
      expect(screen.getByText('Successfully Moved')).toBeInTheDocument()
      // Folder name from afterSnapshot key
      expect(screen.getByText('Documents')).toBeInTheDocument()
      // Files inside the folder
      expect(screen.getByText('report.pdf')).toBeInTheDocument()
      expect(screen.getByText('notes.txt')).toBeInTheDocument()
      expect(screen.getByText('image.png')).toBeInTheDocument()
    })

    it('renders the "Failed Moves" section with each failed file', () => {
      renderFailureScreen(partialFailureState)
      expect(screen.getByText('Failed Moves')).toBeInTheDocument()
      expect(screen.getByText('file1.pdf')).toBeInTheDocument()
      expect(screen.getByText('file2.jpg')).toBeInTheDocument()
    })
  })

  describe('total failure (no files moved)', () => {
    it('renders "Organization Failed" heading', () => {
      renderFailureScreen(totalFailureState)
      expect(screen.getByRole('heading', { name: 'Organization Failed' })).toBeInTheDocument()
    })

    it('does NOT render the "not rolled back" notice', () => {
      renderFailureScreen(totalFailureState)
      expect(
        screen.queryByText(/successfully moved files have not been rolled back/i)
      ).not.toBeInTheDocument()
    })

    it('does NOT render the "Successfully Moved" section', () => {
      renderFailureScreen(totalFailureState)
      expect(screen.queryByText('Successfully Moved')).not.toBeInTheDocument()
    })

    it('renders the failed file list with human-readable error reasons', () => {
      renderFailureScreen(totalFailureState)
      expect(screen.getByText('file1.pdf')).toBeInTheDocument()
      // formatErrorMessage maps EACCES to a friendly message
      expect(screen.getByText(/permission denied/i)).toBeInTheDocument()
    })
  })

  describe('CTAs', () => {
    it('"Start New Run" button is always visible', () => {
      renderFailureScreen(partialFailureState)
      expect(screen.getByRole('button', { name: /Start New Run/i })).toBeInTheDocument()
    })

    it('"Start New Run" navigates to /organize', async () => {
      const user = userEvent.setup()
      renderFailureScreen(partialFailureState)
      await user.click(screen.getByRole('button', { name: /Start New Run/i }))
      expect(screen.getByText('Organize Home')).toBeInTheDocument()
    })

    it('"View History" button is visible for authenticated users', () => {
      mockUseAuth.mockReturnValue({
        session: { user: { id: '123' } } as unknown as import('@supabase/supabase-js').Session,
        loading: false
      })
      renderFailureScreen(partialFailureState)
      expect(screen.getByRole('button', { name: /View History/i })).toBeInTheDocument()
    })

    it('"View History" button navigates to /history when clicked', async () => {
      mockUseAuth.mockReturnValue({
        session: { user: { id: '123' } } as unknown as import('@supabase/supabase-js').Session,
        loading: false
      })
      const user = userEvent.setup()
      renderFailureScreen(partialFailureState)
      await user.click(screen.getByRole('button', { name: /View History/i }))
      expect(screen.getByText('History Screen')).toBeInTheDocument()
    })

    it('"View History" button is hidden for guests (no session)', () => {
      mockUseAuth.mockReturnValue({ session: null, loading: false })
      renderFailureScreen(partialFailureState)
      expect(screen.queryByRole('button', { name: /View History/i })).not.toBeInTheDocument()
    })
=======
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
>>>>>>> develop
  })
})
