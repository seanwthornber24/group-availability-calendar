import { format, parseISO } from 'date-fns'
import type { Participant, AvailabilityRow } from '../types'

interface Props {
  date: string | null | undefined
  participants: Participant[]
  availability: AvailabilityRow[]
  currentParticipantId: string | null
  onToggle: (date: string) => void
  onClose: () => void
}

export default function DayDetailSheet({
  date,
  participants,
  availability,
  currentParticipantId,
  onToggle,
  onClose,
}: Props) {
  if (!date) {
    return null
  }

  const freeParticipantIds = new Set(
    availability.filter((a) => a.date === date).map((a) => a.participant_id)
  )

  const freeParticipants = participants.filter((p) => freeParticipantIds.has(p.id))
  const notFreeParticipants = participants.filter((p) => !freeParticipantIds.has(p.id))
  const iAmFree = currentParticipantId ? freeParticipantIds.has(currentParticipantId) : false

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl max-h-[70vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {format(parseISO(date), 'EEEE, d MMMM')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {freeParticipants.length} of {participants.length} free
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 text-2xl leading-none w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            ×
          </button>
        </div>

        {/* Toggle own availability */}
        {currentParticipantId && (
          <div className="px-5 pb-3">
            <button
              onClick={() => onToggle(date)}
              className={`w-full py-3 rounded-xl text-sm font-medium transition-colors ${
                iAmFree
                  ? 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 active:bg-red-100 dark:active:bg-red-900'
                  : 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 active:bg-green-100 dark:active:bg-green-900'
              }`}
            >
              {iAmFree ? '✕ Remove my availability' : '✓ Mark me as free'}
            </button>
          </div>
        )}

        <div className="px-5 pb-6">
          {freeParticipants.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
                Free
              </p>
              <div className="flex flex-col gap-1">
                {freeParticipants.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 py-1">
                    <span className="w-7 h-7 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-sm font-medium text-green-700 dark:text-green-300">
                      {p.name[0].toUpperCase()}
                    </span>
                    <span className="text-gray-800 dark:text-gray-100 text-sm">
                      {p.name}
                      {p.id === currentParticipantId && (
                        <span className="ml-1 text-xs text-gray-400 dark:text-gray-500">(you)</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {notFreeParticipants.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
                Not marked
              </p>
              <div className="flex flex-col gap-1">
                {notFreeParticipants.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 py-1 opacity-40">
                    <span className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm font-medium text-gray-500 dark:text-gray-400">
                      {p.name[0].toUpperCase()}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 text-sm">{p.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
