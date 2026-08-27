import { connection } from 'next/server'
import AuthForm from '@/components/AuthForm'
import ResendRecoveryButton from '@/components/ResendRecoveryButton'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { Check, Clock } from 'lucide-react'

const ResetPassword = async ({ searchParams }: SearchParamProps) => {
	await connection()

	const { userId, secret, expire, success } = await searchParams

	const successful = success === 'true'

	const expireToTime = expire?.toString().replace('\\', '')

	const expireDate = new Date(`${expireToTime!}`)
	const todaysDate = new Date()

	const expired = expireDate < todaysDate

	const userIdString = userId?.toString()
	const secretString = secret?.toString()

	return (
		<section className="flex flex-col justify-center w-full h-[calc(100vh-72px)] bg-white">
			{(expired || successful) && (
				<div className="flex-center flex-col gap-5 text-center">
					<div
						className={`flex items-center justify-center h-13 w-13 rounded-full ${successful ? 'bg-semantic-success/10' : 'bg-semantic-danger/10'}`}>
						{successful ? (
							<Check className="text-semantic-success" size={24} />
						) : (
							<Clock className="text-semantic-danger" size={24} />
						)}
					</div>
					<p
						className={`uppercase ${successful ? 'text-semantic-success' : 'text-semantic-danger'} text-xs tracking-wider font-semibold`}>
						{successful ? 'Password updated' : 'Link expired'}
					</p>
					<h1 className="text-3xl font-bold">
						{successful ? 'All set!' : 'This link has expired.'}
					</h1>
					<p className="font-normal text-ink/70">
						{successful
							? 'Your password has been changed. Use it the next time you sign in.'
							: 'For your security, password reset links only last a short while. Request a new one to continue.'}
					</p>
					{expired && !successful && (
						<div className="w-full mt-5">
							<ResendRecoveryButton userId={userIdString} />
						</div>
					)}
					<Link
						href="/signin"
						className={`font-semibold text-primary ${success && 'w-full inline-flex items-center justify-center  rounded-xl px-4 py-4 bg-primary text-white shadow-xl mt-2'}`}>
						Back to sign in
					</Link>
				</div>
			)}
			{!expired && !successful && (
				<AuthForm
					type="reset-pw"
					resetParams={{ userId: userIdString, secret: secretString }}
				/>
			)}
		</section>
	)
}

export default ResetPassword
