import '@testing-library/jest-dom'
import { vi, afterEach } from 'vitest'

// Stub clipboard API (jsdom doesn't implement it)
Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: vi.fn().mockResolvedValue(undefined) },
  configurable: true,
  writable: true,
})

// Clear localStorage between tests to prevent state leakage
afterEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
})
