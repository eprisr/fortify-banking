import { NotificationPreferencesList } from '@/components/notifications/NotificationPreferencesList'
import HeaderBox from '@/components/shared/HeaderBox'

const NotificationPreferences = () => {
	return (
		<div className="flex flex-col gap-6">
			<HeaderBox title="Notifications" subtext="" />
			<NotificationPreferencesList />
		</div>
	)
}

export default NotificationPreferences
