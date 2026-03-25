import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getSession } from '../lib/session'
import type { Session, Participant } from '../types'

export function useSession(sessionId: string | undefined): {
  session: Session | null
  participants: Participant[]
  loading: boolean
  error: Error | null
} {
  const [session, setSession] = useState<Session | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!sessionId) { return }

    let cancelled = false

    async function load() {
      try {
        const [sessionData, { data: participantsData, error: pErr }] = await Promise.all([
          getSession(sessionId!),
          supabase.from('participants').select('*').eq('session_id', sessionId!),
        ])
        if (pErr) { throw pErr }
        if (!cancelled) {
          setSession(sessionData)
          setParticipants((participantsData ?? []) as Participant[])
          setLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)))
          setLoading(false)
        }
      }
    }

    load()

    const channel = supabase
      .channel(`session-participants-${sessionId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'participants', filter: `session_id=eq.${sessionId}` },
        (payload) => setParticipants((prev) => [...prev, payload.new as Participant])
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'participants', filter: `session_id=eq.${sessionId}` },
        (payload) => setParticipants((prev) => prev.filter((p) => p.id !== (payload.old as { id: string }).id))
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [sessionId])

  return { session, participants, loading, error }
}
