/**
 * user.actions.ts — createLinkToken only.
 *
 * The rest of lib/actions/user.actions.ts is almost entirely Appwrite calls
 * (node-appwrite, undici-based — not interceptable by MSW; see
 * test/msw/README.md), so it isn't covered here. createLinkToken is the
 * one export with no Appwrite dependency at all — it only talks to Plaid —
 * so it's a real MSW target.
 */
import '../../test/msw/setup'
import { HttpResponse, http } from 'msw'
import { server } from '../../test/msw/server'
import { PLAID_BASE } from '../../test/msw/handlers/plaid'

jest.unmock('@/lib/actions/user.actions')

import { createLinkToken } from '@/lib/actions/user.actions'

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

	it('requests an update-mode link token when update + accessToken are given', async () => {
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

		const result = await createLinkToken(testUser, true, 'access-sandbox-1')

		expect(result).toEqual({
			success: true,
			linkToken: 'link-sandbox-update-token',
		})
		expect(capturedBody.access_token).toBe('access-sandbox-1')
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
