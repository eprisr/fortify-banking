/**
 * Navbar Tests
 *
 * Navbar is a 'use client' component (it reads useMobileContainer() via a
 * hook), not an async server component, so it must be rendered the normal
 * RTL way — `render(<Navbar ... />)` — rather than invoked directly as a
 * function and awaited. Calling it as a plain function bypasses React's
 * dispatcher and throws "Invalid hook call".
 */

import '@testing-library/jest-dom'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Navbar from '@/components/Navbar'

jest.mock('@/components/PlaidLink', () => () => (
	<div data-testid="plaid-link">Plaid Link</div>
))
jest.mock('@/components/Footer', () => () => (
	<div data-testid="footer">Footer</div>
))

describe('Navbar', () => {
	const mockUser: User = {
		$id: '123',
		email: 'test@example.com',
		userId: 'sakfij9302u5rnkfel',
		dwollaCustomerUrl: 'http://dwolla.com',
		dwollaCustomerId: 'dwolla123',
		firstName: 'Test',
		lastName: 'User',
		name: 'Test User',
		address1: '123 Main St',
		city: 'Techville',
		state: 'NY',
		postalCode: '10001',
		dateOfBirth: '1990-01-01',
		ssn: '1234',
	}

	// =========================================================================
	describe('Main Navbar (logged in)', () => {
		// =========================================================================

		it('renders the "Good Morning," greeting and the user\'s full name', () => {
			render(<Navbar type="main" user={mockUser} />)
			expect(screen.getByText(/Good/i)).toBeInTheDocument()
			expect(screen.getByText('Test User!')).toBeInTheDocument()
		})

		it("renders the trigger with the user's first and last initial", () => {
			render(<Navbar type="main" user={mockUser} />)
			expect(screen.getByText('TU')).toBeInTheDocument()
		})

		it('does not render PlaidLink (currently commented out in the menu)', () => {
			render(<Navbar type="main" user={mockUser} />)
			expect(screen.queryByTestId('plaid-link')).not.toBeInTheDocument()
		})

		it('opens the menu sheet and shows profile details, nav links, and Footer', async () => {
			render(<Navbar type="main" user={mockUser} />)

			await userEvent.click(screen.getByText('TU'))

			const dialog = await screen.findByRole('dialog')
			expect(
				within(dialog).getByText(`Welcome, ${mockUser.firstName}`),
			).toBeInTheDocument()
			expect(within(dialog).getByText(mockUser.email)).toBeInTheDocument()
			expect(within(dialog).getByTestId('footer')).toBeInTheDocument()
		})

		it('groups nav links by category in the opened menu', async () => {
			render(<Navbar type="main" user={mockUser} />)
			await userEvent.click(screen.getByText('TU'))

			const dialog = await screen.findByRole('dialog')
			expect(within(dialog).getByText('ACCOUNT')).toBeInTheDocument()
			expect(within(dialog).getByText('PREFERENCES')).toBeInTheDocument()
			expect(within(dialog).getByText('SUPPORT')).toBeInTheDocument()
			expect(within(dialog).getByText('Linked Accounts')).toBeInTheDocument()
			expect(within(dialog).getByText('Dark Mode')).toBeInTheDocument()
			expect(within(dialog).getByText('Send Feedback')).toBeInTheDocument()
		})

		it('falls back to the sub-navbar layout when type is "main" but there is no user', () => {
			render(<Navbar type="main" pageTitle="Home" />)
			expect(screen.queryByText(/Good Morning,/i)).not.toBeInTheDocument()
			expect(screen.getByText('Home')).toBeInTheDocument()
		})
	})

	// =========================================================================
	describe('Sub Navbar', () => {
		// =========================================================================

		it('renders the page title and no greeting for the Sign in page', () => {
			render(<Navbar type="sub" pageTitle="Sign in" />)
			expect(screen.getByText('Sign in')).toBeInTheDocument()
			expect(screen.queryByText(/Good Morning,/i)).not.toBeInTheDocument()
		})

		it('omits the back chevron only on the Sign in page', () => {
			const { container } = render(<Navbar type="sub" pageTitle="Sign in" />)
			expect(container.querySelector('svg')).not.toBeInTheDocument()
		})

		it('renders a back chevron for other sub-navbar pages', () => {
			const { container } = render(
				<Navbar type="sub" pageTitle="Forgot password" />,
			)
			expect(container.querySelector('svg')).toBeInTheDocument()
		})

		it('links "Forgot password" back to /signin', () => {
			render(<Navbar type="sub" pageTitle="Forgot password" />)
			expect(screen.getByText('Forgot password').closest('a')).toHaveAttribute(
				'href',
				'/signin',
			)
		})

		it('links "Sign up" back to /signin', () => {
			render(<Navbar type="sub" pageTitle="Sign up" />)
			expect(screen.getByText('Sign up').closest('a')).toHaveAttribute(
				'href',
				'/signin',
			)
		})

		it('links "Reset Password" back to /forgot-password', () => {
			render(<Navbar type="sub" pageTitle="Reset Password" />)
			expect(screen.getByText('Reset Password').closest('a')).toHaveAttribute(
				'href',
				'/forgot-password',
			)
		})

		it('defaults to "/" for any other page title', () => {
			render(<Navbar type="sub" pageTitle="Transfer" />)
			expect(screen.getByText('Transfer').closest('a')).toHaveAttribute(
				'href',
				'/',
			)
		})
	})
})
