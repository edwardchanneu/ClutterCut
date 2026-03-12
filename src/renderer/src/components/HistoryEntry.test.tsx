import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { HistoryEntry } from './HistoryEntry'
import type { UnifiedRun } from '../hooks/useHistory'
import { useUndo } from '../hooks/useUndo'
import type { UndoRunResponse } from '../../../shared/ipcChannels'

vi.mock('../hooks/useUndo', () => ({
  useUndo: vi.fn(() => ({
    undoRunAction: vi.fn(),
    isUndoing: false,
    error: null
  }))
}))

describe('HistoryEntry', () => {
  const mockRun: UnifiedRun = {
    id: '1',
    user_id: 'user1',
    folder_path: '/Users/test/Downloads',
    ran_at: '2026-03-11T14:30:00Z',
    files_affected: 5,
    rules: [{ conditionType: 'file_extension', conditionValue: 'pdf', destinationFolder: 'Docs' }],
    before_snapshot: { '/Users/test/Downloads': ['file.pdf'] },
    after_snapshot: { '/Users/test/Downloads': [{ Docs: ['file.pdf'] }] },
    is_undo: false,
    undone: false,
    parent_run_id: null
  }

  it('renders correctly', () => {
    const onToggle = vi.fn()
    render(<HistoryEntry run={mockRun} isExpanded={false} onToggle={onToggle} />)

    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
    expect(screen.getByText('5 files affected')).toBeInTheDocument()
  })

  it('calls onToggle when clicked', () => {
    const onToggle = vi.fn()
    render(<HistoryEntry run={mockRun} isExpanded={false} onToggle={onToggle} />)

    // Using the expand toggle button which now has aria-label
    fireEvent.click(screen.getByRole('button', { name: 'Expand details' }))
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('shows detailed info when expanded', () => {
    const onToggle = vi.fn()
    render(<HistoryEntry run={mockRun} isExpanded={true} onToggle={onToggle} />)

    expect(screen.getByText(/Rules Applied:/i)).toBeInTheDocument()
    expect(screen.getByText(/Before:/i)).toBeInTheDocument()
    expect(screen.getByText(/After:/i)).toBeInTheDocument()
    expect(screen.getByText('pdf')).toBeInTheDocument()
  })

  it('shows badges and hides undo button when run is undone', () => {
    const alteredRun = { ...mockRun, undone: true }
    const onToggle = vi.fn()
    render(<HistoryEntry run={alteredRun} isExpanded={false} onToggle={onToggle} />)

    expect(screen.getByText('Undone')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Undo$/i })).not.toBeInTheDocument()
  })

  it('shows Pending Sync badge and disables undo button when isPendingSync', () => {
    const alteredRun = { ...mockRun, isPendingSync: true }
    const onToggle = vi.fn()
    render(<HistoryEntry run={alteredRun} isExpanded={false} onToggle={onToggle} />)

    expect(screen.getByText('Pending Sync')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Undo$/i })).toBeDisabled()
  })

  it('hides the undo button entirely when run.is_undo is true', () => {
    const undoRun = { ...mockRun, is_undo: true }
    const onToggle = vi.fn()
    render(<HistoryEntry run={undoRun} isExpanded={false} onToggle={onToggle} />)

    expect(screen.getByText('Undo Run')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Undo$/i })).not.toBeInTheDocument()
  })
})

describe('HistoryEntry Undo functionality', () => {
  const mockRun: UnifiedRun = {
    id: '1',
    user_id: 'user1',
    folder_path: '/Users/test/Downloads',
    ran_at: '2026-03-11T14:30:00Z',
    files_affected: 5,
    rules: [],
    before_snapshot: {},
    after_snapshot: {},
    is_undo: false,
    undone: false,
    parent_run_id: null
  }

  beforeEach(() => {
    vi.mocked(useUndo).mockReturnValue({
      undoRunAction: vi.fn(),
      isUndoing: false,
      error: null
    })
  })

  it('shows confirmation dialog when Undo is clicked, and hides on Cancel', () => {
    const onToggle = vi.fn()
    render(<HistoryEntry run={mockRun} isExpanded={false} onToggle={onToggle} />)

    const undoButton = screen.getByRole('button', { name: /Undo/i })
    fireEvent.click(undoButton)

    expect(screen.getByText('Undo Organization Run?')).toBeInTheDocument()

    const cancelButton = screen.getByRole('button', { name: /^Cancel$/i })
    fireEvent.click(cancelButton)

    expect(screen.queryByText('Undo Organization Run?')).not.toBeInTheDocument()
  })

  it('calls undoRunAction and displays summary on successful confirm', async () => {
    const mockUndoRunAction = vi.fn().mockResolvedValue({
      success: true,
      restoredFiles: ['test.pdf'],
      skippedFiles: [],
      touchedFolders: ['/Users/test/Downloads/Docs']
    } as UndoRunResponse)

    vi.mocked(useUndo).mockReturnValue({
      undoRunAction: mockUndoRunAction,
      isUndoing: false,
      error: null
    })

    const onToggle = vi.fn()
    render(<HistoryEntry run={mockRun} isExpanded={false} onToggle={onToggle} />)

    // Open confirm
    fireEvent.click(screen.getByRole('button', { name: /Undo/i }))
    // Confirm
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Undo' }))

    expect(mockUndoRunAction).toHaveBeenCalledWith(mockRun)

    // Await state updates
    const summaryHeading = await screen.findByText('Undo Completed')
    expect(summaryHeading).toBeInTheDocument()
    expect(screen.getByText(/Successfully restored/)).toBeInTheDocument()
    expect(screen.getByText('Folders Left Behind (1)')).toBeInTheDocument()
    expect(screen.getByText('/Users/test/Downloads/Docs')).toBeInTheDocument()
  })

  it('displays "Undo Partially Completed" when some files are skipped', async () => {
    const mockUndoRunAction = vi.fn().mockResolvedValue({
      success: false,
      restoredFiles: ['kept.pdf'],
      skippedFiles: [
        { fileName: 'missing.pdf', reason: 'File no longer exists at moved location.' }
      ],
      touchedFolders: ['Docs']
    } as UndoRunResponse)

    vi.mocked(useUndo).mockReturnValue({
      undoRunAction: mockUndoRunAction,
      isUndoing: false,
      error: null
    })

    const onToggle = vi.fn()
    render(<HistoryEntry run={mockRun} isExpanded={false} onToggle={onToggle} />)

    fireEvent.click(screen.getByRole('button', { name: /Undo/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Undo' }))

    expect(mockUndoRunAction).toHaveBeenCalledWith(mockRun)

    const summaryHeading = await screen.findByText('Undo Partially Completed')
    expect(summaryHeading).toBeInTheDocument()

    // Shows how many files were actually restored
    expect(screen.getByText(/Successfully restored/)).toBeInTheDocument()
    expect(
      screen.getByText((_, el) => el?.tagName === 'P' && /1 file\./.test(el.textContent ?? ''))
    ).toBeInTheDocument()

    // Shows the skipped file and its reason
    expect(screen.getByText('Skipped Files (1)')).toBeInTheDocument()
    expect(screen.getByText('missing.pdf')).toBeInTheDocument()
    expect(screen.getByText('File no longer exists at moved location.')).toBeInTheDocument()
  })
})
