'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { Button } from './ui/button'
import {
	MdArrowRight,
	MdOutlineAddCard,
	MdOutlineArrowCircleRight,
} from 'react-icons/md'
import {
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

	useEffect(() => {
		const getLinkToken = async () => {
			const data = await createLinkToken(user, update)
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

			router.refresh()
			router.push(redirectTo)
		},
		[user, redirectTo],
	)

	const config: PlaidLinkOptions = {
		token,
		onSuccess,
	}

	const { open, ready } = usePlaidLink(config)

	return (
		<>
			{variant === 'primary' ? (
				<Button
					type="button"
					onClick={() => open()}
					disabled={!ready}
					className={cn(className)}>
					{text ? text : 'Connect bank'}
				</Button>
			) : variant === 'ghost' ? (
				<Button
					onClick={() => open()}
					variant="ghost"
					className={cn('plaidlink-ghost', className)}>
					<p className="hidden text-base font-semibold text-neutral-800 xl:block">
						<MdOutlineAddCard className="text-2xl" />
						<p className="text-base font-semibold text-neutral-800">
							Connect Bank
						</p>
					</p>
				</Button>
			) : variant === 'reconnect' ? (
				<Button
					onClick={() => open()}
					disabled={!ready}
					className={cn('w-full p-0', className)}>
					<div className="connect-box">
						<MdOutlineAddCard className="text-2xl mr-2" />
						<div className="text-left shrink-[5]">
							<h3 className="font-extrabold">Connect your bank</h3>
							<p className="font-extralight text-xs text-wrap">
								Link an account to unlock your full dashboard
							</p>
						</div>
						<MdOutlineArrowCircleRight className="text-2xl ml-5" />
					</div>
				</Button>
			) : variant === 'relink' ? (
				<Button
					onClick={() => open()}
					className={cn(
						'plaidlink-ghost gap-1 bg-primary text-primary-foreground px-3',
						className,
					)}>
					<p className="text-xs font-semibold">Re-Link</p>
					<MdArrowRight className="text-lg" />
				</Button>
			) : (
				<Button
					onClick={() => open()}
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

export default PlaidLink
