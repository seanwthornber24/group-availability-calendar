export default function ParticipantList({ participants, availability, currentParticipantId }) {
  const dayCountById = {}
  availability.forEach(({ participant_id }) => {
    dayCountById[participant_id] = (dayCountById[participant_id] ?? 0) + 1
  })

  const sorted = [...participants].sort((a, b) => {
    // Current user first
    if (a.id === currentParticipantId) { return -1 }
    if (b.id === currentParticipantId) { return 1 }
    return (dayCountById[b.id] ?? 0) - (dayCountById[a.id] ?? 0)
  })

  return (
    <div className="px-4 mt-6 mb-8">
      <h3 className="text-sm font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">
        Participants ({participants.length})
      </h3>
      <div className="flex flex-col gap-2">
        {sorted.map((p) => {
          const count = dayCountById[p.id] ?? 0
          const isMe = p.id === currentParticipantId
          return (
            <div
              key={p.id}
              className={`flex items-center gap-3 p-3 rounded-xl ${
                isMe ? 'bg-blue-50 dark:bg-blue-950 border border-blue-100 dark:border-blue-900' : 'bg-gray-50 dark:bg-gray-800'
              }`}
            >
              <span
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${
                  isMe ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                {p.name[0].toUpperCase()}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {p.name}
                  {isMe && <span className="ml-1 text-xs text-blue-500 dark:text-blue-400">(you)</span>}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {count === 0 ? 'No days marked' : `${count} day${count === 1 ? '' : 's'} free`}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
