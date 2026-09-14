jest.mock('next/headers', () => ({ cookies: jest.fn() }))

jest.unmock('@/lib/actions/user.actions')

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { enterDemoMode } from '@/lib/actions/user.actions'

const mockCookies = cookies as unknown as jest.Mock

describe('enterDemoMode', () => {
	it('sets the demo cookie and redirects home', async () => {
		const set = jest.fn()
		mockCookies.mockResolvedValue({ set })

		await enterDemoMode()

		expect(set).toHaveBeenCalledWith(
			'fortify-demo-mode',
			'1',
			expect.objectContaining({ httpOnly: true, secure: true }),
		)
		expect(redirect).toHaveBeenCalledWith('/')
	})
})
