jest.mock('next/headers', () => ({ cookies: jest.fn() }))

jest.unmock('@/lib/actions/user.actions')

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { enterDemoMode } from '@/lib/actions/user.actions'

const mockCookies = cookies as unknown as jest.Mock

describe('enterDemoMode', () => {
	afterEach(() => {
		jest.restoreAllMocks()
	})

	it('sets the demo cookie and redirects home', async () => {
		const set = jest.fn()
		mockCookies.mockResolvedValue({ set })

		await enterDemoMode()

		expect(set).toHaveBeenCalledWith(
			'fortify-demo-mode',
			'1',
			expect.objectContaining({ httpOnly: true, sameSite: 'strict' }),
		)
		expect(redirect).toHaveBeenCalledWith('/')
	})

	// Secure cookies are production-only (commit 9905c63), so local http dev still works.
	it('marks the cookie secure in production', async () => {
		jest.replaceProperty(process.env, 'NODE_ENV', 'production')
		const set = jest.fn()
		mockCookies.mockResolvedValue({ set })

		await enterDemoMode()

		expect(set).toHaveBeenCalledWith(
			'fortify-demo-mode',
			'1',
			expect.objectContaining({ secure: true }),
		)
	})

	it('does not mark the cookie secure outside production', async () => {
		const set = jest.fn()
		mockCookies.mockResolvedValue({ set })

		await enterDemoMode()

		expect(set).toHaveBeenCalledWith(
			'fortify-demo-mode',
			'1',
			expect.objectContaining({ secure: false }),
		)
	})
})
