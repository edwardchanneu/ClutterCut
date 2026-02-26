import type { ConditionType } from '../../../shared/ipcChannels'

export interface RuleRow {
  id: string
  conditionType: ConditionType
  conditionValue: string
  destinationFolder: string
}

export interface FileMatch {
  ruleIndex: number
  destination: string
}

/** Returns extension portion (without dot), lower-cased, or '' */
export function extOf(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : ''
}

/**
 * Evaluates rules top-to-bottom and returns the first match for a filename,
 * or null if no rule applies. Only considers rows that are fully filled in.
 */
export function computeFileMatch(fileName: string, rows: RuleRow[]): FileMatch | null {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const val = row.conditionValue.trim().replace(/^\./, '').toLowerCase()
    const dest = row.destinationFolder.trim()
    if (!val || !dest) continue // skip incomplete rows

    if (row.conditionType === 'file_extension') {
      if (extOf(fileName) === val) return { ruleIndex: i, destination: dest }
    } else if (row.conditionType === 'name_contains') {
      if (fileName.toLowerCase().includes(val)) return { ruleIndex: i, destination: dest }
    }
  }
  return null
}

/**
 * Distributes rule colours using the golden angle (~137.5°) so consecutive
 * rules are as perceptually far apart as possible, with no hard limit.
 */
export function ruleColour(index: number): {
  badgeStyle: import('react').CSSProperties
  pillStyle: import('react').CSSProperties
  ringStyle: import('react').CSSProperties
} {
  const hue = Math.round((index * 137.508) % 360)
  return {
    // Badge: vivid, white text
    badgeStyle: { background: `hsl(${hue}, 60%, 42%)` },
    // Pill background + text
    pillStyle: {
      background: `hsl(${hue}, 80%, 96%)`,
      color: `hsl(${hue}, 55%, 32%)`
    },
    // Subtle ring border
    ringStyle: { boxShadow: `0 0 0 1px hsl(${hue}, 55%, 78%) inset` }
  }
}
