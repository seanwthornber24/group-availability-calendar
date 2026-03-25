import { useState } from 'react'

export default function JoinPrompt({ sessionName, onJoin, loading }) {
  const [name, setName] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (trimmed) { onJoin(trimmed) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Join session</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
          {sessionName ? `"${sessionName}"` : 'Enter your name to get started'}
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Your name or nickname"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            maxLength={30}
            className="border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!name.trim() || loading}
            className="bg-blue-600 text-white rounded-xl px-4 py-3 text-base font-medium disabled:opacity-40 active:bg-blue-700"
          >
            {loading ? 'Joining…' : 'Join'}
          </button>
        </form>
      </div>
    </div>
  )
}
