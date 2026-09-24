import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { useRouter } from 'next/navigation'
import { NotificationsList } from '@/components/notifications/NotificationsList'
import { markAllNotificationsRead } from '@/lib/actions/notification.actions'

jest.mock('next/navigation', () => ({ useRouter: jest.fn() }))
jest.mock('@/lib/actions/notification.actions', () => ({
	markAllNotificationsRead: jest.fn(),
}))

const mockBack = jest.fn()
const mockRefresh = jest.fn()

const welcomeNotification: AppNotification = {
	$id: 'notif-1',
	$createdAt: new Date().toISOString(),
	userId: 'user-1',
	type: 'welcome',
	channel: 'in_app',
	title: 'Welcome to Fortify',
	body: "Here's a quick look at what you can do first.",
	read: true,
}

const mfaNotification: AppNotification = {
	...welcomeNotification,
	$id: 'notif-2',
	type: 'security_mfa',
	title: 'Add extra security to your account',
	body: 'Turn on two-factor authentication to help protect transfers and other sensitive actions.',
	read: false,
	actionHref: '/settings',
	actionLabel: 'Turn on',
}

beforeEach(() => {
	jest.clearAllMocks()
	;(useRouter as jest.Mock).mockReturnValue({
		back: mockBack,
		refresh: mockRefresh,
	})
	;(markAllNotificationsRead as jest.Mock).mockResolvedValue({
		success: true,
		data: null,
	})
})

describe('NotificationsList', () => {
	it('shows an unread security notification with its action button', () => {
		render(<NotificationsList notifications={[mfaNotification]} />)

		expect(
			screen.getByText('Add extra security to your account'),
		).toBeInTheDocument()
		expect(screen.getByRole('link', { name: 'Turn on' })).toHaveAttribute(
			'href',
			'/settings',
		)
		expect(
			screen.getByRole('button', { name: 'Mark all as read' }),
		).toBeInTheDocument()
	})

	it('groups a read notification under "Earlier" and an unread one under "New"', () => {
		render(
			<NotificationsList
				notifications={[welcomeNotification, mfaNotification]}
			/>,
		)

		expect(screen.getByText('New')).toBeInTheDocument()
		expect(
			screen.getByText('Add extra security to your account'),
		).toBeInTheDocument()
		expect(screen.getByText('Earlier')).toBeInTheDocument()
		expect(screen.getByText('Welcome to Fortify')).toBeInTheDocument()
	})

	it('does not offer "Mark all as read" once everything is read', () => {
		render(<NotificationsList notifications={[welcomeNotification]} />)

		expect(
			screen.queryByRole('button', { name: 'Mark all as read' }),
		).not.toBeInTheDocument()
	})

	it('calls markAllNotificationsRead and refreshes so the read state actually persists', async () => {
		render(<NotificationsList notifications={[mfaNotification]} />)

		await userEvent.click(
			screen.getByRole('button', { name: 'Mark all as read' }),
		)

		expect(markAllNotificationsRead).toHaveBeenCalled()
		expect(mockRefresh).toHaveBeenCalled()
	})

	it('links to the notification preferences page', () => {
		render(<NotificationsList notifications={[]} />)

		expect(
			screen.getByRole('link', { name: /manage notification preferences/i }),
		).toHaveAttribute('href', '/notifications/preferences')
	})

	it('goes back on the chevron button', async () => {
		render(<NotificationsList notifications={[]} />)

		await userEvent.click(screen.getByRole('button', { name: 'Go back' }))

		expect(mockBack).toHaveBeenCalled()
	})

	it('shows neither section when there are no notifications at all', () => {
		render(<NotificationsList notifications={[]} />)

		expect(screen.queryByText('New')).not.toBeInTheDocument()
		expect(screen.queryByText('Earlier')).not.toBeInTheDocument()
		expect(
			screen.queryByRole('button', { name: 'Mark all as read' }),
		).not.toBeInTheDocument()
	})
})
