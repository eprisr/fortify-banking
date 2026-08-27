/**
 * lib/plaid.ts — environment resolution only.
 *
 * Regression test for a real bug fixed previously (see plaid_oauth_status
 * memory): `basePath` was a template literal —
 * `` `PlaidEnvironments.${process.env.PLAID_ENV}` `` — producing the
 * literal string "PlaidEnvironments.sandbox", not a real URL. PLAID_ENV was
 * effectively dead: the app always talked to Plaid's sandbox regardless of
 * the env var's value.
 *
 * This can't test the other half of that memory's open item — actually
 * running against real Plaid *production* credentials — that needs a real
 * approved Plaid production account, which this project doesn't have. What
 * it can and does verify: PLAID_ENV=production genuinely configures the
 * client to point at Plaid's real production API host, not silently stay
 * on sandbox. That's the actual code-level risk; hitting the real host is
 * an infrastructure/credentials concern outside what a test can cover.
 *
 * plaidClient is a module-level singleton — its config is resolved once,
 * at import time, from process.env.PLAID_ENV — so each case here resets
 * the module registry and re-imports fresh after setting the env var, the
 * standard pattern for testing env-driven singleton initialization.
 */

const ORIGINAL_PLAID_ENV = process.env.PLAID_ENV

afterEach(() => {
	if (ORIGINAL_PLAID_ENV === undefined) {
		delete process.env.PLAID_ENV
	} else {
		process.env.PLAID_ENV = ORIGINAL_PLAID_ENV
	}
})

describe('lib/plaid.ts — PLAID_ENV resolution', () => {
	it('points at Plaid production when PLAID_ENV=production', async () => {
		jest.resetModules()
		process.env.PLAID_ENV = 'production'

		const { plaidClient } = await import('@/lib/plaid')

		// basePath/configuration are `protected` in the SDK's types (no public
		// getter exists) but are plain runtime properties — TS doesn't erase
		// them, so this is the only way to introspect what was actually
		// configured without making a real network call.
		expect((plaidClient as any).basePath).toBe('https://production.plaid.com')
	})

	it('defaults to Plaid sandbox for any other PLAID_ENV value', async () => {
		jest.resetModules()
		process.env.PLAID_ENV = 'not-a-real-environment'

		const { plaidClient } = await import('@/lib/plaid')

		expect((plaidClient as any).basePath).toBe('https://sandbox.plaid.com')
	})

	it('defaults to Plaid sandbox when PLAID_ENV is unset', async () => {
		jest.resetModules()
		delete process.env.PLAID_ENV

		const { plaidClient } = await import('@/lib/plaid')

		expect((plaidClient as any).basePath).toBe('https://sandbox.plaid.com')
	})

	it('sends PLAID-CLIENT-ID and PLAID-SECRET headers from the environment either way', async () => {
		jest.resetModules()
		process.env.PLAID_ENV = 'production'
		process.env.PLAID_CLIENT_ID = 'test-client-id'
		process.env.PLAID_SECRET = 'test-secret'

		const { plaidClient } = await import('@/lib/plaid')

		const headers = (plaidClient as any).configuration?.baseOptions?.headers
		expect(headers).toMatchObject({
			'PLAID-CLIENT-ID': 'test-client-id',
			'PLAID-SECRET': 'test-secret',
		})
	})
})
