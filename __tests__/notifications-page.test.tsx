import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import Notifications from '@/app/(root)/(no-nav)/notifications/page'
import PreferencesPage from '@/app/(root)/(no-nav)/notifications/preferences/page'
import { getLoggedInUser } from '@/lib/actions/user.actions'

jest.mock('next/navigation', () => ({ useRouter: () => ({ back: jest.fn() }) }))

jest.mock('@/lib/actions/user.actions', () => ({
	getLoggedInUser: jest.fn(),
}))

describe('Notifications page', () => {
	it('shows the security notification when the user has not enabled MFA', async () => {
		;(getLoggedInUser as jest.Mock).mockResolvedValue({ mfa: false })

		render(await Notifications())

		expect(
			screen.getByText('Add extra security to your account'),
		).toBeInTheDocument()
	})

	it('omits the security notification once MFA is already on', async () => {
		;(getLoggedInUser as jest.Mock).mockResolvedValue({ mfa: true })

		render(await Notifications())

		expect(
			screen.queryByText('Add extra security to your account'),
		).not.toBeInTheDocument()
	})
})

describe('Notification preferences page', () => {
	it('renders the preferences list under a "Notifications" title', () => {
		render(<PreferencesPage />)

		expect(screen.getByRole('heading', { name: 'Notifications' })).toBeInTheDocument()
		expect(screen.getAllByRole('switch')).toHaveLength(4)
	})
})
