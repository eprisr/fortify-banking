import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import Navbar from '@/components/Navbar'
import { getLoggedInUser } from '@/lib/actions/user.actions'

jest.mock('@/components/PlaidLink', () => () => (
	<div data-testid="plaid-link">Plaid Link</div>
))
jest.mock('@/components/Footer', () => () => (
	<div data-testid="footer">Footer</div>
))

describe('Navbar Server Component', () => {
	const mockUser = {
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

	beforeEach(() => {
		jest.clearAllMocks()
	})

	it('renders the Main Navbar (Logged In)', async () => {
		// 1. Mock the internal server action
		;(getLoggedInUser as jest.Mock).mockResolvedValue(mockUser)

		const jsx = await Navbar({
			type: 'main',
			user: mockUser,
			pageTitle: 'Home',
		})

		render(jsx)

		expect(screen.getByText(/Good Morning,/i)).toBeInTheDocument()
		expect(screen.getByText('Test!')).toBeInTheDocument()

		expect(screen.getByText('T')).toBeInTheDocument()
	})

	it('renders the Sub Navbar (Sign In Page)', async () => {
		;(getLoggedInUser as jest.Mock).mockResolvedValue(null)

		const jsx = await Navbar({
			type: 'sub',
			user: mockUser,
			pageTitle: 'Sign in',
		})

		render(jsx)

		expect(screen.getByText('Sign in')).toBeInTheDocument()

		expect(screen.queryByText(/Good Morning,/i)).not.toBeInTheDocument()
	})

	it('renders the Sub Navbar with Back Button (Forgot Password)', async () => {
		const jsx = await Navbar({
			type: 'sub',
			user: mockUser,
			pageTitle: 'Forgot password',
		})

		render(jsx)

		expect(screen.getByText('Forgot password')).toBeInTheDocument()
	})
})
