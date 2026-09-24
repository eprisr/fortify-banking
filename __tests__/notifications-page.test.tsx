import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import Notifications from '@/app/(root)/(no-nav)/notifications/page'
import PreferencesPage from '@/app/(root)/(no-nav)/notifications/preferences/page'
import { getLoggedInUser } from '@/lib/actions/user.actions'
import { getNotifications } from '@/lib/actions/notification.actions'

jest.mock('next/navigation', () => ({ useRouter: () => ({ back: jest.fn(), refresh: jest.fn() }) }))

jest.mock('@/lib/actions/user.actions', () => ({
	getLoggedInUser: jest.fn(),
}))

jest.mock('@/lib/actions/notification.actions', () => ({
	getNotifications: jest.fn(),
	markAllNotificationsRead: jest.fn(),
}))

const welcomeNotification: AppNotification = {
	$id: 'notif-1',
	$createdAt: new Date().toISOString(),
	userId: 'user-1',
	type: 'welcome',
	channel: 'in_app',
	title: 'Welcome to Fortify',
	body: "Here's a quick look at what you can do first.",
	read: false,
}

beforeEach(() => {
	jest.clearAllMocks()
})

describe('Notifications page', () => {
	it("fetches and renders the user's real notifications", async () => {
		;(getLoggedInUser as jest.Mock).mockResolvedValue({ $id: 'user-1' })
		;(getNotifications as jest.Mock).mockResolvedValue({
			success: true,
			data: [welcomeNotification],
		})

		render(await Notifications())

		expect(screen.getByText('Welcome to Fortify')).toBeInTheDocument()
		expect(getNotifications).toHaveBeenCalledWith({ userId: 'user-1' })
	})

	it('renders an empty list rather than crashing when the fetch fails', async () => {
		;(getLoggedInUser as jest.Mock).mockResolvedValue({ $id: 'user-1' })
		;(getNotifications as jest.Mock).mockResolvedValue({
			success: false,
			error: 'boom',
		})

		render(await Notifications())

		expect(screen.getByText('Notifications')).toBeInTheDocument()
	})

	it('renders an empty list rather than crashing when there is no logged-in user', async () => {
		;(getLoggedInUser as jest.Mock).mockResolvedValue(null)

		render(await Notifications())

		expect(screen.getByText('Notifications')).toBeInTheDocument()
		expect(getNotifications).not.toHaveBeenCalled()
	})
})

describe('Notification preferences page', () => {
	it('renders the preferences list under a "Notifications" title', () => {
		render(<PreferencesPage />)

		expect(screen.getByRole('heading', { name: 'Notifications' })).toBeInTheDocument()
		expect(screen.getAllByRole('switch')).toHaveLength(4)
	})
})
