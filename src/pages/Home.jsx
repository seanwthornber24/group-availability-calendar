import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, addMonths, startOfMonth } from 'date-fns'
import { createSession } from '../lib/session'

export default function Home() {
  const navigate = useNavigate()
  const defaultMonth = format(startOfMonth(addMonths(new Date(), 1)), 'yyyy-MM-dd')

  const [form, setForm] = useState({ name: '', creatorName: '', month: defaultMonth })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const sessionId = await createSession({
        name: form.name.trim(),
        creatorName: form.creatorName.trim(),
        month: form.month,
      })
      navigate(`/session/${sessionId}`)
    } catch (err) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const valid = form.name.trim() && form.creatorName.trim() && form.month

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">📅</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Group Availability</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Find a day that works for everyone — no accounts needed.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Session name
            </label>
            <input
              type="text"
              name="name"
              placeholder="e.g. Summer BBQ"
              value={form.name}
              onChange={handleChange}
              maxLength={60}
              required
              className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Your name
            </label>
            <input
              type="text"
              name="creatorName"
              placeholder="e.g. Alex"
              value={form.creatorName}
              onChange={handleChange}
              maxLength={30}
              required
              className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Month to plan
            </label>
            <input
              type="month"
              name="month"
              value={form.month.slice(0, 7)}
              onChange={(e) => setForm((f) => ({ ...f, month: `${e.target.value}-01` }))}
              required
              className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={!valid || loading}
            className="bg-blue-600 text-white rounded-xl px-4 py-3 text-base font-semibold disabled:opacity-40 active:bg-blue-700 mt-1"
          >
            {loading ? 'Creating…' : 'Create session →'}
          </button>
        </form>
      </div>
    </div>
  )
}
