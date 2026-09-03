'use client'

import { useState } from "react"
import { Button } from "../ui/button"

const VerifyEmail = ({ email }: { email: string }) => {
  const [cooldown, setCooldown] = useState<'counting' | 'complete' | 'sent'>('counting')

  const resendEmail = () => {
    console.log('update to resend email')
  }

  setTimeout(resendEmail, 60000)

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
        {cooldown === 'counting' && (
          <p className="text-ink/60">
            Resend email in 0:37
          </p>
        )}
        {cooldown === 'complete' && (
          <Button variant="ghost" className="p-0 text-primary font-semibold">
            Resend email
          </Button>
        )}
        {cooldown === 'sent' && (
          <p className="text-primary font-semibold">
            Sent!
          </p>
        )}
				<p className="text-ink/60">Wrong email? <Button variant="ghost" className="p-0 text-sm text-primary font-semibold">Change email address</Button></p>
			</div>
		</section>
	)
}

export default VerifyEmail