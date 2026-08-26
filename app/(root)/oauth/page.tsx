'use client'

import { Button } from '@/components/ui/button'
import {
	exchangePublicToken,
	getLoggedInUser,
} from '@/lib/actions/user.actions'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import {
	PlaidLinkOnExit,
	PlaidLinkOnSuccess,
	usePlaidLink,
} from 'react-plaid-link'

const OAuthLink = () => {
	const router = useRouter()
	const [user, setUser] = useState<User | null>(null)
	const [linkToken, setLinkToken] = useState('')
	const [receivedRedirectUri, setReceivedRedirectUri] = useState('')
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		// The Link token from the first Link initialization, plus the URI
		// Plaid redirected back to (carries the oauth_state_id param Link
		// needs to resume the flow). Both reference browser globals, so they
		// have to be read client-side inside an effect, not during render.
		setLinkToken(sessionStorage.getItem('link_token') ?? '')
		setReceivedRedirectUri(window.location.href)
		getLoggedInUser().then(setUser)
	}, [])

	const onSuccess = useCallback<PlaidLinkOnSuccess>(
		async (public_token: string) => {
			if (!user) {
				setError('Something went wrong. Please try again.')
				return
			}

			const result = await exchangePublicToken({
				publicToken: public_token,
				user,
			})

			sessionStorage.removeItem('link_token')

			if (!result?.success) {
				setError(
					result?.error ??
						'We connected to your bank, but saving the account failed. Please try again.',
				)
				return
			}

			router.refresh()
			router.push('/')
		},
		[user, router],
	)

	const onExit: PlaidLinkOnExit = (err) => {
		sessionStorage.removeItem('link_token')

		if (err) {
			console.error('Plaid OAuth Link Exit Error: ', err)
			setError(
				err.display_message ??
					err.error_message ??
					'Something went wrong connecting your bank. Please try again.',
			)
			return
		}

		// User backed out of Link deliberately - nothing to report.
		router.push('/')
	}

	const config: Parameters<typeof usePlaidLink>[0] = {
		token: linkToken,
		// pass in the received redirect URI, which contains an OAuth state ID parameter that is required to
		// re-initialize Link
		receivedRedirectUri,
		onSuccess,
		onExit,
	}

	const { open, ready } = usePlaidLink(config)

	// automatically reinitialize Link once the token, user, and redirect URI are all in
	useEffect(() => {
		if (ready && user && linkToken && receivedRedirectUri && !error) {
			open()
		}
	}, [ready, open, user, linkToken, receivedRedirectUri, error])

	if (error) {
		return (
			<section className="flex h-screen flex-col items-center justify-center gap-4 p-6 text-center">
				<h1 className="text-xl font-semibold">Bank connection failed</h1>
				<p className="form-message max-w-md">{error}</p>
				<Button onClick={() => router.push('/')}>Return to dashboard</Button>
			</section>
		)
	}

	return <></>
}

export default OAuthLink
