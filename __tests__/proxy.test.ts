/**
 * proxy.ts — clears the demo-mode cookie for anyone landing on a real
 * auth route, so (auth)/layout.tsx's own getLoggedInUser() check doesn't
 * mistake a demo visitor for someone already logged in and bounce them
 * straight back to '/' before the sign-in form renders.
 */
import { NextRequest } from 'next/server'
import { proxy } from '@/proxy'
import { DEMO_MODE_COOKIE } from '@/lib/demo-data'

const requestTo = (path: string, withDemoCookie: boolean) =>
	new NextRequest(`https://example.com${path}`, {
		headers: withDemoCookie
			? { cookie: `${DEMO_MODE_COOKIE}=1` }
			: undefined,
	})

describe('proxy', () => {
	it('redirects back to the same URL and deletes the demo cookie when one is present', () => {
		const response = proxy(requestTo('/signin', true))

		expect(response.status).toBe(307)
		expect(response.headers.get('location')).toBe('https://example.com/signin')
		expect(response.cookies.get(DEMO_MODE_COOKIE)?.value).toBe('')
	})

	it('preserves query params on the self-redirect (e.g. reset-pw recovery links)', () => {
		const response = proxy(
			requestTo('/reset-pw?userId=abc&secret=xyz', true),
		)

		expect(response.headers.get('location')).toBe(
			'https://example.com/reset-pw?userId=abc&secret=xyz',
		)
	})

	it('is a no-op when there is no demo cookie', () => {
		const response = proxy(requestTo('/signin', false))

		expect(response.status).not.toBe(307)
		expect(response.cookies.get(DEMO_MODE_COOKIE)).toBeUndefined()
	})
})
