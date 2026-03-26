import { useMemo } from 'react'
import { startOfMonth, endOfMonth, eachDayOfInterval, format, getDay } from 'date-fns'
import DayCell from './DayCell'
import { computeMyDays, computeFreeCountByDate, computeMaxFree } from '../lib/calendarUtils'
import type { Participant, AvailabilityRow } from '../types'

interface Props {
  month: string
  participants: Participant[]
  availability: AvailabilityRow[]
  currentParticipantId: string | null
  onDayTap: (date: string) => void
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function Calendar({
  month,
  participants,
  availability,
  currentParticipantId,
  onDayTap,
}: Props) {
  const days = useMemo(() => {
    const start = startOfMonth(new Date(month))
    const end = endOfMonth(start)
    return eachDayOfInterval({ start, end })
  }, [month])

  const myDays = useMemo(
    () => computeMyDays(availability, currentParticipantId),
    [availability, currentParticipantId]
  )

  const freeCountByDate = useMemo(() => computeFreeCountByDate(availability), [availability])

  const maxFree = useMemo(() => computeMaxFree(freeCountByDate), [freeCountByDate])

  const totalParticipants = participants.length
  const firstDayOffset = getDay(startOfMonth(new Date(month)))

  return (
    <div className="px-4 mt-4">
      <h2 className="text-center font-semibold text-gray-700 dark:text-gray-200 mb-3 text-lg">
        {format(new Date(month), 'MMMM yyyy')}
      </h2>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="text-center text-xs font-medium text-gray-400 dark:text-gray-500 py-1"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDayOffset }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const freeCount = freeCountByDate[dateStr] ?? 0
          return (
            <DayCell
              key={dateStr}
              date={dateStr}
              freeCount={freeCount}
              totalParticipants={totalParticipants}
              isMyDay={myDays.has(dateStr)}
              isBest={maxFree > 0 && freeCount === maxFree}
              onTap={onDayTap}
            />
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-4 justify-center mt-4 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-green-500 inline-block" /> All free
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-amber-400 inline-block" /> Most free
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm ring-2 ring-blue-500 inline-block" /> Your pick
        </span>
      </div>
    </div>
  )
}
