import { render, screen, within, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import PreviewScreen from './PreviewScreen'
import type { ReadFolderEntry, ExecuteRulesResponse } from '../../../shared/ipcChannels'
import type { RuleRow } from '../lib/ruleMatch'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockNavigate = vi.fn()
let mockLocationState: Record<string, unknown> = {}

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: mockLocationState })
  }
})

// ---------------------------------------------------------------------------
// Test Data & Helpers
// ---------------------------------------------------------------------------

// A mock state that includes an existing destination folder
const dummyFiles: ReadFolderEntry[] = [
  { name: 'report.pdf', isFile: true },
  { name: 'invoice-2023.pdf', isFile: true },
  { name: 'photo.jpg', isFile: true },
  { name: 'notes.txt', isFile: true },
  { name: 'Documents', isFile: false }, // Will be matched and changed
  { name: 'SubFolder', isFile: false } // Won't match
]

const dummyRows: RuleRow[] = [
  {
    id: '1',
    conditionType: 'file_extension',
    conditionValue: 'pdf',
    destinationFolder: 'Documents'
  },
  {
    id: '2',
    conditionType: 'file_extension',
    conditionValue: 'jpg',
    destinationFolder: 'Images'
  } // 'Images' isn't in files, so it's a New Directory
]

function renderPreviewScreen(state: Record<string, unknown> = {}): ReturnType<typeof render> {
  mockLocationState = state
  return render(
    <MemoryRouter>
      <PreviewScreen />
    </MemoryRouter>
  )
}

// ---------------------------------------------------------------------------
// Suites
// ---------------------------------------------------------------------------

