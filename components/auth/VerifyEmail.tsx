'use client'

import { useEffect, useRef } from 'react'
import { Button } from '../ui/button'
import ResendButton from '@/components/ResendButton'
import { verifyEmail } from '@/lib/actions/user.actions'

const SENT_KEY = 'fortify:verification-email-sent'

const VerifyEmail = ({ email }: { email: string }) => {
	const sentRef = useRef(false)

	useEffect(() => {
		if (sentRef.current) return
		sentRef.current = true

		try {
			if (window.sessionStorage.getItem(SENT_KEY)) return
			window.sessionStorage.setItem(SENT_KEY, '1')
		} catch {
			// sessionStorage unavailable (private mode, etc.) — fall through and
			// send; better an extra email than silently sending none.
		}

		verifyEmail()
	}, [])

	return (
		<section className="h-full">
			<div className="flex flex-col items-center justify-center gap-4 text-center h-full text-ink text-sm">
				<h1 className="text-2xl font-heading font-semibold">
					Verify your email
				</h1>
				<p className="text-ink/60 italic font-serif">
					We sent a link to{' '}
					<span className="font-sans font-semibold not-italic!">{email}</span>.
				</p>
				<p className="text-ink/60">
					Click the link in that email to verify your account.
				</p>
				<div className="text-xs py-6">
					<div className="inline-flex h-2 w-2 bg-primary rounded-full animate-pulse mr-2"></div>{' '}
					<p className="inline-flex">Waiting for verification…</p>
				</div>
				<ResendButton
					onResend={() => verifyEmail()}
					sentLabel="Sent!"
					idleLabel="Resend email"
					cooldownSeconds={60}
					variant="ghost"
					className="p-0 text-primary font-semibold"
				/>
				<p className="text-ink/60">
					Wrong email?{' '}
					<Button
						variant="ghost"
						className="p-0 text-sm text-primary font-semibold">
						Change email address
					</Button>
				</p>
			</div>
		</section>
	)
}

export default VerifyEmail
