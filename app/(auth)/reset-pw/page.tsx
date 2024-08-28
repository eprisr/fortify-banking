import AuthForm from '@/components/AuthForm'
import Navbar from '@/components/Navbar'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

const ResetPassword = ({
	searchParams: { userId, secret, expire, success },
}: SearchParamProps) => {
	const expireToTime = expire?.toString().replace(' ', 'T')

	const expireDate = new Date(`${expireToTime!}Z`)
	const todaysDate = new Date()

	const expired = expireDate < todaysDate

	const userIdString = userId?.toString()
	const secretString = secret?.toString()

	return (
		<>
			<Navbar type="sub" pageTitle="Reset password" />
			<section className="flex-center size-full max-sm:px-6 bg-white">
				{expired ? (
					<div className="flex flex-col items-center py-10">
						<Image
							src="/icons/reset-expired.svg"
							alt="Expired Reset Password Illustration"
							width="300"
							height="300"
							className="pb-10"
						/>
						<div className="flex flex-col items-center gap-4">
							<p>This password link has expired.</p>
							<Link href="/forgot-password" className="text-primary-700">
								Request a new link
							</Link>
						</div>
					</div>
				) : success === 'true' ? (
					<div className="flex flex-col items-center py-10">
						<Image
							src="/icons/pw-success.svg"
							alt="Successful Reset Password Illustration"
							width="300"
							height="300"
							className="pb-10"
						/>
						<div className="flex flex-col items-center gap-4">
							<p className="text-primary-700">Change password successfully!</p>
							<p>
								You have successfully changed your password. Please use the new
								password to sign in.
							</p>
							<Link
								href="/signin"
								className="w-full inline-flex items-center justify-center  rounded-2xl px-4 py-2 bg-primary-700 text-white">
								Ok
							</Link>
						</div>
					</div>
				) : (
					<AuthForm
						type="reset-pw"
						resetParams={{ userId: userIdString, secret: secretString }}
					/>
				)}
			</section>
		</>
	)
}

export default ResetPassword
