import { render, screen, fireEvent, within, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import OrganizeScreen from './OrganizeScreen'
import { signOut } from '../lib/auth'
import { useFolderSelection } from '../hooks/useFolderSelection'
import type { ReadFolderEntry } from '../../../shared/ipcChannels'

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

vi.mock('../lib/auth', () => ({
  signOut: vi.fn()
}))

vi.mock('../hooks/useFolderSelection', () => ({
  useFolderSelection: vi.fn()
}))

// ---------------------------------------------------------------------------
// Test Data & Helpers
// ---------------------------------------------------------------------------

const mockUseFolderSelection = useFolderSelection as unknown as ReturnType<typeof vi.fn>
const mockSignOut = signOut as unknown as ReturnType<typeof vi.fn>

const defaultHookState = {
  folderPath: null,
  files: [],
  isLoading: false,
  error: null,
  selectFolder: vi.fn()
}

const dummyFiles: ReadFolderEntry[] = [
  { name: 'report.pdf', isFile: true },
  { name: 'SubFolder', isFile: false }
]

function renderOrganizeScreen(): ReturnType<typeof render> {
  return render(
    <MemoryRouter>
      <OrganizeScreen />
    </MemoryRouter>
  )
}

// ---------------------------------------------------------------------------
// Suites
// ---------------------------------------------------------------------------

describe('OrganizeScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseFolderSelection.mockReturnValue({ ...defaultHookState })
    mockSignOut.mockResolvedValue(null) // Success by default
  })

  describe('Rendering & Initial State', () => {
    it('renders the header and "Select Folder to Organize" title', () => {
      renderOrganizeScreen()

      expect(screen.getByText('ClutterCut')).toBeInTheDocument()
      expect(
        screen.getByRole('heading', { name: /Select Folder to Organize/i })
      ).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Sign Out/i })).toBeInTheDocument()
    })

    it('displays initial empty state (no folder selected, browse button)', () => {
      renderOrganizeScreen()

      expect(screen.getByRole('button', { name: /Browse for a folder/i })).toBeInTheDocument()
      expect(screen.getByText('No folder selected')).toBeInTheDocument()
    })

    it('Start Organizing button is disabled', () => {
      renderOrganizeScreen()

      const startBtn = screen.getByRole('button', { name: /Start Organizing/i })
      expect(startBtn).toBeDisabled()
    })
  })

  describe('Folder Selection State', () => {
    it('displays loading state ("Opening…") when isLoading is true', () => {
      mockUseFolderSelection.mockReturnValue({
        ...defaultHookState,
        isLoading: true
      })
      renderOrganizeScreen()

      const browseBtn = screen.getByRole('button', { name: /Browse for a folder/i })
      expect(browseBtn).toBeDisabled()
      expect(browseBtn).toHaveTextContent('Opening…')
    })

    it('displays selected folder path', () => {
      mockUseFolderSelection.mockReturnValue({
        ...defaultHookState,
        folderPath: '/Users/test/Documents'
      })
      renderOrganizeScreen()

      expect(screen.getByText('/Users/test/Documents')).toBeInTheDocument()
      expect(screen.queryByText('No folder selected')).not.toBeInTheDocument()
    })

    it('displays error message if folder selection fails', () => {
      mockUseFolderSelection.mockReturnValue({
        ...defaultHookState,
        folderPath: '/Users/test/Documents',
        error: 'Permission denied'
      })
      renderOrganizeScreen()

      expect(screen.getByRole('alert')).toHaveTextContent('Permission denied')
      expect(screen.queryByText('item(s) found')).not.toBeInTheDocument()
    })

    it('displays files list when folder is selected and not empty', () => {
      mockUseFolderSelection.mockReturnValue({
        ...defaultHookState,
        folderPath: '/Users/test/Documents',
        files: dummyFiles
      })
      renderOrganizeScreen()

      expect(screen.getByText('2 item(s) found')).toBeInTheDocument()

      const list = screen.getByRole('list', { name: /Contents of selected folder/i })
      const listItems = within(list).getAllByRole('listitem')
      expect(listItems).toHaveLength(2)

      expect(listItems[0]).toHaveTextContent('report.pdf')
      expect(listItems[0]).toHaveTextContent('📄')

      expect(listItems[1]).toHaveTextContent('SubFolder')
      expect(listItems[1]).toHaveTextContent('📁')
    })

    it('displays empty folder message when folder is selected but contains no files', () => {
      mockUseFolderSelection.mockReturnValue({
        ...defaultHookState,
        folderPath: '/Users/test/Documents',
        files: []
      })
      renderOrganizeScreen()

      expect(
        screen.getByText(/This folder is empty\. Please choose a different folder\./i)
      ).toBeInTheDocument()
    })

    it('Start Organizing button is enabled when files are present', () => {
      mockUseFolderSelection.mockReturnValue({
        ...defaultHookState,
        folderPath: '/Users/test/Documents',
        files: dummyFiles
      })
      renderOrganizeScreen()

      const startBtn = screen.getByRole('button', { name: /Start Organizing/i })
      expect(startBtn).not.toBeDisabled()
    })
  })

  describe('User Actions', () => {
    it('calls selectFolder from hook on Browse click', () => {
      const selectFolderMock = vi.fn()
      mockUseFolderSelection.mockReturnValue({
        ...defaultHookState,
        selectFolder: selectFolderMock
      })
      renderOrganizeScreen()

      fireEvent.click(screen.getByRole('button', { name: /Browse for a folder/i }))
      expect(selectFolderMock).toHaveBeenCalled()
    })

    it('navigates to /organize/rules with state on Start Organizing click', () => {
      mockUseFolderSelection.mockReturnValue({
        ...defaultHookState,
        folderPath: '/Users/test/Documents',
        files: dummyFiles
      })
      renderOrganizeScreen()

      fireEvent.click(screen.getByRole('button', { name: /Start Organizing/i }))
      expect(mockNavigate).toHaveBeenCalledWith('/organize/rules', {
        state: {
          folderPath: '/Users/test/Documents',
          files: dummyFiles
        }
      })
    })
  })

  describe('Authentication (Sign Out)', () => {
    it('calls signOut on Sign Out click & navigates to /login on success', async () => {
      renderOrganizeScreen()

      const signOutBtn = screen.getByRole('button', { name: /Sign Out/i })
      fireEvent.click(signOutBtn)

      // Button goes into loading state
      expect(signOutBtn).toBeDisabled()
      expect(signOutBtn).toHaveTextContent('Signing out…')

      expect(mockSignOut).toHaveBeenCalled()

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true })
      })
    })

    it('displays error message if sign out fails', async () => {
      // Mock sign out to return an error (our API returns an Error object instead of throwing)
      mockSignOut.mockResolvedValue(new Error('Network error'))
      renderOrganizeScreen()

      fireEvent.click(screen.getByRole('button', { name: /Sign Out/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Sign out failed. Please try again.')
      })

      // Button is re-enabled
      const signOutBtn = screen.getByRole('button', { name: /Sign Out/i })
      expect(signOutBtn).not.toBeDisabled()
      expect(signOutBtn).toHaveTextContent('Sign Out')
    })
  })
})
