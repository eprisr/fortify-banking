import { connection } from 'next/server'
import {
	completeEmailVerification,
	getLoggedInUser,
	verifyEmail,
} from '@/lib/actions/user.actions'
import { Check, XCircle } from 'lucide-react'
import Link from 'next/link'
import ResendButton from '@/components/ResendButton'

const Verification = async ({ searchParams }: SearchParamProps) => {
	await connection()
	const loggedIn = await getLoggedInUser()

	const { userId, secret } = await searchParams
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

	let successful = loggedIn?.verifiedEmail ?? false

	if (!successful && userIdString && secretString) {
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

	return (
		<section className="flex-center w-full h-[calc(100vh-72px)] bg-white">
			<div className="flex-center flex-col gap-5 text-center">
				<div
					className={`flex items-center justify-center h-13 w-13 rounded-full ${successful ? 'bg-semantic-success/10' : 'bg-semantic-danger/10'}`}>
					{successful ? (
						<Check className="text-semantic-success" size={24} />
					) : (
						<XCircle className="text-semantic-danger" size={24} />
					)}
				</div>
				<p
					className={`uppercase ${successful ? 'text-semantic-success' : 'text-semantic-danger'} text-xs tracking-wider font-semibold`}>
					{successful ? 'Email Verified' : 'Link invalid'}
				</p>
				<h1 className="text-3xl font-bold">
					{successful ? "You're all set!" : "This link isn't valid."}
				</h1>
				<p className="font-normal text-ink/70">
					{successful
						? "Your email is confirmed. Let's finish setting up your account."
						: "We couldn't verify your email with that link. It may have already been used, or it may have expired."}
				</p>
				{!successful && (
					<p className="text-sm text-ink/70">
						Request a new link to finish setting up your account.
					</p>
				)}
				{successful && (
					<Link
						href="/"
						className="font-semibold w-full inline-flex items-center justify-center  rounded-xl px-4 py-4 bg-primary text-white shadow-xl mt-2">
						Continue
					</Link>
				)}
				{!successful && loggedIn && (
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
				{!successful && !loggedIn && (
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
