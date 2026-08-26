import { http, HttpResponse } from 'msw'

export const PLAID_BASE = 'https://sandbox.plaid.com'

export const plaidHandlers = [
	http.post(`${PLAID_BASE}/accounts/get`, () =>
		HttpResponse.json({
			accounts: [
				{
					account_id: 'plaid-account-1',
					balances: { available: 950.5, current: 1000, limit: null },
					mask: '0000',
					name: 'Plaid Checking',
					official_name: 'Plaid Gold Standard 0% Interest Checking',
					subtype: 'checking',
					type: 'depository',
				},
			],
			item: { institution_id: 'ins_109508' },
			request_id: 'req-accounts-get',
		}),
	),

	http.post(`${PLAID_BASE}/institutions/get_by_id`, () =>
		HttpResponse.json({
			institution: {
				institution_id: 'ins_109508',
				name: 'First Platypus Bank',
			},
			request_id: 'req-institutions-get',
		}),
	),

	http.post(`${PLAID_BASE}/transactions/sync`, () =>
		HttpResponse.json({
			added: [],
			modified: [],
			removed: [],
			next_cursor: 'cursor-1',
			has_more: false,
			request_id: 'req-transactions-sync',
		}),
	),

	http.post(`${PLAID_BASE}/link/token/create`, () =>
		HttpResponse.json({
			link_token: 'link-sandbox-test-token',
			expiration: '2026-12-31T00:00:00Z',
			request_id: 'req-link-token-create',
		}),
	),

	http.post(`${PLAID_BASE}/item/public_token/exchange`, () =>
		HttpResponse.json({
			access_token: 'access-sandbox-test-token',
			item_id: 'item-sandbox-test-id',
			request_id: 'req-item-exchange',
		}),
	),

	http.post(`${PLAID_BASE}/processor/token/create`, () =>
		HttpResponse.json({
			processor_token: 'processor-sandbox-test-token',
			request_id: 'req-processor-token-create',
		}),
	),

	http.post(`${PLAID_BASE}/transfer/authorization/create`, () =>
		HttpResponse.json({
			authorization: { id: 'transfer-auth-123', decision: 'approved' },
			request_id: 'req-transfer-auth-create',
		}),
	),

	http.post(`${PLAID_BASE}/transfer/create`, () =>
		HttpResponse.json({
			transfer: { id: 'transfer-123', status: 'pending' },
			request_id: 'req-transfer-create',
		}),
	),
]
