import { connection } from 'next/server'
import {
	completeEmailVerification,
	getLoggedInUser,
	getUserInfo,
	verifyEmail,
} from '@/lib/actions/user.actions'
import { Check, Clock, XCircle } from 'lucide-react'
import Link from 'next/link'
import { obscureEmail } from '@/lib/utils'
import ResendButton from '@/components/ResendButton'

const Verification = async ({ searchParams }: SearchParamProps) => {
	await connection()
	const loggedIn = await getLoggedInUser()

	if (!loggedIn) {
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

	const email = obscureEmail(loggedIn.email)

	const { userId, secret, expire } = await searchParams

	let successful = loggedIn.verifiedEmail

	const expireToTime = expire?.toString().replace('\\', '')

	const expireDate = new Date(`${expireToTime!}`)
	const todaysDate = new Date()

	const expired = expireDate < todaysDate

	const userIdString = userId?.toString()
	const secretString = secret?.toString()

	if (!successful && !expired && userIdString && secretString) {
		const result = await completeEmailVerification({
			userId: userIdString,
			secret: secretString,
		})
		successful = result.success

		if (!successful) {
			// Someone else may have already completed this exact link (e.g. an
			// email client's link-scanning bot beating the real click) —
			// Appwrite secrets are single-use, so the loser's call fails even
			// though the link itself was good. Re-check the DB before
			// treating this as a real failure.
			const refreshed = await getUserInfo({ userId: userIdString })
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
				{status !== 'success' && (
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
			</div>
		</section>
	)
}

export default Verification
