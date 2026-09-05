import { connection } from 'next/server'
import { completeEmailVerification, getLoggedInUser, getUserInfo, verifyEmail } from '@/lib/actions/user.actions'
import { Check, Clock } from 'lucide-react'
import Link from 'next/link'
import { obscureEmail } from '@/lib/utils'
import ResendButton from '@/components/ResendButton'

const Verification = async ({ searchParams }: SearchParamProps) => {
	await connection()
	const loggedIn = await getLoggedInUser()
  if (!loggedIn) return null
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
    const result = await completeEmailVerification({ userId: userIdString, secret: secretString })
    successful = result.success

    if (!successful) {
      const refreshed = await getUserInfo({ userId: userIdString })
      successful = !!refreshed?.verifiedEmail
    }
  }

	return (
		<section className="flex-center w-full h-[calc(100vh-72px)] bg-white">
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
						{successful ? 'Email Verified' : 'Link expired'}
					</p>
					<h1 className="text-3xl font-bold">
						{successful ? "You're all set!" : 'This link has expired.'}
					</h1>
					<p className="font-normal text-ink/70">
						{successful
							? "Your email is confirmed. Let's finish setting up your account."
							: `The verification link we sent to ${email} is no longer valid.`}
					</p>
          {!successful && (
            <p className="text-sm text-ink/70">
              Verification links expire after 24 hours for your security. Request
              a new one to finish setting up your account.
            </p>
          )}
					{successful && (
						<Link
							href="/"
							className="font-semibold w-full inline-flex items-center justify-center  rounded-xl px-4 py-4 bg-primary text-white shadow-xl mt-2">
							Continue
						</Link>
					)}
					{expired && !successful && (
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
			)}
		</section>
	)
}

export default Verification
