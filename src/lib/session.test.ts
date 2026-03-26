import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createSession, getSession, getStoredParticipant, joinSession } from './session'
import { supabase } from './supabase'
import { createBuilder } from '../test/mockSupabase'

vi.mock('./supabase', () => ({ supabase: { from: vi.fn() } }))
vi.mock('nanoid', () => ({ nanoid: vi.fn() }))

import { nanoid } from 'nanoid'

describe('createSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(nanoid)
      .mockReturnValueOnce('sess1234') // sessionId  (8 chars)
      .mockReturnValueOnce('localid1234567890') // localId (16 chars)
  })

  it('inserts into sessions with the generated id, name, and month', async () => {
    const sessionBuilder = createBuilder({ data: null, error: null })
    const participantBuilder = createBuilder({
      data: { id: 'part-uuid', name: 'Alice', local_id: 'localid1234567890' },
      error: null,
    })
    vi.mocked(supabase.from)
      .mockReturnValueOnce(sessionBuilder as never)
      .mockReturnValueOnce(participantBuilder as never)

    await createSession({
      name: 'BBQ',
      creatorName: 'Alice',
      month: '2026-04-01',
    })

    expect(sessionBuilder.insert).toHaveBeenCalledWith({
      id: 'sess1234',
      name: 'BBQ',
      month: '2026-04-01',
    })
  })

  it('inserts into participants with session_id, name, and local_id', async () => {
    const sessionBuilder = createBuilder({ data: null, error: null })
    const participantBuilder = createBuilder({
      data: { id: 'part-uuid', name: 'Alice' },
      error: null,
    })
    vi.mocked(supabase.from)
      .mockReturnValueOnce(sessionBuilder as never)
      .mockReturnValueOnce(participantBuilder as never)

    await createSession({
      name: 'BBQ',
      creatorName: 'Alice',
      month: '2026-04-01',
    })

    expect(participantBuilder.insert).toHaveBeenCalledWith({
      session_id: 'sess1234',
      name: 'Alice',
      local_id: 'localid1234567890',
    })
  })

  it('stores local_id and participant_id in localStorage', async () => {
    const sessionBuilder = createBuilder({ data: null, error: null })
    const participantBuilder = createBuilder({
      data: { id: 'part-uuid', name: 'Alice' },
      error: null,
    })
    vi.mocked(supabase.from)
      .mockReturnValueOnce(sessionBuilder as never)
      .mockReturnValueOnce(participantBuilder as never)

    await createSession({
      name: 'BBQ',
      creatorName: 'Alice',
      month: '2026-04-01',
    })

    expect(localStorage.getItem('local_id:sess1234')).toBe('localid1234567890')
    expect(localStorage.getItem('participant_id:sess1234')).toBe('part-uuid')
  })

  it('returns the generated sessionId', async () => {
    const sessionBuilder = createBuilder({ data: null, error: null })
    const participantBuilder = createBuilder({
      data: { id: 'part-uuid' },
      error: null,
    })
    vi.mocked(supabase.from)
      .mockReturnValueOnce(sessionBuilder as never)
      .mockReturnValueOnce(participantBuilder as never)

    const result = await createSession({
      name: 'BBQ',
      creatorName: 'Alice',
      month: '2026-04-01',
    })
    expect(result).toBe('sess1234')
  })

  it('throws when the session insert errors and does not write localStorage', async () => {
    const sessionBuilder = createBuilder({
      data: null,
      error: new Error('sessions insert failed'),
    })
    vi.mocked(supabase.from).mockReturnValueOnce(sessionBuilder as never)

    await expect(
      createSession({ name: 'BBQ', creatorName: 'Alice', month: '2026-04-01' })
    ).rejects.toThrow('sessions insert failed')

    expect(localStorage.getItem('local_id:sess1234')).toBeNull()
  })

  it('throws when the participant insert errors', async () => {
    const sessionBuilder = createBuilder({ data: null, error: null })
    const participantBuilder = createBuilder({
      data: null,
      error: new Error('participant insert failed'),
    })
    vi.mocked(supabase.from)
      .mockReturnValueOnce(sessionBuilder as never)
      .mockReturnValueOnce(participantBuilder as never)

    await expect(
      createSession({ name: 'BBQ', creatorName: 'Alice', month: '2026-04-01' })
    ).rejects.toThrow('participant insert failed')
  })
})

