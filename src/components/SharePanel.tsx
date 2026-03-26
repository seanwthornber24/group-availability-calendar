import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

interface Props {
  sessionId: string
}

export default function SharePanel({ sessionId }: Props) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const url = `${window.location.origin}/session/${sessionId}`

  async function handleCopy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900 rounded-2xl mx-4 mt-4 overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-blue-700 dark:text-blue-300 font-medium text-sm"
        onClick={() => setOpen((v) => !v)}
      >
        <span>📅 Share this session</span>
        <span className="text-xs">{open ? '▲ Hide' : '▼ Show'}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-900 rounded-xl px-3 py-2">
            <span className="text-xs text-gray-600 dark:text-gray-300 truncate flex-1">{url}</span>
            <button
              onClick={handleCopy}
              className="text-blue-600 dark:text-blue-300 text-xs font-medium shrink-0 px-2 py-1 rounded-lg bg-blue-100 dark:bg-blue-900 active:bg-blue-200 dark:active:bg-blue-800"
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
          <div className="flex justify-center">
            <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-blue-200 dark:border-blue-900">
              <QRCodeSVG value={url} size={160} />
            </div>
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400 text-center">
            Copy the link and share with friends or let them scan the QR code to join the session!
          </p>
        </div>
      )}
    </div>
  )
}
