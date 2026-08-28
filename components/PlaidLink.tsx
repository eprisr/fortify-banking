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
import { isDemoUserId } from '@/lib/demo-data'

const PlaidLink = ({
	user,
	variant,
	text,
	update,
	appwriteItemId,
	redirectTo = '/',
	className,
}: PlaidLinkProps) => {
	const router = useRouter()
	const [token, setToken] = useState('')
	const [error, setError] = useState<string | null>(null)
	const isDemo = isDemoUserId(user?.$id)

	useEffect(() => {
		// Demo mode is read-only — don't burn a real Plaid link token on a
		// user that can never actually complete the connection.
		if (isDemo) return

		const getLinkToken = async () => {
			const data = await createLinkToken(user, update, appwriteItemId)
			sessionStorage.setItem('link_token', data?.linkToken ?? '')
			setToken(data?.linkToken ?? '')
		}

		getLinkToken()
	}, [isDemo, user, update, appwriteItemId])

	const onSuccess = useCallback<PlaidLinkOnSuccess>(
		async (public_token: string) => {
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
		if (isDemo) return
		setError(null)
		open()
	}

	return (
		<>
			{isDemo ? (
				<p className="form-message mt-1">
					Bank connections aren&apos;t available in demo mode.
				</p>
			) : isDemo === false ? (
				<PlaidButton
					variant={variant}
					text={text}
					handleOpen={handleOpen}
					isDemo={isDemo}
					ready={ready}
					className={className}
				/>
			) : (
				error && <p className="form-message mt-1">{error}</p>
			)}
		</>
	)
}

export default PlaidLink

interface PlaidButtonProps {
	variant: string | undefined
	text: string | undefined
	handleOpen: () => void
	isDemo: boolean
	ready: boolean
	className: string | undefined
}

const PlaidButton = ({
	variant,
	text,
	handleOpen,
	isDemo,
	ready,
	className,
}: PlaidButtonProps) => {
	return (
		<>
			{variant === 'primary' ? (
				<Button
					type="button"
					onClick={handleOpen}
					disabled={isDemo || !ready}
					className={cn(className)}>
					{text ? text : 'Connect bank'}
				</Button>
			) : variant === 'ghost' ? (
				<Button
					onClick={handleOpen}
					disabled={isDemo}
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
					disabled={isDemo || !ready}
					className={cn(className)}>
					Connect
				</Button>
			) : variant === 'relink' ? (
				<Button
					onClick={handleOpen}
					disabled={isDemo}
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
					disabled={isDemo}
					className={cn('plaidlink-default px-1', className)}>
					<MdOutlineAddCard className="text-2xl" />
					<p className="text-base font-semibold text-neutral-800">
						Connect Bank
					</p>
				</Button>
			)}
		</>
	)
}
