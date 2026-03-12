import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { HistoryEntry } from './HistoryEntry'
import type { UnifiedRun } from '../hooks/useHistory'

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

    expect(screen.getByText('/Users/test/Downloads')).toBeInTheDocument()
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

  it('shows badges when run is undone or pending sync', () => {
    const alteredRun = { ...mockRun, undone: true, isPendingSync: true }
    const onToggle = vi.fn()
    render(<HistoryEntry run={alteredRun} isExpanded={false} onToggle={onToggle} />)

    expect(screen.getByText('Undone')).toBeInTheDocument()
    expect(screen.getByText('Pending Sync')).toBeInTheDocument()
  })
})