describe('getSession', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns session data on success', async () => {
    const builder = createBuilder({
      data: { id: 'ses1', name: 'BBQ' },
      error: null,
    })
    vi.mocked(supabase.from).mockReturnValue(builder as never)

    const result = await getSession('ses1')
    expect(result).toEqual({ id: 'ses1', name: 'BBQ' })
  })

  it('throws when Supabase returns an error', async () => {
    const builder = createBuilder({
      data: null,
      error: new Error('not found'),
    })
    vi.mocked(supabase.from).mockReturnValue(builder as never)

    await expect(getSession('bad-id')).rejects.toThrow('not found')
  })

  it('queries the sessions table with the given id', async () => {
    const builder = createBuilder({ data: { id: 'ses1' }, error: null })
    vi.mocked(supabase.from).mockReturnValue(builder as never)

    await getSession('ses1')

    expect(supabase.from).toHaveBeenCalledWith('sessions')
    expect(builder.eq).toHaveBeenCalledWith('id', 'ses1')
  })
})

describe('getStoredParticipant', () => {
  it('returns null when nothing is stored', () => {
    expect(getStoredParticipant('ses1')).toBeNull()
  })

  it('returns null when only local_id is stored', () => {
    localStorage.setItem('local_id:ses1', 'abc')
    expect(getStoredParticipant('ses1')).toBeNull()
  })

  it('returns null when only participant_id is stored', () => {
    localStorage.setItem('participant_id:ses1', 'uuid-1')
    expect(getStoredParticipant('ses1')).toBeNull()
  })

  it('returns { localId, participantId } when both keys are present', () => {
    localStorage.setItem('local_id:ses1', 'local-abc')
    localStorage.setItem('participant_id:ses1', 'uuid-1')

    const result = getStoredParticipant('ses1')
    expect(result).toEqual({ localId: 'local-abc', participantId: 'uuid-1' })
  })

  it('is scoped to the session — different session returns null', () => {
    localStorage.setItem('local_id:ses1', 'local-abc')
    localStorage.setItem('participant_id:ses1', 'uuid-1')

    expect(getStoredParticipant('ses2')).toBeNull()
  })
})

describe('joinSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(nanoid).mockReturnValue('newlocal12345678')
  })

  it('inserts participant with session_id, name, and local_id', async () => {
    const builder = createBuilder({
      data: { id: 'new-part', name: 'Bob' },
      error: null,
    })
    vi.mocked(supabase.from).mockReturnValue(builder as never)

    await joinSession('ses1', 'Bob')

    expect(builder.insert).toHaveBeenCalledWith({
      session_id: 'ses1',
      name: 'Bob',
      local_id: 'newlocal12345678',
    })
  })

  it('stores local_id and participant_id in localStorage', async () => {
    const builder = createBuilder({
      data: { id: 'new-part', name: 'Bob' },
      error: null,
    })
    vi.mocked(supabase.from).mockReturnValue(builder as never)

    await joinSession('ses1', 'Bob')

    expect(localStorage.getItem('local_id:ses1')).toBe('newlocal12345678')
    expect(localStorage.getItem('participant_id:ses1')).toBe('new-part')
  })

  it('returns the participant object', async () => {
    const builder = createBuilder({
      data: { id: 'new-part', name: 'Bob' },
      error: null,
    })
    vi.mocked(supabase.from).mockReturnValue(builder as never)

    const result = await joinSession('ses1', 'Bob')
    expect(result).toEqual({ id: 'new-part', name: 'Bob' })
  })

  it('throws on Supabase error and does not write localStorage', async () => {
    const builder = createBuilder({
      data: null,
      error: new Error('join failed'),
    })
    vi.mocked(supabase.from).mockReturnValue(builder as never)

    await expect(joinSession('ses1', 'Bob')).rejects.toThrow('join failed')
    expect(localStorage.getItem('participant_id:ses1')).toBeNull()
  })
})
