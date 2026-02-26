import path from 'path'

/**
 * Determines whether a file's extension matches the given extension value.
 *
 * Matching is case-insensitive. The `ext` argument may optionally include a
 * leading dot (e.g. ".pdf" or "pdf" — both are accepted). An empty or
 * whitespace-only `ext` never matches.
 *
 * @param fileName - The full file name, e.g. "Report.PDF"
 * @param ext      - The extension to match against, e.g. "pdf" or ".pdf"
 * @returns true if the file's extension matches `ext` case-insensitively.
 */
export function matchesExtension(fileName: string, ext: string): boolean {
  const normalised = ext.trim().replace(/^\./, '').toLowerCase()

  if (normalised === '') {
    return false
  }

  const fileExt = path.extname(fileName).slice(1).toLowerCase()
  return fileExt === normalised
}

/**
 * Determines whether a file's name contains the given substring.
 *
 * Matching is case-insensitive and checks against the entire file name,
 * including its extension. An empty or whitespace-only `substring` never matches.
 *
 * @param fileName - The full file name, e.g. "Report.PDF"
 * @param substring - The value to look for, e.g. "report"
 * @returns true if `fileName` contains `substring` case-insensitively.
 */
export function matchesNameContains(fileName: string, substring: string): boolean {
  const normalisedSubstring = substring.trim().toLowerCase()

  if (normalisedSubstring === '') {
    return false
  }

  return fileName.toLowerCase().includes(normalisedSubstring)
}
