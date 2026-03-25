import { nanoid } from 'nanoid'
import { supabase } from './supabase'

const LOCAL_ID_KEY = (sessionId) => `local_id:${sessionId}`
const PARTICIPANT_KEY = (sessionId) => `participant_id:${sessionId}`

export async function createSession({ name, creatorName, month }) {
  const sessionId = nanoid(8)
  const localId = nanoid(16)

  const { error: sessionError } = await supabase
    .from('sessions')
    .insert({ id: sessionId, name, month })

  if (sessionError) { throw sessionError }

  const { data: participant, error: participantError } = await supabase
    .from('participants')
    .insert({ session_id: sessionId, name: creatorName, local_id: localId })
    .select()
    .single()

  if (participantError) { throw participantError }

  localStorage.setItem(LOCAL_ID_KEY(sessionId), localId)
  localStorage.setItem(PARTICIPANT_KEY(sessionId), participant.id)

  return sessionId
}

export async function getSession(id) {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', id)
    .single()

  if (error) { throw error }
  return data
}

/**
 * Returns { participantId, isNew } for the current user in a session.
 * If a local_id is stored and matches a participant row, returns existing participant.
 * Otherwise returns null (caller should show JoinPrompt).
 */
export function getStoredParticipant(sessionId) {
  const localId = localStorage.getItem(LOCAL_ID_KEY(sessionId))
  const participantId = localStorage.getItem(PARTICIPANT_KEY(sessionId))
  if (localId && participantId) { return { localId, participantId } }
  return null
}

export async function joinSession(sessionId, name) {
  const localId = nanoid(16)

  const { data: participant, error } = await supabase
    .from('participants')
    .insert({ session_id: sessionId, name, local_id: localId })
    .select()
    .single()

  if (error) { throw error }

  localStorage.setItem(LOCAL_ID_KEY(sessionId), localId)
  localStorage.setItem(PARTICIPANT_KEY(sessionId), participant.id)

  return participant
}
