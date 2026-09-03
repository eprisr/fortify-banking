'use client'

import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "../ui/button"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { verifyEmail } from "@/lib/actions/user.actions"

const ResendCountdown = ({
  seconds,
  onComplete,
}: {
  seconds: number
  onComplete: () => void
}) => {
  const [secondsLeft, setSecondsLeft] = useState(seconds)

  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    if (secondsLeft <= 0) {
      onCompleteRef.current()
      return
    }

    const timeoutId = setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearTimeout(timeoutId)
  }, [secondsLeft])

  const mm = Math.floor(secondsLeft / 60)
  const ss = String(secondsLeft % 60).padStart(2, '0')

  return (
    <p className="text-ink/60">
      Resend email in {mm}:{ss}
    </p>
  )
}

const VerifyEmail = ({ email }: { email: string }) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [cooldown, setCooldown] = useState<'counting' | 'complete' | 'sent'>('counting')

  const createQueryString = useCallback(
      (name: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString())
        params.delete('expire')
        params.set(name, value)
        return params.toString()
      },
      [searchParams],
    )

  const resendEmail = async () => {
      verifyEmail()
			setCooldown('sent')
  }
  
  useEffect(() => {
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
        {cooldown === 'counting' && (
          <ResendCountdown seconds={60} onComplete={() => setCooldown('complete')} />
        )}
        {cooldown === 'complete' && (
          <Button onClick={() => resendEmail()} variant="ghost" className="p-0 text-primary font-semibold">
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