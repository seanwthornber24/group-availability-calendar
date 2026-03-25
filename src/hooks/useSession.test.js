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

const SAMPLE_SESSION = { id: 'ses1', name: 'BBQ', month: '2026-04-01' }
const SAMPLE_PARTICIPANTS = [
  { id: 'p1', name: 'Alice', session_id: 'ses1' },
  { id: 'p2', name: 'Bob', session_id: 'ses1' },
]

describe('useSession', () => {
  let mockChannel

  beforeEach(() => {
    vi.clearAllMocks()
    mockChannel = createChannelMock()
    supabase.channel.mockReturnValue(mockChannel)
  })

  it('starts with loading=true', () => {
    getSession.mockResolvedValue(SAMPLE_SESSION)
    const builder = createBuilder({ data: SAMPLE_PARTICIPANTS, error: null })
    supabase.from.mockReturnValue(builder)

    const { result } = renderHook(() => useSession('ses1'))
    expect(result.current.loading).toBe(true)
  })

  it('sets loading=false after data loads', async () => {
    getSession.mockResolvedValue(SAMPLE_SESSION)
    const builder = createBuilder({ data: SAMPLE_PARTICIPANTS, error: null })
    supabase.from.mockReturnValue(builder)

    const { result } = renderHook(() => useSession('ses1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
  })

  it('populates session and participants on success', async () => {
    getSession.mockResolvedValue(SAMPLE_SESSION)
    const builder = createBuilder({ data: SAMPLE_PARTICIPANTS, error: null })
    supabase.from.mockReturnValue(builder)

    const { result } = renderHook(() => useSession('ses1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.session).toEqual(SAMPLE_SESSION)
    expect(result.current.participants).toEqual(SAMPLE_PARTICIPANTS)
  })

  it('defaults participants to empty array when data is null', async () => {
    getSession.mockResolvedValue(SAMPLE_SESSION)
    const builder = createBuilder({ data: null, error: null })
    supabase.from.mockReturnValue(builder)

    const { result } = renderHook(() => useSession('ses1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.participants).toEqual([])
  })

  it('sets error when getSession throws', async () => {
    getSession.mockRejectedValue(new Error('session not found'))
    const builder = createBuilder({ data: [], error: null })
    supabase.from.mockReturnValue(builder)

    const { result } = renderHook(() => useSession('ses1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error.message).toBe('session not found')
  })

  it('sets error when participants query returns error', async () => {
    getSession.mockResolvedValue(SAMPLE_SESSION)
    const builder = createBuilder({ data: null, error: new Error('participants error') })
    supabase.from.mockReturnValue(builder)

    const { result } = renderHook(() => useSession('ses1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBeInstanceOf(Error)
  })

  it('adds a new participant on INSERT realtime event', async () => {
    getSession.mockResolvedValue(SAMPLE_SESSION)
    const builder = createBuilder({ data: [SAMPLE_PARTICIPANTS[0]], error: null })
    supabase.from.mockReturnValue(builder)

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
    getSession.mockResolvedValue(SAMPLE_SESSION)
    const builder = createBuilder({ data: SAMPLE_PARTICIPANTS, error: null })
    supabase.from.mockReturnValue(builder)

    const { result } = renderHook(() => useSession('ses1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => {
      mockChannel._trigger('DELETE', { old: { id: 'p1' } })
    })

    expect(result.current.participants).toHaveLength(1)
    expect(result.current.participants.find((p) => p.id === 'p1')).toBeUndefined()
  })

  it('makes no calls when sessionId is null', () => {
    renderHook(() => useSession(null))

    expect(getSession).not.toHaveBeenCalled()
    expect(supabase.from).not.toHaveBeenCalled()
    expect(supabase.channel).not.toHaveBeenCalled()
  })

  it('makes no calls when sessionId is undefined', () => {
    renderHook(() => useSession(undefined))

    expect(getSession).not.toHaveBeenCalled()
  })

  it('calls removeChannel on unmount', async () => {
    getSession.mockResolvedValue(SAMPLE_SESSION)
    const builder = createBuilder({ data: [], error: null })
    supabase.from.mockReturnValue(builder)

    const { unmount } = renderHook(() => useSession('ses1'))
    await waitFor(() => expect(supabase.channel).toHaveBeenCalled())

    unmount()
    expect(supabase.removeChannel).toHaveBeenCalledWith(mockChannel)
  })
})
