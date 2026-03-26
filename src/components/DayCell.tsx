import { format, startOfToday } from 'date-fns'
import { getDayCellStatus } from '../lib/calendarUtils'

interface Props {
  date: string
  freeCount: number
  totalParticipants: number
  isMyDay: boolean
  isBest: boolean
  onTap: (date: string) => void
}

export default function DayCell({
  date,
  freeCount,
  totalParticipants,
  isMyDay,
  isBest,
  onTap,
}: Props) {
  // Compare date strings (yyyy-MM-dd) — timezone-safe: no parseISO needed
  const todayStr = format(startOfToday(), 'yyyy-MM-dd')
  const isPast = date < todayStr

  const { bg, textColor } = getDayCellStatus(freeCount, totalParticipants, isPast)

  // Parse day number directly from the date string to avoid timezone ambiguity
  const day = parseInt(date.slice(8, 10), 10)

  return (
    <button
      onClick={() => !isPast && onTap(date)}
      disabled={isPast}
      className={`
        relative flex flex-col items-center justify-center rounded-xl
        min-h-[52px] w-full select-none transition-transform
        ${bg} ${textColor}
        ${isPast ? 'cursor-default' : 'active:scale-95 cursor-pointer'}
        ${isMyDay && !isPast ? 'ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-gray-950' : ''}
      `}
      aria-label={`${date}${freeCount > 0 ? `, ${freeCount} free` : ''}`}
    >
      <span className="text-base font-semibold leading-none">{day}</span>
      {!isPast && freeCount > 0 && (
        <span className="text-[10px] leading-none mt-0.5 opacity-80">
          {freeCount}/{totalParticipants}
        </span>
      )}
      {isBest && !isPast && <span className="absolute -top-1 -right-1 text-[10px]">⭐</span>}
    </button>
  )
}
