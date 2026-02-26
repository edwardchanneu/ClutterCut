import { describe, it, expect } from 'vitest'
import { matchesExtension, matchesNameContains } from './ruleService'

describe('ruleService', () => {
  describe('matchesExtension', () => {
    // -----------------------------------------------------------------
    // Positive matches — case-insensitive
    // -----------------------------------------------------------------

    it('matches when file extension and rule value are both lowercase', () => {
      expect(matchesExtension('report.pdf', 'pdf')).toBe(true)
    })

    it('matches when file extension is uppercase and rule value is lowercase', () => {
      expect(matchesExtension('REPORT.PDF', 'pdf')).toBe(true)
    })

    it('matches when file extension is mixed case and rule value is lowercase', () => {
      expect(matchesExtension('Report.Pdf', 'pdf')).toBe(true)
    })

    it('matches when rule value has a leading dot (e.g. ".pdf")', () => {
      expect(matchesExtension('report.pdf', '.pdf')).toBe(true)
    })

    it('matches when rule value is uppercase and file extension is lowercase', () => {
      expect(matchesExtension('photo.jpg', 'JPG')).toBe(true)
    })

    // -----------------------------------------------------------------
    // Non-matches
    // -----------------------------------------------------------------

    it('does not match a file with a different extension', () => {
      expect(matchesExtension('notes.docx', 'pdf')).toBe(false)
    })

    it('does not match a file with no extension', () => {
      expect(matchesExtension('README', 'pdf')).toBe(false)
    })

    it('does not match when the extension is only a substring of the filename', () => {
      expect(matchesExtension('mypdf.txt', 'pdf')).toBe(false)
    })

    // -----------------------------------------------------------------
    // Empty / whitespace extension value — validation guard
    // -----------------------------------------------------------------

    it('returns false when the extension value is an empty string', () => {
      expect(matchesExtension('report.pdf', '')).toBe(false)
    })

    it('returns false when the extension value is whitespace only', () => {
      expect(matchesExtension('report.pdf', '   ')).toBe(false)
    })

    it('returns false when the extension value is just a dot', () => {
      expect(matchesExtension('report.pdf', '.')).toBe(false)
    })
  })

  describe('matchesNameContains', () => {
    // -----------------------------------------------------------------
    // Positive matches — case-insensitive
    // -----------------------------------------------------------------

    it('matches when filename and substring are both lowercase', () => {
      expect(matchesNameContains('invoice-2023.pdf', 'invoice')).toBe(true)
    })

    it('matches when filename is uppercase and substring is lowercase', () => {
      expect(matchesNameContains('INVOICE-2023.PDF', 'invoice')).toBe(true)
    })

    it('matches when filename is mixed case and substring is lowercase', () => {
      expect(matchesNameContains('Invoice-2023.pdf', 'invoice')).toBe(true)
    })

    it('matches when substring is uppercase and filename is lowercase', () => {
      expect(matchesNameContains('invoice-2023.pdf', 'INVOICE')).toBe(true)
    })

    it('matches when substring spans the name and extension', () => {
      expect(matchesNameContains('report.pdf', 't.pd')).toBe(true)
    })

    it('matches when substring matches the extension exactly', () => {
      expect(matchesNameContains('photo.jpg', 'jpg')).toBe(true)
    })

    // -----------------------------------------------------------------
    // Non-matches
    // -----------------------------------------------------------------

    it('does not match a filename that does not contain the substring', () => {
      expect(matchesNameContains('notes.docx', 'invoice')).toBe(false)
    })

    // -----------------------------------------------------------------
    // Empty / whitespace value — validation guard
    // -----------------------------------------------------------------

    it('returns false when the substring is an empty string', () => {
      expect(matchesNameContains('report.pdf', '')).toBe(false)
    })

    it('returns false when the substring is whitespace only', () => {
      expect(matchesNameContains('report.pdf', '   ')).toBe(false)
    })
  })
})
