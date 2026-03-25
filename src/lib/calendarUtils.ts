import type { AvailabilityRow, DayCellStyle } from '../types'

/**
 * Pure calendar utility functions, extracted for testability.
 */

/**
 * Returns a Set of date strings (yyyy-MM-dd) for the given participant.
 */
export function computeMyDays(availability: AvailabilityRow[], currentParticipantId: string | null): Set<string> {
  if (!currentParticipantId) { return new Set() }
  return new Set(
    availability
      .filter((a) => a.participant_id === currentParticipantId)
      .map((a) => a.date)
  )
}

/**
 * Returns a map of date string → number of free participants.
 */
export function computeFreeCountByDate(availability: Pick<AvailabilityRow, 'date'>[]): Record<string, number> {
  const map: Record<string, number> = {}
  availability.forEach(({ date }) => {
    map[date] = (map[date] ?? 0) + 1
  })
  return map
}

/**
 * Returns the maximum value in a { date: count } map. Returns 0 for empty map.
 */
export function computeMaxFree(freeCountByDate: Record<string, number>): number {
  const values = Object.values(freeCountByDate)
  if (values.length === 0) { return 0 }
  return Math.max(...values)
}

/**
 * Returns Tailwind background and text colour classes for a calendar day cell.
 *
 * Colour scale:
 *  - past          → gray (muted, non-interactive)
 *  - 0 free        → neutral gray-50
 *  - ratio < 0.5   → amber-100 (some free)
 *  - ratio >= 0.5  → amber-400 (most free)
 *  - ratio = 1.0   → green-500 (all free)
 */
export function getDayCellStatus(freeCount: number, totalParticipants: number | null, isPast: boolean): DayCellStyle {
  if (isPast) { return { bg: 'bg-gray-100 dark:bg-gray-800', textColor: 'text-gray-300 dark:text-gray-600' } }
  if (!totalParticipants || freeCount === 0) { return { bg: 'bg-gray-50 dark:bg-gray-900', textColor: 'text-gray-800 dark:text-gray-100' } }
  const ratio = freeCount / totalParticipants
  if (ratio === 1) { return { bg: 'bg-green-500', textColor: 'text-white' } }
  if (ratio >= 0.5) { return { bg: 'bg-amber-400', textColor: 'text-white' } }
  return { bg: 'bg-amber-100 dark:bg-amber-900/40', textColor: 'text-gray-800 dark:text-gray-100' }
}