describe('PreviewScreen Layout Update', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocationState = {}
    window.api = {
      selectFolder: vi.fn(),
      readFolder: vi.fn(),
      executeRules: vi.fn()
    } as unknown as typeof window.api
  })

  describe('Rendering & Two Columns', () => {
    it('renders the header and correct total moved count', () => {
      renderPreviewScreen({ folderPath: '/test', files: dummyFiles, rows: dummyRows })

      expect(screen.getByRole('heading', { name: /Preview Changes/i })).toBeInTheDocument()
      // 3 files should be moved (2 pdfs, 1 jpg)
      expect(screen.getByText('3')).toBeInTheDocument()
      expect(screen.getByText(/will be moved\./i)).toBeInTheDocument()
    })

    it('populates Previous Directory column with all items', () => {
      renderPreviewScreen({ folderPath: '/test', files: dummyFiles, rows: dummyRows })

      const leftCol = screen.getByLabelText(/Previous Directory Contents/i)
      const leftColScope = within(leftCol)
      expect(screen.getByText('2 folders · 4 files')).toBeInTheDocument()

      // It should contain all original files and folders
      expect(leftColScope.getByText('report.pdf')).toBeInTheDocument()
      expect(leftColScope.getByText('invoice-2023.pdf')).toBeInTheDocument()
      expect(leftColScope.getByText('photo.jpg')).toBeInTheDocument()
      expect(leftColScope.getByText('notes.txt')).toBeInTheDocument()
      expect(leftColScope.getByText('Documents')).toBeInTheDocument()
      expect(leftColScope.getByText('SubFolder')).toBeInTheDocument()
    })
  })

  describe('Right Column Groupings', () => {
    it('groups right column files into correct categories', () => {
      renderPreviewScreen({ folderPath: '/test', files: dummyFiles, rows: dummyRows })

      const rightPanel = screen.getByLabelText(/New Directory Contents/i)
      const rightScope = within(rightPanel)
      expect(screen.getByText('3 folders · 4 files')).toBeInTheDocument()

      // Existing Directory Check: Documents
      expect(rightScope.getByText('Documents')).toBeInTheDocument()
      expect(rightScope.getByText('(Existing)')).toBeInTheDocument()
      expect(rightScope.getByText('1 folder · 2 files')).toBeInTheDocument()
      expect(rightScope.getByText('report.pdf')).toBeInTheDocument()
      expect(rightScope.getByText('invoice-2023.pdf')).toBeInTheDocument()

      // New Directory Check: Images
      expect(rightScope.getByText('Images')).toBeInTheDocument()
      expect(rightScope.getByText('(New)')).toBeInTheDocument()
      expect(rightScope.getAllByText('1 folder · 1 file')).toHaveLength(2)
      expect(rightScope.getByText('photo.jpg')).toBeInTheDocument()

      // Unchanged Check: SubFolder and notes.txt
      expect(rightScope.getByText('Unchanged')).toBeInTheDocument()
      expect(rightScope.getAllByText('1 folder · 1 file')).toHaveLength(2)
      expect(rightScope.getByText('SubFolder')).toBeInTheDocument()
      expect(rightScope.getByText('notes.txt')).toBeInTheDocument()
    })

    it('handles zero files to move', () => {
      const noFiles: ReadFolderEntry[] = [{ name: 'notes.txt', isFile: true }]
      renderPreviewScreen({ folderPath: '/test', files: noFiles, rows: dummyRows })

      const leftCol = screen.getByLabelText(/Previous Directory Contents/i)
      const leftColScope = within(leftCol)
      expect(screen.getAllByText('0 folders · 1 file')).toHaveLength(3)
      expect(leftColScope.getByText('notes.txt')).toBeInTheDocument()

      const rightPanel = screen.getByLabelText(/New Directory Contents/i)
      const rightScope = within(rightPanel)

      expect(screen.getByText('0')).toBeInTheDocument()
      expect(rightScope.queryByText('Documents')).not.toBeInTheDocument()
      expect(rightScope.queryByText('Images')).not.toBeInTheDocument()

      expect(rightScope.getByText('Unchanged')).toBeInTheDocument()
      expect(rightScope.getByText('0 folders · 1 file')).toBeInTheDocument()
      expect(rightScope.getByText('notes.txt')).toBeInTheDocument()
    })
  })

  describe('Navigation', () => {
    it('navigates back to rules with state when clicking Back to Rules', () => {
      renderPreviewScreen({ folderPath: '/test', files: dummyFiles, rows: dummyRows })

      const backBtn = screen.getByRole('button', { name: /Back to rule configuration/i })
      fireEvent.click(backBtn)

      expect(mockNavigate).toHaveBeenCalledWith('/organize/rules', {
        state: { folderPath: '/test', files: dummyFiles, rows: dummyRows }
      })
    })

    it('navigates to organize when clicking Cancel', () => {
      renderPreviewScreen({ folderPath: '/test', files: dummyFiles, rows: dummyRows })

      const cancelBtn = screen.getByRole('button', { name: /Cancel operation/i })
      fireEvent.click(cancelBtn)

      expect(mockNavigate).toHaveBeenCalledWith('/organize')
    })
  })

  it('calls executeRules and navigates to success screen on Approval', async () => {
    const user = userEvent.setup()

    vi.mocked(window.api.executeRules).mockResolvedValueOnce({
      success: true,
      movedCount: 1,
      failedCount: 0,
      errors: [],
      beforeSnapshot: {},
      afterSnapshot: {}
    } as unknown as ExecuteRulesResponse)

    const mockState = { folderPath: '/test/folder', files: dummyFiles, rows: dummyRows }
    mockLocationState = mockState

    render(
      <MemoryRouter initialEntries={[{ pathname: '/preview', state: mockState }]}>
        <Routes>
          <Route path="/preview" element={<PreviewScreen />} />
          <Route path="/organize/success" element={<div data-testid="success-screen" />} />
        </Routes>
      </MemoryRouter>
    )

    const executeBtn = screen.getByRole('button', { name: /Approve and organize files/i })
    await waitFor(() => expect(executeBtn).not.toBeDisabled())

    await user.click(executeBtn)

    expect(window.api.executeRules).toHaveBeenCalledWith({
      folderPath: '/test/folder',
      rules: dummyRows.map((r) => {
        const { id, ...rest } = r
        void id
        return rest
      })
    })

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/organize/success', expect.anything())
    })
  })

  it('navigates to failure screen when execution has errors', async () => {
    const user = userEvent.setup()

    vi.mocked(window.api.executeRules).mockResolvedValueOnce({
      success: false,
      movedCount: 0,
      failedCount: 1,
      errors: [{ fileName: 'report.pdf', reason: 'Error' }],
      beforeSnapshot: {},
      afterSnapshot: {}
    } as unknown as ExecuteRulesResponse)

    const mockState = { folderPath: '/test/folder', files: dummyFiles, rows: dummyRows }
    mockLocationState = mockState

    render(
      <MemoryRouter initialEntries={[{ pathname: '/preview', state: mockState }]}>
        <Routes>
          <Route path="/preview" element={<PreviewScreen />} />
          <Route path="/organize/failure" element={<div data-testid="failure-screen" />} />
        </Routes>
      </MemoryRouter>
    )

    const executeBtn = screen.getByRole('button', { name: /Approve and organize files/i })
    await waitFor(() => expect(executeBtn).not.toBeDisabled())
    await user.click(executeBtn)

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/organize/failure', expect.anything())
    })
  })
})
