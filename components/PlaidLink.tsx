'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { Button } from './ui/button'
import { MdOutlineAddCard, MdOutlineArrowCircleRight } from 'react-icons/md'
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

const PlaidLink = ({ user, variant, update }: PlaidLinkProps) => {
	const router = useRouter()
	const [token, setToken] = useState('')

	useEffect(() => {
		const getLinkToken = async () => {
			const data = await createLinkToken(user, update)
			setToken(data?.linkToken)
		}

		getLinkToken()
	}, [user])

	const onSuccess = useCallback<PlaidLinkOnSuccess>(
		async (public_token: string) => {
			await exchangePublicToken({
				publicToken: public_token,
				user,
			})

			router.push('/')
		},
		[user],
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
					onClick={() => open()}
					disabled={!ready}
					className="plaidlink-primary">
					Connect Bank
				</Button>
			) : variant === 'ghost' ? (
				<Button
					onClick={() => open()}
					variant="ghost"
					className="plaidlink-ghost">
					<p className="hidden text-16px font-semibold text-neutral-800 xl:block">
						<MdOutlineAddCard className="text-24" />
						<p className="text-16px font-semibold text-neutral-800">
							Connect Bank
						</p>
					</p>
				</Button>
			) : variant === 'reconnect' ? (
				<Button onClick={() => open()} disabled={!ready} className="w-full p-0">
					<div className="connect-box">
						<MdOutlineAddCard className="text-24 mr-2" />
						<div className="text-left shrink-[5]">
							<h3 className="font-extrabold">Connect your bank</h3>
							<p className="font-extralight text-12 text-wrap">
								Link an account to unlock your full dashboard
							</p>
						</div>
						<MdOutlineArrowCircleRight className="text-24 ml-5" />
					</div>
				</Button>
			) : (
				<Button onClick={() => open()} className="plaidlink-default px-1">
					<MdOutlineAddCard className="text-24" />
					<p className="text-16px font-semibold text-neutral-800">
						Connect Bank
					</p>
				</Button>
			)}
		</>
	)
}

export default PlaidLink
