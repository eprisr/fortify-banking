'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { Button } from './ui/button'
import { MdOutlineAddCard } from 'react-icons/md'
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

const PlaidLink = ({ user, variant }: PlaidLinkProps) => {
	const router = useRouter()
	const [token, setToken] = useState('')

	useEffect(() => {
		const getLinkToken = async () => {
			const data = await createLinkToken(user)
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
		[user]
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
