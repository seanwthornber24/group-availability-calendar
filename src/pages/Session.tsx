import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useSession } from '../hooks/useSession'
import { useAvailability } from '../hooks/useAvailability'
import { getStoredParticipant, joinSession } from '../lib/session'
import { toggleAvailability } from '../lib/availability'
import JoinPrompt from '../components/JoinPrompt'
import SharePanel from '../components/SharePanel'
import Calendar from '../components/Calendar'
import DayDetailSheet from '../components/DayDetailSheet'
import ParticipantList from '../components/ParticipantList'

export default function Session() {
  const { id } = useParams()
  const { session, participants, loading, error } = useSession(id)
  const { availability } = useAvailability(id)

  const [currentParticipantId, setCurrentParticipantId] = useState<string | null>(null)
  const [joining, setJoining] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  // On mount check localStorage for existing participant
  useEffect(() => {
    const stored = getStoredParticipant(id ?? '')
    if (stored) {
      setCurrentParticipantId(stored.participantId)
    }
  }, [id])

  async function handleJoin(name: string) {
    setJoining(true)
    try {
      const participant = await joinSession(id!, name)
      setCurrentParticipantId(participant.id)
    } catch (err) {
      console.error('Join failed', err)
    } finally {
      setJoining(false)
    }
  }

  async function handleToggle(date: string) {
    if (!currentParticipantId) {
      return
    }
    try {
      await toggleAvailability(id!, currentParticipantId, date)
    } catch (err) {
      console.error('Toggle failed', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <p className="text-gray-400 dark:text-gray-500">Loading session…</p>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-6">
        <div className="text-center">
          <p className="text-2xl mb-2">🤔</p>
          <p className="text-gray-600 dark:text-gray-300 font-medium">Session not found</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
            This link may be invalid or expired.
          </p>
          <a
            href="/"
            className="mt-4 inline-block text-blue-600 dark:text-blue-400 text-sm underline"
          >
            Create a new session
          </a>
        </div>
      </div>
    )
  }

  const showJoinPrompt = !currentParticipantId

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 max-w-lg mx-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 z-10">
        <h1 className="text-base font-semibold text-gray-900 dark:text-white truncate">
          {session.name}
        </h1>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {participants.length} participant{participants.length !== 1 ? 's' : ''}
        </p>
      </div>

      <SharePanel sessionId={id!} />

      <Calendar
        month={session.month}
        participants={participants}
        availability={availability}
        currentParticipantId={currentParticipantId}
        onDayTap={setSelectedDate}
      />

      <ParticipantList
        participants={participants}
        availability={availability}
        currentParticipantId={currentParticipantId}
      />

      <DayDetailSheet
        date={selectedDate}
        participants={participants}
        availability={availability}
        currentParticipantId={currentParticipantId}
        onToggle={handleToggle}
        onClose={() => setSelectedDate(null)}
      />

      {showJoinPrompt && (
        <JoinPrompt sessionName={session.name} onJoin={handleJoin} loading={joining} />
      )}
    </div>
  )
}
