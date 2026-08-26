/**
 * Side-effect import: wires the MSW node server into Jest's lifecycle.
 * Import this once at the top of any test file that exercises code hitting
 * Plaid or Dwolla over HTTP.
 *
 * `onUnhandledRequest: 'error'` is deliberate for a banking app test suite —
 * an un-mocked request should fail the test loudly, not silently fall
 * through to a real network call.
 */
import { server } from './server'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
