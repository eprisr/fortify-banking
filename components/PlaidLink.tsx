'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { Button } from './ui/button'
import {
	MdArrowRight,
	MdOutlineAddCard,
	MdOutlineArrowCircleRight,
} from 'react-icons/md'
import {
	PlaidLinkOnExit,
	PlaidLinkOnSuccess,
	PlaidLinkOptions,
	usePlaidLink,
} from 'react-plaid-link'
import { useRouter } from 'next/navigation'
import {
	createLinkToken,
	exchangePublicToken,
} from '@/lib/actions/user.actions'
import { cn } from '@/lib/utils'

const PlaidLink = ({
	user,
	variant,
	text,
	update,
	redirectTo = '/',
	className,
}: PlaidLinkProps) => {
	const router = useRouter()
	const [token, setToken] = useState('')
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		const getLinkToken = async () => {
			const data = await createLinkToken(user, update)
			sessionStorage.setItem('link_token', data?.linkToken ?? '')
			setToken(data?.linkToken ?? '')
		}

		getLinkToken()
	}, [user])

	const onSuccess = useCallback<PlaidLinkOnSuccess>(
		async (public_token: string) => {
			await exchangePublicToken({
				publicToken: public_token,
				user,
			})

			sessionStorage.removeItem('link_token')

			router.refresh()
			router.push(redirectTo)
		},
		[user, redirectTo],
	)

	const onExit: PlaidLinkOnExit = (err) => {
		sessionStorage.removeItem('link_token')

		if (err) {
			console.error('Plaid Link Exit Error: ', err)
			setError(
				err.display_message ??
					err.error_message ??
					'Something went wrong connecting your bank. Please try again.',
			)
		}
	}

	const config: PlaidLinkOptions = {
		token,
		onSuccess,
		onExit,
	}

	const { open, ready } = usePlaidLink(config)

	const handleOpen = () => {
		setError(null)
		open()
	}

	return (
		<>
			{variant === 'primary' ? (
				<Button
					type="button"
					onClick={handleOpen}
					disabled={!ready}
					className={cn(className)}>
					{text ? text : 'Connect bank'}
				</Button>
			) : variant === 'ghost' ? (
				<Button
					onClick={handleOpen}
					variant="ghost"
					className={cn('plaidlink-ghost', className)}>
					<p className="hidden text-base font-semibold text-neutral-800 xl:block">
						<p className="text-base font-semibold text-neutral-800">
							{text ? text : 'Connect bank'}
						</p>
					</p>
				</Button>
			) : variant === 'reconnect' ? (
				<Button
					onClick={handleOpen}
					disabled={!ready}
					className={cn(className)}>
					Connect
				</Button>
			) : variant === 'relink' ? (
				<Button
					onClick={handleOpen}
					className={cn(
						'plaidlink-ghost gap-1 bg-primary text-primary-foreground px-3',
						className,
					)}>
					<p className="text-xs font-semibold">Re-Link</p>
					<MdArrowRight className="text-lg" />
				</Button>
			) : (
				<Button
					onClick={handleOpen}
					className={cn('plaidlink-default px-1', className)}>
					<MdOutlineAddCard className="text-2xl" />
					<p className="text-base font-semibold text-neutral-800">
						Connect Bank
					</p>
				</Button>
			)}
			{error && <p className="form-message mt-1">{error}</p>}
		</>
	)
}

export default PlaidLink
