import { describe, it, expect, vi, beforeEach } from 'vitest'
import { toggleAvailability } from './availability'
import { supabase } from './supabase'
import { createBuilder } from '../test/mockSupabase'

vi.mock('./supabase', () => ({
  supabase: { from: vi.fn() },
}))

describe('toggleAvailability', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deletes the existing row and returns "removed" when the row exists', async () => {
    const fetchBuilder = createBuilder({ data: { id: 'row-1' }, error: null })
    const deleteBuilder = createBuilder({ data: null, error: null })
    supabase.from.mockReturnValueOnce(fetchBuilder).mockReturnValueOnce(deleteBuilder)

    const result = await toggleAvailability('ses1', 'p1', '2026-04-01')

    expect(result).toBe('removed')
    expect(deleteBuilder.delete).toHaveBeenCalled()
    expect(deleteBuilder.eq).toHaveBeenCalledWith('id', 'row-1')
  })

  it('inserts a new row and returns "added" when no row exists', async () => {
    const fetchBuilder = createBuilder({ data: null, error: null })
    const insertBuilder = createBuilder({ data: null, error: null })
    supabase.from.mockReturnValueOnce(fetchBuilder).mockReturnValueOnce(insertBuilder)

    const result = await toggleAvailability('ses1', 'p1', '2026-04-01')

    expect(result).toBe('added')
    expect(insertBuilder.insert).toHaveBeenCalledWith({
      session_id: 'ses1',
      participant_id: 'p1',
      date: '2026-04-01',
    })
  })

  it('does NOT call insert when row exists (only delete)', async () => {
    const fetchBuilder = createBuilder({ data: { id: 'row-1' }, error: null })
    const deleteBuilder = createBuilder({ data: null, error: null })
    supabase.from.mockReturnValueOnce(fetchBuilder).mockReturnValueOnce(deleteBuilder)

    await toggleAvailability('ses1', 'p1', '2026-04-01')

    expect(deleteBuilder.insert).not.toHaveBeenCalled()
  })

  it('does NOT call delete when row does not exist (only insert)', async () => {
    const fetchBuilder = createBuilder({ data: null, error: null })
    const insertBuilder = createBuilder({ data: null, error: null })
    supabase.from.mockReturnValueOnce(fetchBuilder).mockReturnValueOnce(insertBuilder)

    await toggleAvailability('ses1', 'p1', '2026-04-01')

    expect(insertBuilder.delete).not.toHaveBeenCalled()
  })

  it('throws and stops when the fetch (maybeSingle) returns an error', async () => {
    const fetchBuilder = createBuilder({ data: null, error: new Error('DB fetch error') })
    supabase.from.mockReturnValueOnce(fetchBuilder)

    await expect(toggleAvailability('ses1', 'p1', '2026-04-01')).rejects.toThrow('DB fetch error')
    // Only one `from` call — no delete/insert builder created
    expect(supabase.from).toHaveBeenCalledTimes(1)
  })

  it('throws when the delete returns an error', async () => {
    const fetchBuilder = createBuilder({ data: { id: 'row-1' }, error: null })
    const deleteBuilder = createBuilder({ data: null, error: new Error('delete failed') })
    supabase.from.mockReturnValueOnce(fetchBuilder).mockReturnValueOnce(deleteBuilder)

    await expect(toggleAvailability('ses1', 'p1', '2026-04-01')).rejects.toThrow('delete failed')
  })

  it('throws when the insert returns an error', async () => {
    const fetchBuilder = createBuilder({ data: null, error: null })
    const insertBuilder = createBuilder({ data: null, error: new Error('insert failed') })
    supabase.from.mockReturnValueOnce(fetchBuilder).mockReturnValueOnce(insertBuilder)

    await expect(toggleAvailability('ses1', 'p1', '2026-04-01')).rejects.toThrow('insert failed')
  })
})
