import { NotificationsList } from '@/components/notifications/NotificationsList'
import { getLoggedInUser } from '@/lib/actions/user.actions'

const Notifications = async () => {
	const loggedIn = await getLoggedInUser()

	return <NotificationsList showMfaNotification={!loggedIn?.mfa} />
}

export default Notifications
