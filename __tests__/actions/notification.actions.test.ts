/**
 * lib/actions/notification.actions.ts
 *
 * Same approach as user.actions.transfer.test.ts: mock one layer below
 * (createAdminClient/createSessionClient, next/headers) so the real
 * notify/getNotifications/getUnreadNotificationCount/markAllNotificationsRead
 * run against a fake Appwrite table, rather than mocking this module itself.
 * markAllNotificationsRead additionally goes through the real
 * getLoggedInUser (a cross-module import from user.actions.ts), so it needs
 * the same session/cookie mocking as that module's own tests.
 */
jest.mock('next/headers', () => ({ cookies: jest.fn() }))

jest.mock('@/lib/server/appwrite', () => ({
	createAdminClient: jest.fn(),
	createSessionClient: jest.fn(),
}))

// jest.setup.tsx globally jest.mocks this module (for the component test
// suite's benefit) — undo that here so markAllNotificationsRead's real
// getLoggedInUser call runs, per the same pattern as
// user.actions.transfer.test.ts.
jest.unmock('@/lib/actions/user.actions')

import { cookies } from 'next/headers'
import {
	getNotifications,
	getUnreadNotificationCount,
	markAllNotificationsRead,
	notify,
} from '@/lib/actions/notification.actions'
import { createAdminClient, createSessionClient } from '@/lib/server/appwrite'

const mockCookies = cookies as unknown as jest.Mock
const mockCreateAdminClient = createAdminClient as jest.Mock
const mockCreateSessionClient = createSessionClient as jest.Mock

const loggedInUserRow = {
	$id: 'user-1',
	userId: 'user-1',
	email: 'jane@example.com',
	firstName: 'Jane',
	lastName: 'Doe',
}

/** Signs in as loggedInUserRow, backed by a fake Appwrite table for the
 * getUserInfo lookup getLoggedInUser makes internally. */
function signIn() {
	mockCookies.mockResolvedValue({ get: jest.fn().mockReturnValue(undefined) })
	mockCreateSessionClient.mockResolvedValue({
		account: {
			get: jest
				.fn()
				.mockResolvedValue({ $id: 'user-1', emailVerification: true, mfa: false }),
		},
	})
}

function mockTable(overrides: {
	listRows?: jest.Mock
	createRow?: jest.Mock
	updateRows?: jest.Mock
}) {
	const listRows =
		overrides.listRows ??
		jest.fn().mockResolvedValue({ rows: [loggedInUserRow], total: 1 })
	const createRow = overrides.createRow ?? jest.fn().mockResolvedValue({})
	const updateRows = overrides.updateRows ?? jest.fn().mockResolvedValue({})
	mockCreateAdminClient.mockResolvedValue({
		table: { listRows, createRow, updateRows },
	})
	return { listRows, createRow, updateRows }
}

beforeEach(() => {
	jest.clearAllMocks()
})

describe('notify', () => {
	it('creates a row with read:false and a channel default of in_app', async () => {
		const { createRow } = mockTable({})

		const result = await notify({
			userId: 'user-2',
			type: 'welcome',
			title: 'Welcome to Fortify',
			body: "Here's a quick look at what you can do first.",
		})

		expect(result).toEqual({ success: true, data: null })
		expect(createRow).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					userId: 'user-2',
					type: 'welcome',
					channel: 'in_app',
					read: false,
				}),
				permissions: ['read("user:user-2")'],
			}),
		)
	})

	it('respects an explicit channel override', async () => {
		const { createRow } = mockTable({})

		await notify({
			userId: 'user-2',
			type: 'security_mfa',
			title: 'x',
			body: 'y',
			channel: 'push',
		})

		expect(createRow).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({ channel: 'push' }),
			}),
		)
	})

	it('reports failure instead of throwing when the write fails', async () => {
		mockTable({ createRow: jest.fn().mockRejectedValue(new Error('down')) })

		const result = await notify({
			userId: 'user-2',
			type: 'welcome',
			title: 'x',
			body: 'y',
		})

		expect(result).toEqual({
			success: false,
			error: 'Failed to create notification',
		})
	})
})

describe('getNotifications', () => {
	it("queries by the given user's id, most recent first", async () => {
		const rows = [{ $id: 'n-1' }, { $id: 'n-2' }]
		const { listRows } = mockTable({
			listRows: jest.fn().mockResolvedValue({ rows, total: 2 }),
		})

		const result = await getNotifications({ userId: 'user-2' })

		expect(result).toEqual({ success: true, data: rows })
		expect(listRows).toHaveBeenCalledWith(
			expect.objectContaining({
				queries: expect.arrayContaining([
					expect.stringContaining('"attribute":"userId"'),
				]),
			}),
		)
	})

	it('reports failure instead of throwing when the query fails', async () => {
		mockTable({ listRows: jest.fn().mockRejectedValue(new Error('down')) })

		const result = await getNotifications({ userId: 'user-2' })

		expect(result.success).toBe(false)
	})
})

describe('getUnreadNotificationCount', () => {
	it('returns the total of unread rows for the user', async () => {
		mockTable({
			listRows: jest.fn().mockResolvedValue({ rows: [{}], total: 3 }),
		})

		const result = await getUnreadNotificationCount({ userId: 'user-2' })

		expect(result).toEqual({ success: true, data: 3 })
	})
})

describe('markAllNotificationsRead', () => {
	it("resolves the caller from the session and updates only their unread rows", async () => {
		signIn()
		const { updateRows } = mockTable({})

		const result = await markAllNotificationsRead()

		expect(result).toEqual({ success: true, data: null })
		expect(updateRows).toHaveBeenCalledWith(
			expect.objectContaining({
				data: { read: true },
				queries: expect.arrayContaining([
					expect.stringContaining('"user-1"'),
					expect.stringContaining('"attribute":"read"'),
				]),
			}),
		)
	})

	it('fails when there is no signed-in session, rather than defaulting to some user', async () => {
		mockCookies.mockResolvedValue({ get: jest.fn().mockReturnValue(undefined) })
		mockCreateSessionClient.mockRejectedValue(new Error('No session'))

		const result = await markAllNotificationsRead()

		expect(result.success).toBe(false)
	})
})
