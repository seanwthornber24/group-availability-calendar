import { describe, it, expect } from 'vitest'
import {
  computeMyDays,
  computeFreeCountByDate,
  computeMaxFree,
  getDayCellStatus,
} from './calendarUtils'

// ─────────────────────────────────────────────
// computeMyDays
// ─────────────────────────────────────────────
describe('computeMyDays', () => {
  it('returns empty Set when availability is empty', () => {
    expect(computeMyDays([], 'p1').size).toBe(0)
  })

  it('returns empty Set when currentParticipantId is null', () => {
    const availability = [{ participant_id: 'p1', date: '2026-04-01' }]
    expect(computeMyDays(availability, null).size).toBe(0)
  })

  it('returns empty Set when no rows match the current participant', () => {
    const availability = [{ participant_id: 'p2', date: '2026-04-01' }]
    expect(computeMyDays(availability, 'p1').size).toBe(0)
  })

  it('returns the correct dates for the current participant', () => {
    const availability = [
      { participant_id: 'p1', date: '2026-04-01' },
      { participant_id: 'p1', date: '2026-04-05' },
      { participant_id: 'p2', date: '2026-04-01' },
    ]
    const result = computeMyDays(availability, 'p1')
    expect(result).toEqual(new Set(['2026-04-01', '2026-04-05']))
  })

  it('ignores rows belonging to other participants', () => {
    const availability = [
      { participant_id: 'p2', date: '2026-04-10' },
      { participant_id: 'p3', date: '2026-04-11' },
    ]
    expect(computeMyDays(availability, 'p1').size).toBe(0)
  })

  it('does not mutate the input array', () => {
    const availability = [{ participant_id: 'p1', date: '2026-04-01' }]
    const copy = [...availability]
    computeMyDays(availability, 'p1')
    expect(availability).toEqual(copy)
  })
})

// ─────────────────────────────────────────────
// computeFreeCountByDate
// ─────────────────────────────────────────────
describe('computeFreeCountByDate', () => {
  it('returns empty object for empty array', () => {
    expect(computeFreeCountByDate([])).toEqual({})
  })

  it('counts a single row as 1', () => {
    const result = computeFreeCountByDate([{ date: '2026-04-01' }])
    expect(result).toEqual({ '2026-04-01': 1 })
  })

  it('accumulates multiple rows for the same date', () => {
    const availability = [
      { participant_id: 'p1', date: '2026-04-01' },
      { participant_id: 'p2', date: '2026-04-01' },
      { participant_id: 'p3', date: '2026-04-01' },
    ]
    expect(computeFreeCountByDate(availability)['2026-04-01']).toBe(3)
  })

  it('keeps separate counts for different dates', () => {
    const availability = [
      { date: '2026-04-01' },
      { date: '2026-04-02' },
      { date: '2026-04-01' },
    ]
    const result = computeFreeCountByDate(availability)
    expect(result['2026-04-01']).toBe(2)
    expect(result['2026-04-02']).toBe(1)
  })

  it('does not mutate the input array', () => {
    const availability = [{ date: '2026-04-01' }]
    const copy = [...availability]
    computeFreeCountByDate(availability)
    expect(availability).toEqual(copy)
  })
})

// ─────────────────────────────────────────────
// computeMaxFree
// ─────────────────────────────────────────────
describe('computeMaxFree', () => {
  it('returns 0 for empty object', () => {
    expect(computeMaxFree({})).toBe(0)
  })

  it('returns the single value when one entry', () => {
    expect(computeMaxFree({ '2026-04-01': 3 })).toBe(3)
  })

  it('returns the maximum across multiple entries', () => {
    expect(computeMaxFree({ '2026-04-01': 2, '2026-04-02': 5, '2026-04-03': 1 })).toBe(5)
  })

  it('returns 1 when all values are 1', () => {
    expect(computeMaxFree({ a: 1, b: 1, c: 1 })).toBe(1)
  })
})

// ─────────────────────────────────────────────
// getDayCellStatus
// ─────────────────────────────────────────────
describe('getDayCellStatus', () => {
  it('returns gray styles when isPast is true, regardless of ratio', () => {
    const { bg, textColor } = getDayCellStatus(5, 5, true)
    expect(bg).toBe('bg-gray-100 dark:bg-gray-800')
    expect(textColor).toBe('text-gray-300 dark:text-gray-600')
  })

  it('isPast=true overrides even all-free ratio', () => {
    const { bg } = getDayCellStatus(3, 3, true)
    expect(bg).toBe('bg-gray-100 dark:bg-gray-800')
  })

  it('returns neutral when totalParticipants is 0 and not past', () => {
    const { bg, textColor } = getDayCellStatus(0, 0, false)
    expect(bg).toBe('bg-gray-50 dark:bg-gray-900')
    expect(textColor).toBe('text-gray-800 dark:text-gray-100')
  })

  it('returns neutral when freeCount is 0 and not past', () => {
    const { bg } = getDayCellStatus(0, 4, false)
    expect(bg).toBe('bg-gray-50 dark:bg-gray-900')
  })

  it('returns amber-100 when ratio is less than 0.5 (1/3)', () => {
    const { bg, textColor } = getDayCellStatus(1, 3, false)
    expect(bg).toBe('bg-amber-100 dark:bg-amber-900/40')
    expect(textColor).toBe('text-gray-800 dark:text-gray-100')
  })

  it('returns amber-400 when ratio is exactly 0.5 (1/2)', () => {
    const { bg, textColor } = getDayCellStatus(1, 2, false)
    expect(bg).toBe('bg-amber-400')
    expect(textColor).toBe('text-white')
  })

  it('returns amber-400 when ratio is greater than 0.5 but not 1 (2/3)', () => {
    const { bg, textColor } = getDayCellStatus(2, 3, false)
    expect(bg).toBe('bg-amber-400')
    expect(textColor).toBe('text-white')
  })

  it('returns green-500 when ratio is exactly 1.0 (all free)', () => {
    const { bg, textColor } = getDayCellStatus(4, 4, false)
    expect(bg).toBe('bg-green-500')
    expect(textColor).toBe('text-white')
  })

  it('returns neutral when totalParticipants is null', () => {
    const { bg } = getDayCellStatus(0, null, false)
    expect(bg).toBe('bg-gray-50 dark:bg-gray-900')
  })
})
