import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import HistoryScreen from './HistoryScreen'
import { useGuest } from '../context/GuestContext'
import { useAuth } from '../hooks/useAuth'
import { useHistory, UnifiedRun } from '../hooks/useHistory'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

vi.mock('../context/GuestContext', () => ({
  useGuest: vi.fn()
}))

vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn()
}))

vi.mock('../hooks/useHistory', () => ({
  useHistory: vi.fn()
}))

vi.mock('../lib/auth', () => ({
  signOut: vi.fn()
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderHistoryScreen(): ReturnType<typeof render> {
  return render(
    <MemoryRouter>
      <HistoryScreen />
    </MemoryRouter>
  )
}

describe('HistoryScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useGuest).mockReturnValue({ isGuest: false } as unknown as ReturnType<
      typeof useGuest
    >)
    vi.mocked(useAuth).mockReturnValue({
      session: { user: { id: 'test-user-id' } }
    } as unknown as ReturnType<typeof useAuth>)
    vi.mocked(useHistory).mockReturnValue({ runs: [], isLoading: false, error: null })
  })

  it('renders loading state', () => {
    vi.mocked(useHistory).mockReturnValue({ runs: [], isLoading: true, error: null })
    renderHistoryScreen()

    expect(screen.getByText(/Loading history/i)).toBeInTheDocument()
  })

  it('renders error state', () => {
    vi.mocked(useHistory).mockReturnValue({
      runs: [],
      isLoading: false,
      error: new Error('Network error')
    })
    renderHistoryScreen()

    expect(screen.getByText(/Failed to load history: Network error/i)).toBeInTheDocument()
  })

  it('renders empty state', () => {
    renderHistoryScreen()

    expect(screen.getByText(/No runs found/i)).toBeInTheDocument()
  })

  it('renders run entries correctly', () => {
    const mockRuns = [
      {
        id: '1',
        user_id: 'test-user-id',
        folder_path: '/Users/test/Downloads',
        ran_at: '2026-03-11T14:30:00Z',
        files_affected: 5,
        rules: [
          { conditionType: 'file_extension', conditionValue: 'pdf', destinationFolder: 'Docs' }
        ],
        before_snapshot: { '/Users/test/Downloads': ['file.pdf'] },
        after_snapshot: { '/Users/test/Downloads': [{ Docs: ['file.pdf'] }] },
        is_undo: false,
        undone: false,
        parent_run_id: null
      },
      {
        id: '2',
        user_id: 'test-user-id',
        folder_path: '/Users/test/Desktop',
        ran_at: '2026-03-10T12:00:00Z',
        files_affected: 12,
        rules: [],
        before_snapshot: {},
        after_snapshot: {},
        is_undo: false,
        undone: true, // undone!
        parent_run_id: null,
        isPendingSync: true // pending sync!
      }
    ]
    vi.mocked(useHistory).mockReturnValue({
      runs: mockRuns as unknown as UnifiedRun[],
      isLoading: false,
      error: null
    })
    renderHistoryScreen()

    // It should render two entries
    expect(screen.getByText('/Users/test/Downloads')).toBeInTheDocument()
    expect(screen.getByText('/Users/test/Desktop')).toBeInTheDocument()

    // File counts
    expect(screen.getByText('5 files affected')).toBeInTheDocument()
    expect(screen.getByText('12 files affected')).toBeInTheDocument()

    // Undone badge and pending sync badge for run 2
    expect(screen.getByText('Undone')).toBeInTheDocument()
    expect(screen.getByText('Pending Sync')).toBeInTheDocument()
  })

  it('expands and collapses a run entry', () => {
    const mockRuns = [
      {
        id: '1',
        user_id: 'test-user-id',
        folder_path: '/Users/test/Downloads',
        ran_at: '2026-03-11T14:30:00Z',
        files_affected: 5,
        rules: [
          { conditionType: 'file_extension', conditionValue: 'pdf', destinationFolder: 'Docs' }
        ],
        before_snapshot: { '/Users/test/Downloads': ['file.pdf'] },
        after_snapshot: { '/Users/test/Downloads': [{ Docs: ['file.pdf'] }] },
        is_undo: false,
        undone: false,
        parent_run_id: null
      }
    ]
    vi.mocked(useHistory).mockReturnValue({
      runs: mockRuns as unknown as UnifiedRun[],
      isLoading: false,
      error: null
    })
    renderHistoryScreen()

    // Should not be expanded initially
    expect(screen.queryByText(/Rules Applied/i)).not.toBeInTheDocument()

    // Click to expand
    fireEvent.click(screen.getByRole('button', { name: 'Expand details' }))

    // Should be expanded: Rules and snapshots should be visible
    expect(screen.getByText(/Rules Applied/i)).toBeInTheDocument()
    expect(screen.getByText(/Before/i)).toBeInTheDocument()
    expect(screen.getAllByText(/Docs/i).length).toBeGreaterThan(0) // Dest folder in rules and JSON

    // Click again to collapse
    fireEvent.click(screen.getByRole('button', { name: 'Collapse details' }))
    expect(screen.queryByText(/Rules Applied/i)).not.toBeInTheDocument()
  })
})
