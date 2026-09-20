import { connection } from 'next/server'
import {
	completeEmailVerification,
	getLoggedInUser,
	verifyEmail,
} from '@/lib/actions/user.actions'
import { Check, Clock, XCircle } from 'lucide-react'
import Link from 'next/link'
import { obscureEmail } from '@/lib/utils'
import ResendButton from '@/components/ResendButton'

const Verification = async ({ searchParams }: SearchParamProps) => {
	await connection()
	const loggedIn = await getLoggedInUser()

	const { userId, secret, expire } = await searchParams
	const userIdString = userId?.toString()
	const secretString = secret?.toString()
	const hasToken = Boolean(userIdString && secretString)

	// Not signed in *and* no verification token in the URL — nothing to do
	// (someone navigated here directly rather than via an emailed link).
	// A valid token is completable regardless of login state below: the
	// browser opening the link is often not the one that's logged in (a
	// different device, or a mail app's in-app browser).
	if (!loggedIn && !hasToken) {
		return (
			<section className="flex-center w-full h-[calc(100vh-72px)] bg-white">
				<div className="flex-center flex-col gap-5 text-center">
					<div className="flex items-center justify-center h-13 w-13 rounded-full bg-semantic-danger/10">
						<XCircle className="text-semantic-danger" size={24} />
					</div>
					<p className="uppercase text-semantic-danger text-xs tracking-wider font-semibold">
						Not signed in
					</p>
					<h1 className="text-3xl font-bold">Sign in to verify your email</h1>
					<p className="font-normal text-ink/70">
						This link only works while you&apos;re signed in to the account it
						was sent to.
					</p>
					<Link
						href="/signin"
						className="font-semibold w-full inline-flex items-center justify-center  rounded-xl px-4 py-4 bg-primary text-white shadow-xl mt-2">
						Sign in
					</Link>
				</div>
			</section>
		)
	}

	const email = loggedIn ? obscureEmail(loggedIn.email) : 'your email'

	let successful = loggedIn?.verifiedEmail ?? false

	const expireToTime = expire?.toString().replace('\\', '')

	const expireDate = new Date(`${expireToTime!}`)
	const todaysDate = new Date()

	const expired = expireDate < todaysDate

	if (!successful && !expired && userIdString && secretString) {
		const result = await completeEmailVerification({
			userId: userIdString,
			secret: secretString,
		})
		successful = result.success

		if (!successful && loggedIn) {
			// Someone else may have already completed this exact link (e.g. an
			// email client's link-scanning bot beating the real click) —
			// re-check the live Appwrite state before treating this as a real
			// failure. Only meaningful when this browser has its own session
			// to re-check against.
			const refreshed = await getLoggedInUser()
			successful = !!refreshed?.verifiedEmail
		}
	}

	const status: 'success' | 'expired' | 'failed' = successful
		? 'success'
		: expired
			? 'expired'
			: 'failed'

	return (
		<section className="flex-center w-full h-[calc(100vh-72px)] bg-white">
			<div className="flex-center flex-col gap-5 text-center">
				<div
					className={`flex items-center justify-center h-13 w-13 rounded-full ${status === 'success' ? 'bg-semantic-success/10' : 'bg-semantic-danger/10'}`}>
					{status === 'success' ? (
						<Check className="text-semantic-success" size={24} />
					) : status === 'expired' ? (
						<Clock className="text-semantic-danger" size={24} />
					) : (
						<XCircle className="text-semantic-danger" size={24} />
					)}
				</div>
				<p
					className={`uppercase ${status === 'success' ? 'text-semantic-success' : 'text-semantic-danger'} text-xs tracking-wider font-semibold`}>
					{status === 'success'
						? 'Email Verified'
						: status === 'expired'
							? 'Link expired'
							: 'Link invalid'}
				</p>
				<h1 className="text-3xl font-bold">
					{status === 'success'
						? "You're all set!"
						: status === 'expired'
							? 'This link has expired.'
							: "This link isn't valid."}
				</h1>
				<p className="font-normal text-ink/70">
					{status === 'success'
						? "Your email is confirmed. Let's finish setting up your account."
						: status === 'expired'
							? `The verification link we sent to ${email} is no longer valid.`
							: "We couldn't verify your email with that link. It may have already been used, or it may be broken."}
				</p>
				{status !== 'success' && (
					<p className="text-sm text-ink/70">
						Verification links expire after 24 hours for your security. Request
						a new one to finish setting up your account.
					</p>
				)}
				{status === 'success' && (
					<Link
						href="/"
						className="font-semibold w-full inline-flex items-center justify-center  rounded-xl px-4 py-4 bg-primary text-white shadow-xl mt-2">
						Continue
					</Link>
				)}
				{status !== 'success' && loggedIn && (
					<>
						<div className="w-full">
							<ResendButton
								onResend={verifyEmail}
								sentLabel="Sent! Check your email."
							/>
						</div>
						<Link href="/signin" className="font-semibold text-primary">
							Back to sign in
						</Link>
					</>
				)}
				{status !== 'success' && !loggedIn && (
					// verifyEmail() needs a session to know who to send to — this
					// browser doesn't have one (the link was opened somewhere other
					// than where the account is signed in), so sign in there first.
					<Link
						href="/signin"
						className="font-semibold w-full inline-flex items-center justify-center rounded-xl px-4 py-4 bg-primary text-white shadow-xl mt-2">
						Sign in to request a new link
					</Link>
				)}
			</div>
		</section>
	)
}

export default Verification
