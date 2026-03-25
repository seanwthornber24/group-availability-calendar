import { vi } from 'vitest'

/**
 * Creates a chainable Supabase query builder mock.
 *
 * All query methods (select, insert, delete, eq, filter) return `this`
 * so the full builder chain can be used.
 *
 * Terminal methods (single, maybeSingle) resolve with `defaultResult`.
 *
 * The builder itself is thenable so that patterns like:
 *   `await supabase.from('x').delete().eq('id', val)`
 * work without an explicit terminal call.
 *
 * @param {object} defaultResult - the { data, error } the builder resolves to
 */
export function createBuilder(defaultResult = { data: null, error: null }) {
  const builder = {
    select: vi.fn(),
    insert: vi.fn(),
    delete: vi.fn(),
    update: vi.fn(),
    eq: vi.fn(),
    filter: vi.fn(),
    single: vi.fn(() => Promise.resolve(defaultResult)),
    maybeSingle: vi.fn(() => Promise.resolve(defaultResult)),
    // Makes the builder awaitable: await builder.delete().eq(...)
    then: (resolve, reject) => Promise.resolve(defaultResult).then(resolve, reject),
    catch: (reject) => Promise.resolve(defaultResult).catch(reject),
  }

  builder.select.mockReturnValue(builder)
  builder.insert.mockReturnValue(builder)
  builder.delete.mockReturnValue(builder)
  builder.update.mockReturnValue(builder)
  builder.eq.mockReturnValue(builder)
  builder.filter.mockReturnValue(builder)

  return builder
}

/**
 * Creates a mock Supabase Realtime channel.
 *
 * Callbacks passed to `.on()` are keyed by `filter.event` so tests can
 * trigger INSERT/DELETE events independently via `channel._trigger(event, payload)`.
 */
export function createChannelMock() {
  const callbacks = {}
  const channel = {
    on: vi.fn().mockImplementation((_type, filter, cb) => {
      callbacks[filter.event] = cb
      return channel
    }),
    subscribe: vi.fn().mockReturnThis(),
    /** Simulate a realtime event arriving from Supabase */
    _trigger(event, payload) {
      callbacks[event]?.(payload)
    },
  }
  return channel
}
