'use server'

import { ID, Permission, Query, Role } from 'node-appwrite'
import { createAdminClient } from '../server/appwrite'
import { parseStringify } from '../utils'
import { getLoggedInUser } from './user.actions'

const {
	APPWRITE_DATABASE_ID: DATABASE_ID,
	APPWRITE_NOTIFICATION_COLLECTION_ID: NOTIFICATION_COLLECTION_ID,
} = process.env

export const notify = async ({
	userId,
	type,
	title,
	body,
	actionHref,
	actionLabel,
	channel = 'in_app',
}: NotifyParams): Promise<ActionResponse<null>> => {
	try {
		const { table } = await createAdminClient()

		await table.createRow({
			databaseId: DATABASE_ID!,
			tableId: NOTIFICATION_COLLECTION_ID!,
			rowId: ID.unique(),
			data: {
				userId,
				type,
				channel,
				title,
				body,
				actionHref,
				actionLabel,
				read: false,
			},
			permissions: [Permission.read(Role.user(userId))],
		})

		return { success: true, data: null }
	} catch (error) {
		console.error('Notify Error: ', error)
		return { success: false, error: 'Failed to create notification' }
	}
}

export const getNotifications = async ({
	userId,
}: {
	userId: string
}): Promise<ActionResponse<AppNotification[]>> => {
	try {
		const { table } = await createAdminClient()
		const notifications = await table.listRows({
			databaseId: DATABASE_ID!,
			tableId: NOTIFICATION_COLLECTION_ID!,
			queries: [
				Query.equal('userId', [userId]),
				Query.orderDesc('$createdAt'),
				Query.limit(50),
			],
		})

		return { success: true, data: parseStringify(notifications.rows) }
	} catch (error: any) {
		console.error('Get Notifications Error: ', error)
		return {
			success: false,
			error: error?.message || 'Failed to load notifications',
		}
	}
}

export const getUnreadNotificationCount = async ({
	userId,
}: {
	userId: string
}): Promise<ActionResponse<number>> => {
	try {
		const { table } = await createAdminClient()
		const unread = await table.listRows({
			databaseId: DATABASE_ID!,
			tableId: NOTIFICATION_COLLECTION_ID!,
			queries: [
				Query.equal('userId', [userId]),
				Query.equal('read', [false]),
				Query.limit(1),
			],
		})

		return { success: true, data: unread.total }
	} catch (error: any) {
		console.error('Get Unread Notification Count Error: ', error)
		return {
			success: false,
			error: error?.message || 'Failed to load notification count',
		}
	}
}

export const resolveNotificationsByType = async ({
	userId,
	type,
}: {
	userId: string
	type: string
}): Promise<ActionResponse<null>> => {
	try {
		const { table } = await createAdminClient()
		await table.updateRows({
			databaseId: DATABASE_ID!,
			tableId: NOTIFICATION_COLLECTION_ID!,
			data: { read: true },
			queries: [
				Query.equal('userId', [userId]),
				Query.equal('type', [type]),
				Query.equal('read', [false]),
			],
		})

		return { success: true, data: null }
	} catch (error: any) {
		console.error('Resolve Notifications Error: ', error)
		return {
			success: false,
			error: error?.message || 'Failed to update notifications',
		}
	}
}

export const markAllNotificationsRead = async (): Promise<
	ActionResponse<null>
> => {
	try {
		const loggedIn = await getLoggedInUser()
		if (!loggedIn) throw new Error('Not signed in')

		const { table } = await createAdminClient()
		await table.updateRows({
			databaseId: DATABASE_ID!,
			tableId: NOTIFICATION_COLLECTION_ID!,
			data: { read: true },
			queries: [
				Query.equal('userId', [loggedIn.$id]),
				Query.equal('read', [false]),
			],
		})

		return { success: true, data: null }
	} catch (error: any) {
		console.error('Mark Notifications Read Error: ', error)
		return {
			success: false,
			error: error?.message || 'Failed to update notifications',
		}
	}
}
