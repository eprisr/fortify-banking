/**
 * Route-guard layouts: app/(root)/layout.tsx and app/(auth)/layout.tsx.
 */
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { redirect } from 'next/navigation'
import RootAreaLayout from '@/app/(root)/layout'
import AuthAreaLayout from '@/app/(auth)/layout'
import { getLoggedInUser } from '@/lib/actions/user.actions'

jest.mock('@/lib/actions/user.actions', () => ({
	getLoggedInUser: jest.fn(),
}))

const mockUser: User = {
	$id: 'user-123',
	email: 'jane@example.com',
	userId: 'user-123',
	dwollaCustomerUrl: 'https://api-sandbox.dwolla.com/customers/user-123',
	dwollaCustomerId: 'dwolla-123',
	firstName: 'Jane',
	lastName: 'Doe',
	name: 'Jane Doe',
	address1: '',
	city: '',
	state: '',
	postalCode: '',
	dateOfBirth: '',
	ssn: '',
}

beforeEach(() => {
	jest.clearAllMocks()
})

describe('app/(root)/layout.tsx', () => {
	it('redirects to /welcome when unauthenticated', async () => {
		;(getLoggedInUser as jest.Mock).mockResolvedValue(null)
		await RootAreaLayout({ children: <div data-testid="child" /> })
		expect(redirect).toHaveBeenCalledWith('/welcome')
	})

	it('does not redirect, and renders children, when authenticated', async () => {
		;(getLoggedInUser as jest.Mock).mockResolvedValue(mockUser)
		const jsx = await RootAreaLayout({ children: <div data-testid="child" /> })
		render(jsx)
		expect(redirect).not.toHaveBeenCalled()
		expect(screen.getByTestId('child')).toBeInTheDocument()
	})
})

describe('app/(auth)/layout.tsx', () => {
	it('redirects to / when already authenticated', async () => {
		;(getLoggedInUser as jest.Mock).mockResolvedValue(mockUser)
		await AuthAreaLayout({ children: <div data-testid="child" /> })
		expect(redirect).toHaveBeenCalledWith('/')
	})

	it('does not redirect, and renders children, when unauthenticated', async () => {
		;(getLoggedInUser as jest.Mock).mockResolvedValue(null)
		const jsx = await AuthAreaLayout({ children: <div data-testid="child" /> })
		render(jsx)
		expect(redirect).not.toHaveBeenCalled()
		expect(screen.getByTestId('child')).toBeInTheDocument()
	})
})
