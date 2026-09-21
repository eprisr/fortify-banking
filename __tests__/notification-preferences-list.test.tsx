import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { NotificationPreferencesList } from '@/components/notifications/NotificationPreferencesList'

describe('NotificationPreferencesList', () => {
	it('renders every preference with its default state', () => {
		render(<NotificationPreferencesList />)

		const switches = screen.getAllByRole('switch')
		expect(switches).toHaveLength(4)

		expect(screen.getByText('Push Notifications')).toBeInTheDocument()
		expect(screen.getByText('Transaction Alerts')).toBeInTheDocument()
		expect(screen.getByText('Security Alerts')).toBeInTheDocument()
		expect(screen.getByText('Product Updates')).toBeInTheDocument()

		// Push, Transaction, and Security default on; Product Updates defaults off.
		expect(switches[0]).toHaveAttribute('data-state', 'checked')
		expect(switches[1]).toHaveAttribute('data-state', 'checked')
		expect(switches[2]).toHaveAttribute('data-state', 'checked')
		expect(switches[3]).toHaveAttribute('data-state', 'unchecked')
	})

	it('toggles a preference independently of the others', async () => {
		render(<NotificationPreferencesList />)

		const switches = screen.getAllByRole('switch')
		await userEvent.click(switches[3])

		expect(switches[3]).toHaveAttribute('data-state', 'checked')
		// The others are untouched.
		expect(switches[0]).toHaveAttribute('data-state', 'checked')
		expect(switches[1]).toHaveAttribute('data-state', 'checked')
		expect(switches[2]).toHaveAttribute('data-state', 'checked')
	})
})
