import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { useRouter } from 'next/navigation'
import { NotificationsList } from '@/components/notifications/NotificationsList'

jest.mock('next/navigation', () => ({ useRouter: jest.fn() }))

const mockBack = jest.fn()

beforeEach(() => {
	jest.clearAllMocks()
	;(useRouter as jest.Mock).mockReturnValue({ back: mockBack })
})

describe('NotificationsList', () => {
	it('shows the security notification with an unread dot when MFA is off', () => {
		render(<NotificationsList showMfaNotification />)

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

	it('hides the security notification entirely once MFA is already on', () => {
		render(<NotificationsList showMfaNotification={false} />)

		expect(
			screen.queryByText('Add extra security to your account'),
		).not.toBeInTheDocument()
		expect(
			screen.queryByRole('button', { name: 'Mark all as read' }),
		).not.toBeInTheDocument()
		// The "earlier" notification is unaffected by MFA status.
		expect(screen.getByText('Welcome to Fortify')).toBeInTheDocument()
	})

	it('clears the unread indicator when "Mark all as read" is clicked', async () => {
		const { container } = render(<NotificationsList showMfaNotification />)

		expect(container.querySelector('.bg-destructive')).toBeInTheDocument()

		await userEvent.click(
			screen.getByRole('button', { name: 'Mark all as read' }),
		)

		expect(container.querySelector('.bg-destructive')).not.toBeInTheDocument()
	})

	it('links to the notification preferences page', () => {
		render(<NotificationsList showMfaNotification={false} />)

		expect(
			screen.getByRole('link', { name: /manage notification preferences/i }),
		).toHaveAttribute('href', '/notifications/preferences')
	})

	it('goes back on the chevron button', async () => {
		render(<NotificationsList showMfaNotification={false} />)

		await userEvent.click(screen.getByRole('button', { name: 'Go back' }))

		expect(mockBack).toHaveBeenCalled()
	})
})
