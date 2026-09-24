import { NotificationsList } from '@/components/notifications/NotificationsList'
import { getNotifications } from '@/lib/actions/notification.actions'
import { getLoggedInUser } from '@/lib/actions/user.actions'

const Notifications = async () => {
	const loggedIn = await getLoggedInUser()
	const result = loggedIn
		? await getNotifications({ userId: loggedIn.$id })
		: null

	return (
		<NotificationsList notifications={result?.success ? result.data : []} />
	)
}

export default Notifications
