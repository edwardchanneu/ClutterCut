import { render, screen, fireEvent, within } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import RulesScreen from './RulesScreen'
import type { ReadFolderEntry } from '../../../shared/ipcChannels'

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

const dummyFiles: ReadFolderEntry[] = [
  { name: 'report.pdf', isFile: true },
  { name: 'invoice-2023.pdf', isFile: true },
  { name: 'SubFolder', isFile: false },
  { name: 'photo.jpg', isFile: true }
]

function renderRulesScreen(state: Record<string, unknown> = {}): ReturnType<typeof render> {
  mockLocationState = state
  return render(
    <MemoryRouter>
      <RulesScreen />
    </MemoryRouter>
  )
}

// ---------------------------------------------------------------------------
// Suites
// ---------------------------------------------------------------------------

describe('RulesScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocationState = {}
  })

  describe('Rendering & Initial State', () => {
    it('renders a default rule row for File Extension', () => {
      renderRulesScreen()

      expect(
        screen.getByRole('heading', { name: /Configure Organization Rules/i })
      ).toBeInTheDocument()

      const conditionSelects = screen.getAllByRole('combobox', { name: /Condition/i })
      expect(conditionSelects).toHaveLength(1)
      expect(conditionSelects[0]).toHaveValue('file_extension')

      expect(screen.getByRole('textbox', { name: /Extension/i })).toBeInTheDocument()
      expect(screen.getByRole('textbox', { name: /Move to Folder/i })).toBeInTheDocument()
    })

    it('displays folder path and file list from location state', () => {
      renderRulesScreen({ folderPath: '/Users/test/Documents', files: dummyFiles })

      // Asserts that the folder path is rendered
      expect(screen.getByText('/Users/test/Documents')).toBeInTheDocument()

      // Asserts the files are shown in the aside panel
      const filePanel = screen.getByRole('complementary', { name: /Files in selected folder/i })
      const panelContent = within(filePanel)

      expect(panelContent.getByText('report.pdf')).toBeInTheDocument()
      expect(panelContent.getByText('invoice-2023.pdf')).toBeInTheDocument()
      expect(panelContent.getByText('SubFolder')).toBeInTheDocument()
    })

    it('initializes rules correctly from location state', () => {
      const existingRows = [
        {
          id: 'test-rule-1',
          conditionType: 'name_contains' as const,
          conditionValue: 'invoice',
          destinationFolder: 'Finances'
        }
      ]
      renderRulesScreen({ rows: existingRows })

      // Should load the 1 row from state, not the default empty one
      const conditionSelects = screen.getAllByRole('combobox', { name: /Condition/i })
      expect(conditionSelects).toHaveLength(1)
      expect(conditionSelects[0]).toHaveValue('name_contains')

      const valueInput = screen.getByRole('textbox', { name: /Contains Text/i })
      expect(valueInput).toHaveValue('invoice')

      const destInputs = screen.getByRole('textbox', { name: /Move to Folder/i })
      expect(destInputs).toHaveValue('Finances')
    })
  })

  describe('Rule Management', () => {
    it('adds a new rule row', () => {
      renderRulesScreen()

      const addBtn = screen.getByRole('button', { name: /\+ Add Rule/i })
      fireEvent.click(addBtn)

      expect(screen.getAllByRole('combobox', { name: /Condition/i })).toHaveLength(2)
      expect(screen.getAllByLabelText(/Rule 1/i)).toHaveLength(2) // The badge has this aria label, and the delete button
      expect(screen.getAllByRole('button', { name: /Delete rule 2/i })).toHaveLength(1)
    })

    it('removes a rule row', () => {
      renderRulesScreen()

      // Add a second rule
      fireEvent.click(screen.getByRole('button', { name: /\+ Add Rule/i }))
      expect(screen.getAllByRole('combobox', { name: /Condition/i })).toHaveLength(2)

      // Delete the first one
      fireEvent.click(screen.getByRole('button', { name: /Delete rule 1/i }))

      // Now there's only 1 rule left
      expect(screen.getAllByRole('combobox', { name: /Condition/i })).toHaveLength(1)
    })

    it('cannot remove the last rule row', () => {
      renderRulesScreen()

      const deleteBtns = screen.getAllByRole('button', { name: /Delete rule/i })
      expect(deleteBtns).toHaveLength(1)
      expect(deleteBtns[0]).toBeDisabled()
    })
  })

  describe('Form Handlers & Validation', () => {
    it('updates condition type and corresponding labels', () => {
      renderRulesScreen()

      const conditionSelect = screen.getByRole('combobox', { name: /Condition/i })
      fireEvent.change(conditionSelect, { target: { value: 'name_contains' } })

      // It changes the label text
      expect(screen.getByText(/Contains Text/i)).toBeInTheDocument()
    })

    it('shows validation error for empty value/destination if blurred or evaluated (implicitly rendered inline when typed)', () => {
      renderRulesScreen()

      // Initial state contains no text, but user hasn't typed anything yet so the error logic shows if we have at least one character in either
      const destInput = screen.getByRole('textbox', { name: /Move to Folder/i })
      fireEvent.change(destInput, { target: { value: 'Finance' } })

      // Because destination is filled but condition value is empty, it should show an error
      expect(screen.getByRole('alert')).toHaveTextContent(/Condition value must not be empty/i)

      const conditionInput = screen.getByRole('textbox', { name: /Extension/i })
      fireEvent.change(conditionInput, { target: { value: 'pdf' } })
      fireEvent.change(destInput, { target: { value: '' } })

      // Because condition value is filled but destination is empty, it should show an error
      expect(screen.getByRole('alert')).toHaveTextContent(/Destination folder must not be empty/i)
    })

    it.each([['\\'], ['/'], [':'], ['*'], ['?'], ['"'], ['<'], ['>'], ['|']])(
      'shows validation error for illegal character "%s" in destination',
      (char) => {
        renderRulesScreen()

        const conditionInput = screen.getByRole('textbox', { name: /Extension/i })
        const destInput = screen.getByRole('textbox', { name: /Move to Folder/i })
        fireEvent.change(conditionInput, { target: { value: 'pdf' } })
        fireEvent.change(destInput, { target: { value: `Bad${char}Name` } })

        expect(screen.getByRole('alert')).toHaveTextContent(
          /Destination folder contains illegal characters/i
        )
      }
    )
  })

  describe('File Panel Matching', () => {
    it('highlights matched files and shows destination pill', () => {
      renderRulesScreen({ files: dummyFiles })

      // Enter rule: Extension = pdf, Destination = Documents
      const conditionInput = screen.getByRole('textbox', { name: /Extension/i })
      const destInput = screen.getByRole('textbox', { name: /Move to Folder/i })

      fireEvent.change(conditionInput, { target: { value: 'pdf' } })
      fireEvent.change(destInput, { target: { value: 'Documents' } })

      // Should show '2 will move'
      expect(screen.getByText(/2 will move/i)).toBeInTheDocument()

      // Pills should be shown next to report.pdf and invoice-2023.pdf
      const docPills = screen.getAllByText('Documents')
      expect(docPills).toHaveLength(2) // Excludes input typed value, these are text nodes or element text
    })

    it('shows "no match" warning when a valid rule matches no files', () => {
      renderRulesScreen({ files: dummyFiles })

      const conditionInput = screen.getByRole('textbox', { name: /Extension/i })
      const destInput = screen.getByRole('textbox', { name: /Move to Folder/i })

      fireEvent.change(conditionInput, { target: { value: 'docx' } })
      fireEvent.change(destInput, { target: { value: 'Word Docs' } })

      // It is a valid rule, but matches no files. So we show the amber warning.
      expect(
        screen.getByText(/This rule does not match any files in this folder./i)
      ).toBeInTheDocument()
    })
  })

  describe('Navigation', () => {
    it('navigates back when clicking Back', () => {
      renderRulesScreen()

      const backBtn = screen.getByRole('button', { name: /Back/i })
      fireEvent.click(backBtn)

      expect(mockNavigate).toHaveBeenCalledWith('/organize')
    })

    it('disables preview button when rules are invalid', () => {
      renderRulesScreen()

      const previewBtn = screen.getByRole('button', { name: /Preview Changes/i })
      expect(previewBtn).toBeDisabled() // Because default new row is empty

      const conditionInput = screen.getByRole('textbox', { name: /Extension/i })
      const destInput = screen.getByRole('textbox', { name: /Move to Folder/i })

      fireEvent.change(conditionInput, { target: { value: 'pdf' } })
      expect(previewBtn).toBeDisabled() // Because destination is empty
      expect(screen.getByText(/Destination folder must not be empty/i)).toBeInTheDocument()
      expect(screen.getByText(/Resolve errors to enable preview/i)).toBeInTheDocument()

      fireEvent.change(destInput, { target: { value: 'Documents' } })
      expect(previewBtn).not.toBeDisabled() // Now valid
      expect(screen.queryByText(/Destination folder must not be empty/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/Resolve errors to enable preview/i)).not.toBeInTheDocument()
    })
  })

  describe('Rule Warnings', () => {
    it('shows a warning when duplicate rules are added', () => {
      renderRulesScreen()

      const addRuleBtn = screen.getByRole('button', { name: /\+ Add Rule/i })
      fireEvent.click(addRuleBtn) // Add a second rule

      const conditionInputs = screen.getAllByRole('textbox', { name: /Extension/i })
      const destInputs = screen.getAllByRole('textbox', { name: /Move to Folder/i })

      // Set first rule
      fireEvent.change(conditionInputs[0], { target: { value: 'pdf' } })
      fireEvent.change(destInputs[0], { target: { value: 'Documents' } })

      // Set second rule to same condition (testing case-insensitivity and leading dot)
      fireEvent.change(conditionInputs[1], { target: { value: '.PDF' } })
      fireEvent.change(destInputs[1], { target: { value: 'Other Folder' } })

      const warnings = screen.getAllByText(/Duplicate rule detected/i)
      expect(warnings).toHaveLength(2) // Both rules show the warning

      // Cannot preview because duplicate is treated as error
      const previewBtn = screen.getByRole('button', { name: /Preview Changes/i })
      expect(previewBtn).toBeDisabled()
      expect(screen.getByText(/Resolve errors to enable Preview/i)).toBeInTheDocument()

      // Change second rule to something else
      fireEvent.change(conditionInputs[1], { target: { value: 'jpg' } })
      expect(screen.queryByText(/Duplicate rule detected/i)).not.toBeInTheDocument()

      // Now valid
      expect(previewBtn).not.toBeDisabled()
    })
  })
})
