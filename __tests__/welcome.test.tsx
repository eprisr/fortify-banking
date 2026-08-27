/**
 * Welcome (landing) page — desktop "Sign in" button only.
 *
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { useRouter } from 'next/navigation'
import Landing from '@/app/(landing)/welcome/page'

const mockPush = jest.fn()

beforeEach(() => {
	jest.clearAllMocks()
	;(useRouter as jest.Mock).mockReturnValue({
		push: mockPush,
		replace: jest.fn(),
		refresh: jest.fn(),
		back: jest.fn(),
		forward: jest.fn(),
	})
})

describe('Welcome page — desktop "Sign in" button', () => {
	it('navigates via router.push, not redirect()', async () => {
		render(<Landing />)

		await userEvent.click(screen.getByRole('button', { name: /^sign in$/i }))

		expect(mockPush).toHaveBeenCalledWith('/signin')
	})
})
