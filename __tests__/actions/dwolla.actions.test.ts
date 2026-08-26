import '../../test/msw/setup'
import { HttpResponse, http } from 'msw'
import { server } from '../../test/msw/server'
import { DWOLLA_BASE } from '../../test/msw/handlers/dwolla'
import {
	addFundingSource,
	createDwollaCustomer,
	createFundingSource,
	createOnDemandAuthorization,
	createTransfer,
	getCustomerFundingSource,
	getMasterFundingSource,
} from '@/lib/actions/dwolla.actions'

describe('createDwollaCustomer', () => {
	it('returns the created customer location URL', async () => {
		const result = await createDwollaCustomer({
			firstName: 'Jane',
			lastName: 'Doe',
			email: 'jane@example.com',
			type: 'unverified',
		})

		expect(result).toBe(`${DWOLLA_BASE}/customers/customer-123`)
	})

	it('returns undefined and does not throw when Dwolla rejects the request', async () => {
		server.use(
			http.post(`${DWOLLA_BASE}/customers`, () =>
				HttpResponse.json(
					{ code: 'ValidationError', message: 'Invalid email' },
					{ status: 400 },
				),
			),
		)

		const result = await createDwollaCustomer({
			firstName: 'Jane',
			lastName: 'Doe',
			email: 'not-an-email',
			type: 'unverified',
		})

		expect(result).toBeUndefined()
	})
})

describe('createOnDemandAuthorization', () => {
	it('returns the authorization _links', async () => {
		const result = await createOnDemandAuthorization()
		expect(result).toEqual({
			authorize: { href: `${DWOLLA_BASE}/on-demand-authorizations/auth-123` },
		})
	})

	it('returns undefined when Dwolla fails to grant authorization', async () => {
		server.use(
			http.post(`${DWOLLA_BASE}/on-demand-authorizations`, () =>
				HttpResponse.json({ message: 'server error' }, { status: 500 }),
			),
		)

		const result = await createOnDemandAuthorization()
		expect(result).toBeUndefined()
	})
})

describe('createFundingSource', () => {
	it('returns the created funding source location URL for the given customer', async () => {
		const result = await createFundingSource({
			customerId: 'customer-123',
			fundingSourceName: 'Plaid Checking',
			plaidToken: 'processor-token',
			_links: {},
		})

		expect(result).toBe(
			`${DWOLLA_BASE}/funding-sources/funding-source-for-customer-123`,
		)
	})

	it('returns undefined and does not throw on a Dwolla error', async () => {
		server.use(
			http.post(`${DWOLLA_BASE}/customers/:customerId/funding-sources`, () =>
				HttpResponse.json({ message: 'invalid token' }, { status: 400 }),
			),
		)

		const result = await createFundingSource({
			customerId: 'customer-123',
			fundingSourceName: 'Plaid Checking',
			plaidToken: 'bad-token',
			_links: {},
		})

		expect(result).toBeUndefined()
	})
})

describe('addFundingSource', () => {
	it('obtains an on-demand authorization then creates the funding source', async () => {
		const result = await addFundingSource({
			dwollaCustomerId: 'customer-123',
			processorToken: 'processor-token',
			bankName: 'Plaid Checking',
		})

		expect(result).toBe(
			`${DWOLLA_BASE}/funding-sources/funding-source-for-customer-123`,
		)
	})

	it('returns undefined without creating a funding source when authorization fails', async () => {
		server.use(
			http.post(`${DWOLLA_BASE}/on-demand-authorizations`, () =>
				HttpResponse.json({ message: 'server error' }, { status: 500 }),
			),
			http.post(`${DWOLLA_BASE}/customers/:customerId/funding-sources`, () => {
				throw new Error(
					'createFundingSource should not be called when authorization fails',
				)
			}),
		)

		const result = await addFundingSource({
			dwollaCustomerId: 'customer-123',
			processorToken: 'processor-token',
			bankName: 'Plaid Checking',
		})

		expect(result).toBeUndefined()
	})

	it('returns undefined when the funding source creation itself fails', async () => {
		server.use(
			http.post(`${DWOLLA_BASE}/customers/:customerId/funding-sources`, () =>
				HttpResponse.json({ message: 'duplicate' }, { status: 400 }),
			),
		)

		const result = await addFundingSource({
			dwollaCustomerId: 'customer-123',
			processorToken: 'processor-token',
			bankName: 'Plaid Checking',
		})

		expect(result).toBeUndefined()
	})
})

describe('createTransfer', () => {
	it('returns the created transfer location URL', async () => {
		const result = await createTransfer({
			sourceFundingSourceUrl: `${DWOLLA_BASE}/funding-sources/source-1`,
			destinationFundingSourceUrl: `${DWOLLA_BASE}/funding-sources/dest-1`,
			amount: '25.00',
		})

		expect(result).toBe(`${DWOLLA_BASE}/transfers/transfer-123`)
	})

	it('returns undefined and does not throw when Dwolla rejects the transfer', async () => {
		server.use(
			http.post(`${DWOLLA_BASE}/transfers`, () =>
				HttpResponse.json(
					{
						code: 'ValidationError',
						_embedded: {
							errors: [{ message: 'Insufficient funds' }],
						},
					},
					{ status: 400 },
				),
			),
		)

		const result = await createTransfer({
			sourceFundingSourceUrl: `${DWOLLA_BASE}/funding-sources/source-1`,
			destinationFundingSourceUrl: `${DWOLLA_BASE}/funding-sources/dest-1`,
			amount: '999999.00',
		})

		expect(result).toBeUndefined()
	})
})

describe('getCustomerFundingSource', () => {
	it("returns the customer's first funding source name", async () => {
		const result = await getCustomerFundingSource('customer-123')
		expect(result).toBe('Default Checking Account')
	})

	it('returns undefined when the request fails', async () => {
		server.use(
			http.get(`${DWOLLA_BASE}/customers/:customerId/funding-sources`, () =>
				HttpResponse.json({ message: 'not found' }, { status: 404 }),
			),
		)

		const result = await getCustomerFundingSource('missing-customer')
		expect(result).toBeUndefined()
	})
})

describe('getMasterFundingSource', () => {
	it("returns the master account's first funding source name", async () => {
		const result = await getMasterFundingSource('master-account-id')
		expect(result).toBe('Fortify Master Balance')
	})

	it('returns undefined when the request fails', async () => {
		server.use(
			http.get(`${DWOLLA_BASE}/accounts/:masterId/funding-sources`, () =>
				HttpResponse.json({ message: 'not found' }, { status: 404 }),
			),
		)

		const result = await getMasterFundingSource('missing-master-id')
		expect(result).toBeUndefined()
	})
})
