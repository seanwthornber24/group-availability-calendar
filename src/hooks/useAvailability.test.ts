import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useAvailability } from './useAvailability'
import { supabase } from '../lib/supabase'
import { createBuilder, createChannelMock } from '../test/mockSupabase'

vi.mock('../lib/supabase', () => ({
  supabase: { from: vi.fn(), channel: vi.fn(), removeChannel: vi.fn() },
}))

const SAMPLE_ROWS = [
  { id: 'av1', participant_id: 'p1', date: '2026-04-01' },
  { id: 'av2', participant_id: 'p2', date: '2026-04-02' },
]

describe('useAvailability', () => {
  let mockChannel: ReturnType<typeof createChannelMock>

  beforeEach(() => {
    vi.clearAllMocks()
    mockChannel = createChannelMock()
    vi.mocked(supabase.channel).mockReturnValue(mockChannel as never)
  })

  it('starts with empty availability array', () => {
    const builder = createBuilder({ data: SAMPLE_ROWS, error: null })
    vi.mocked(supabase.from).mockReturnValue(builder as never)

    const { result } = renderHook(() => useAvailability('ses1'))
    expect(result.current.availability).toEqual([])
  })

  it('populates availability after fetch resolves', async () => {
    const builder = createBuilder({ data: SAMPLE_ROWS, error: null })
    vi.mocked(supabase.from).mockReturnValue(builder as never)

    const { result } = renderHook(() => useAvailability('ses1'))

    await waitFor(() => expect(result.current.availability).toHaveLength(2))
    expect(result.current.availability[0]).toEqual({
      id: 'av1',
      participant_id: 'p1',
      date: '2026-04-01',
    })
  })

  it('defaults to empty array when Supabase returns null data', async () => {
    const builder = createBuilder({ data: null, error: null })
    vi.mocked(supabase.from).mockReturnValue(builder as never)

    const { result } = renderHook(() => useAvailability('ses1'))

    await waitFor(() => {
      // After the fetch, still expect empty (null → [])
      expect(result.current.availability).toEqual([])
    })
  })

  it('handles fetch error silently (availability stays empty)', async () => {
    const builder = createBuilder({
      data: null,
      error: new Error('fetch error'),
    })
    vi.mocked(supabase.from).mockReturnValue(builder as never)

    const { result } = renderHook(() => useAvailability('ses1'))

    await waitFor(() => {
      expect(result.current.availability).toEqual([])
    })
  })

  it('appends a new row on INSERT realtime event', async () => {
    const builder = createBuilder({ data: SAMPLE_ROWS, error: null })
    vi.mocked(supabase.from).mockReturnValue(builder as never)

    const { result } = renderHook(() => useAvailability('ses1'))
    await waitFor(() => expect(result.current.availability).toHaveLength(2))

    act(() => {
      mockChannel._trigger('INSERT', {
        new: { id: 'av3', participant_id: 'p1', date: '2026-04-10' },
      })
    })

    expect(result.current.availability).toHaveLength(3)
    expect(result.current.availability[2]).toEqual({
      id: 'av3',
      participant_id: 'p1',
      date: '2026-04-10',
    })
  })

  it('removes a row by id on DELETE realtime event', async () => {
    const builder = createBuilder({ data: SAMPLE_ROWS, error: null })
    vi.mocked(supabase.from).mockReturnValue(builder as never)

    const { result } = renderHook(() => useAvailability('ses1'))
    await waitFor(() => expect(result.current.availability).toHaveLength(2))

    act(() => {
      mockChannel._trigger('DELETE', { old: { id: 'av1' } })
    })

    expect(result.current.availability).toHaveLength(1)
    expect(result.current.availability.find((a) => a.id === 'av1')).toBeUndefined()
  })

  it('DELETE filter uses payload.old.id — does NOT use participant_id or date', async () => {
    // This test specifically validates the bug fix: old code compared participant_id+date
    // which would be undefined in the DELETE payload
    const builder = createBuilder({ data: SAMPLE_ROWS, error: null })
    vi.mocked(supabase.from).mockReturnValue(builder as never)

    const { result } = renderHook(() => useAvailability('ses1'))
    await waitFor(() => expect(result.current.availability).toHaveLength(2))

    // Send DELETE payload with ONLY id (as Supabase actually sends it)
    act(() => {
      mockChannel._trigger('DELETE', {
        old: { id: 'av2' }, // no participant_id or date fields
      })
    })

    expect(result.current.availability).toHaveLength(1)
    expect(result.current.availability.find((a) => a.id === 'av2')).toBeUndefined()
  })

  it('subscribes to DELETE events without a session_id filter', async () => {
    const builder = createBuilder({ data: [], error: null })
    vi.mocked(supabase.from).mockReturnValue(builder as never)

    renderHook(() => useAvailability('ses1'))

    const deleteCall = mockChannel.on.mock.calls.find(
      ([, opts]) => (opts as { event: string }).event === 'DELETE'
    )
    expect(deleteCall).toBeDefined()
    expect(deleteCall![1]).not.toHaveProperty('filter')
  })

  it('makes no Supabase calls and creates no channel when sessionId is null', () => {
    renderHook(() => useAvailability(undefined))

    expect(supabase.from).not.toHaveBeenCalled()
    expect(supabase.channel).not.toHaveBeenCalled()
  })

  it('makes no Supabase calls and creates no channel when sessionId is undefined', () => {
    renderHook(() => useAvailability(undefined))

    expect(supabase.from).not.toHaveBeenCalled()
    expect(supabase.channel).not.toHaveBeenCalled()
  })

  it('calls removeChannel on unmount', async () => {
    const builder = createBuilder({ data: [], error: null })
    vi.mocked(supabase.from).mockReturnValue(builder as never)

    const { unmount } = renderHook(() => useAvailability('ses1'))
    await waitFor(() => expect(supabase.channel).toHaveBeenCalled())

    unmount()

    expect(supabase.removeChannel).toHaveBeenCalledWith(mockChannel)
  })

  it('does not update state after unmount (cancelled flag)', async () => {
    let resolveQuery!: (value: unknown) => void
    const deferred = new Promise<unknown>((res) => {
      resolveQuery = res
    })

    const builder = createBuilder()
    builder.eq.mockReturnValue({
      ...builder,
      then: (resolve: (v: unknown) => unknown) => deferred.then(resolve),
      catch: (reject: (r: unknown) => unknown) => deferred.catch(reject),
    })
    vi.mocked(supabase.from).mockReturnValue(builder as never)

    const { result, unmount } = renderHook(() => useAvailability('ses1'))
    unmount() // sets cancelled = true before the query resolves

    // Resolve the slow query after unmount — cancelled flag should block state update
    await act(async () => {
      resolveQuery({ data: SAMPLE_ROWS, error: null })
    })

    expect(result.current.availability).toEqual([])
  })
})
