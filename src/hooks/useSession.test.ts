import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useSession } from './useSession'
import { supabase } from '../lib/supabase'
import { getSession } from '../lib/session'
import { createBuilder, createChannelMock } from '../test/mockSupabase'

vi.mock('../lib/supabase', () => ({
  supabase: { from: vi.fn(), channel: vi.fn(), removeChannel: vi.fn() },
}))
vi.mock('../lib/session', () => ({ getSession: vi.fn() }))

const SAMPLE_SESSION = { id: 'ses1', name: 'BBQ', month: '2026-04-01', created_at: null }
const SAMPLE_PARTICIPANTS = [
  { id: 'p1', name: 'Alice', session_id: 'ses1', local_id: 'l1', created_at: null },
  { id: 'p2', name: 'Bob', session_id: 'ses1', local_id: 'l2', created_at: null },
]

describe('useSession', () => {
  let mockChannel: ReturnType<typeof createChannelMock>

  beforeEach(() => {
    vi.clearAllMocks()
    mockChannel = createChannelMock()
    vi.mocked(supabase.channel).mockReturnValue(mockChannel as never)
  })

  it('starts with loading=true', () => {
    vi.mocked(getSession).mockResolvedValue(SAMPLE_SESSION)
    const builder = createBuilder({ data: SAMPLE_PARTICIPANTS, error: null })
    vi.mocked(supabase.from).mockReturnValue(builder as never)

    const { result } = renderHook(() => useSession('ses1'))
    expect(result.current.loading).toBe(true)
  })

  it('sets loading=false after data loads', async () => {
    vi.mocked(getSession).mockResolvedValue(SAMPLE_SESSION)
    const builder = createBuilder({ data: SAMPLE_PARTICIPANTS, error: null })
    vi.mocked(supabase.from).mockReturnValue(builder as never)

    const { result } = renderHook(() => useSession('ses1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
  })

  it('populates session and participants on success', async () => {
    vi.mocked(getSession).mockResolvedValue(SAMPLE_SESSION)
    const builder = createBuilder({ data: SAMPLE_PARTICIPANTS, error: null })
    vi.mocked(supabase.from).mockReturnValue(builder as never)

    const { result } = renderHook(() => useSession('ses1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.session).toEqual(SAMPLE_SESSION)
    expect(result.current.participants).toEqual(SAMPLE_PARTICIPANTS)
  })

  it('defaults participants to empty array when data is null', async () => {
    vi.mocked(getSession).mockResolvedValue(SAMPLE_SESSION)
    const builder = createBuilder({ data: null, error: null })
    vi.mocked(supabase.from).mockReturnValue(builder as never)

    const { result } = renderHook(() => useSession('ses1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.participants).toEqual([])
  })

  it('sets error when getSession throws', async () => {
    vi.mocked(getSession).mockRejectedValue(new Error('session not found'))
    const builder = createBuilder({ data: [], error: null })
    vi.mocked(supabase.from).mockReturnValue(builder as never)

    const { result } = renderHook(() => useSession('ses1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error!.message).toBe('session not found')
  })

  it('sets error when participants query returns error', async () => {
    vi.mocked(getSession).mockResolvedValue(SAMPLE_SESSION)
    const builder = createBuilder({ data: null, error: new Error('participants error') })
    vi.mocked(supabase.from).mockReturnValue(builder as never)

    const { result } = renderHook(() => useSession('ses1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBeInstanceOf(Error)
  })

  it('adds a new participant on INSERT realtime event', async () => {
    vi.mocked(getSession).mockResolvedValue(SAMPLE_SESSION)
    const builder = createBuilder({ data: [SAMPLE_PARTICIPANTS[0]], error: null })
    vi.mocked(supabase.from).mockReturnValue(builder as never)

    const { result } = renderHook(() => useSession('ses1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => {
      mockChannel._trigger('INSERT', {
        new: { id: 'p2', name: 'Bob', session_id: 'ses1' },
      })
    })

    expect(result.current.participants).toHaveLength(2)
    expect(result.current.participants[1].name).toBe('Bob')
  })

  it('removes a participant on DELETE realtime event', async () => {
    vi.mocked(getSession).mockResolvedValue(SAMPLE_SESSION)
    const builder = createBuilder({ data: SAMPLE_PARTICIPANTS, error: null })
    vi.mocked(supabase.from).mockReturnValue(builder as never)

    const { result } = renderHook(() => useSession('ses1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => {
      mockChannel._trigger('DELETE', { old: { id: 'p1' } })
    })

    expect(result.current.participants).toHaveLength(1)
    expect(result.current.participants.find((p) => p.id === 'p1')).toBeUndefined()
  })

  it('makes no calls when sessionId is null', () => {
    renderHook(() => useSession(undefined))

    expect(getSession).not.toHaveBeenCalled()
    expect(supabase.from).not.toHaveBeenCalled()
    expect(supabase.channel).not.toHaveBeenCalled()
  })

  it('makes no calls when sessionId is undefined', () => {
    renderHook(() => useSession(undefined))

    expect(getSession).not.toHaveBeenCalled()
  })

  it('calls removeChannel on unmount', async () => {
    vi.mocked(getSession).mockResolvedValue(SAMPLE_SESSION)
    const builder = createBuilder({ data: [], error: null })
    vi.mocked(supabase.from).mockReturnValue(builder as never)

    const { unmount } = renderHook(() => useSession('ses1'))
    await waitFor(() => expect(supabase.channel).toHaveBeenCalled())

    unmount()
    expect(supabase.removeChannel).toHaveBeenCalledWith(mockChannel)
  })
})
