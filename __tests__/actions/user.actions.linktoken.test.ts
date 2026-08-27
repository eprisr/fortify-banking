/**
 * user.actions.ts — createLinkToken only.
 *
 * The rest of lib/actions/user.actions.ts is almost entirely Appwrite calls
 * (node-appwrite, undici-based — not interceptable by MSW; see
 * test/msw/README.md), so it isn't covered here. createLinkToken's non-update
 * path has no Appwrite dependency at all — real Plaid via MSW is enough.
 * The update-mode path does need one Appwrite lookup (resolving the bank's
 * access token server-side from its appwriteItemId — see
 * component_fixes_deferred / the update-mode fix), so that's mocked at
 * createAdminClient, same pattern as user.actions.transfer.test.ts.
 */
import '../../test/msw/setup'
import { HttpResponse, http } from 'msw'
import { server } from '../../test/msw/server'
import { PLAID_BASE } from '../../test/msw/handlers/plaid'

jest.mock('@/lib/server/appwrite', () => ({
	createAdminClient: jest.fn(),
	createSessionClient: jest.fn(),
}))

jest.unmock('@/lib/actions/user.actions')

import { createLinkToken } from '@/lib/actions/user.actions'
import { createAdminClient } from '@/lib/server/appwrite'

const mockCreateAdminClient = createAdminClient as jest.Mock

const testUser: User = {
	$id: 'user-123',
	email: 'jane@example.com',
	userId: 'user-123',
	dwollaCustomerUrl: 'https://api-sandbox.dwolla.com/customers/customer-123',
	dwollaCustomerId: 'customer-123',
	firstName: 'Jane',
	lastName: 'Doe',
	name: 'Jane Doe',
	address1: '',
	city: '',
	state: '',
	postalCode: '',
	dateOfBirth: '',
	ssn: '',
}

describe('createLinkToken', () => {
	it('returns a link token for a new (non-update) Link session', async () => {
		const result = await createLinkToken(testUser)
		expect(result).toEqual({
			success: true,
			linkToken: 'link-sandbox-test-token',
		})
	})

	it('requests an update-mode link token, resolving the access token server-side from appwriteItemId', async () => {
		const listRows = jest.fn().mockResolvedValue({
			rows: [{ $id: 'bank-doc-1', accessToken: 'access-sandbox-1' }],
			total: 1,
		})
		mockCreateAdminClient.mockResolvedValue({ table: { listRows } })

		let capturedBody: any
		server.use(
			http.post(`${PLAID_BASE}/link/token/create`, async ({ request }) => {
				capturedBody = await request.json()
				return HttpResponse.json({
					link_token: 'link-sandbox-update-token',
					expiration: '2026-12-31T00:00:00Z',
					request_id: 'req-link-token-create',
				})
			}),
		)

		const result = await createLinkToken(testUser, true, 'bank-doc-1')

		expect(result).toEqual({
			success: true,
			linkToken: 'link-sandbox-update-token',
		})
		expect(capturedBody.access_token).toBe('access-sandbox-1')
	})

	it('falls back to a plain (non-update) session when update is true but no appwriteItemId is given', async () => {
		let capturedBody: any
		server.use(
			http.post(`${PLAID_BASE}/link/token/create`, async ({ request }) => {
				capturedBody = await request.json()
				return HttpResponse.json({
					link_token: 'link-sandbox-test-token',
					expiration: '2026-12-31T00:00:00Z',
					request_id: 'req-link-token-create',
				})
			}),
		)

		const result = await createLinkToken(testUser, true)

		expect(result).toEqual({
			success: true,
			linkToken: 'link-sandbox-test-token',
		})
		expect(capturedBody.access_token).toBeUndefined()
	})

	it('returns a friendly error and does not throw when the bank document is not found', async () => {
		const listRows = jest.fn().mockResolvedValue({ rows: [], total: 0 })
		mockCreateAdminClient.mockResolvedValue({ table: { listRows } })

		const result = await createLinkToken(testUser, true, 'missing-bank-doc')

		expect(result).toEqual({
			success: false,
			error: 'Could not initialize bank connection',
		})
	})

	it('returns a friendly error and does not throw when Plaid rejects the request', async () => {
		server.use(
			http.post(`${PLAID_BASE}/link/token/create`, () =>
				HttpResponse.json({ error_code: 'INVALID_FIELD' }, { status: 400 }),
			),
		)

		const result = await createLinkToken(testUser)

		expect(result).toEqual({
			success: false,
			error: 'Could not initialize bank connection',
		})
	})
})

describe('createLinkToken — redirect_uri construction', () => {
	const ORIGINAL_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL

	afterEach(() => {
		if (ORIGINAL_SITE_URL === undefined) {
			delete process.env.NEXT_PUBLIC_SITE_URL
		} else {
			process.env.NEXT_PUBLIC_SITE_URL = ORIGINAL_SITE_URL
		}
	})

	it('matches the actual registered Plaid Dashboard redirect URI for production', async () => {
		process.env.NEXT_PUBLIC_SITE_URL =
			'https://fortify-banking-eight.vercel.app'

		let capturedBody: any
		server.use(
			http.post(`${PLAID_BASE}/link/token/create`, async ({ request }) => {
				capturedBody = await request.json()
				return HttpResponse.json({
					link_token: 'link-sandbox-test-token',
					expiration: '2026-12-31T00:00:00Z',
					request_id: 'req-link-token-create',
				})
			}),
		)

		await createLinkToken(testUser)

		expect(capturedBody.redirect_uri).toBe(
			'https://fortify-banking-eight.vercel.app/oauth',
		)
	})

	it('would break silently on a trailing slash — documents the landmine, not a fix', async () => {
		process.env.NEXT_PUBLIC_SITE_URL =
			'https://fortify-banking-eight.vercel.app/'

		let capturedBody: any
		server.use(
			http.post(`${PLAID_BASE}/link/token/create`, async ({ request }) => {
				capturedBody = await request.json()
				return HttpResponse.json({
					link_token: 'link-sandbox-test-token',
					expiration: '2026-12-31T00:00:00Z',
					request_id: 'req-link-token-create',
				})
			}),
		)

		await createLinkToken(testUser)

		// Not what's registered in the Dashboard — a real Link session built
		// from this would be rejected by Plaid at OAuth-redirect time.
		expect(capturedBody.redirect_uri).toBe(
			'https://fortify-banking-eight.vercel.app//oauth',
		)
	})
})
