import { http, HttpResponse } from 'msw'

export const DWOLLA_BASE = 'https://api-sandbox.dwolla.com'

export const dwollaHandlers = [
	http.post(`${DWOLLA_BASE}/token`, () =>
		HttpResponse.json({
			access_token: 'test-dwolla-access-token',
			token_type: 'bearer',
			expires_in: 3600,
			scope: 'Customers Transfers FundingSources',
			account_id: 'test-dwolla-account-id',
		}),
	),

	http.post(
		`${DWOLLA_BASE}/customers`,
		() =>
			new HttpResponse(null, {
				status: 201,
				headers: { Location: `${DWOLLA_BASE}/customers/customer-123` },
			}),
	),

	http.post(`${DWOLLA_BASE}/on-demand-authorizations`, () =>
		HttpResponse.json({
			_links: {
				authorize: {
					href: `${DWOLLA_BASE}/on-demand-authorizations/auth-123`,
				},
			},
		}),
	),

	http.post(
		`${DWOLLA_BASE}/customers/:customerId/funding-sources`,
		({ params }) =>
			new HttpResponse(null, {
				status: 201,
				headers: {
					Location: `${DWOLLA_BASE}/funding-sources/funding-source-for-${params.customerId}`,
				},
			}),
	),

	http.get(`${DWOLLA_BASE}/customers/:customerId/funding-sources`, () =>
		HttpResponse.json({
			_embedded: {
				'funding-sources': [{ name: 'Default Checking Account' }],
			},
		}),
	),

	http.get(`${DWOLLA_BASE}/accounts/:masterId/funding-sources`, () =>
		HttpResponse.json({
			_embedded: {
				'funding-sources': [{ name: 'Fortify Master Balance' }],
			},
		}),
	),

	http.post(
		`${DWOLLA_BASE}/transfers`,
		() =>
			new HttpResponse(null, {
				status: 201,
				headers: { Location: `${DWOLLA_BASE}/transfers/transfer-123` },
			}),
	),
]
