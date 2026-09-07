'use client'

import { useEffect, useState } from 'react'
import type { VariantProps } from 'class-variance-authority'
import { Button, buttonVariants } from '@/components/ui/button'

type ResendState = 'counting' | 'idle' | 'loading' | 'sent'

type ResendButtonProps = {
	/** Fires the resend — caller owns which action + params it calls. */
	onResend: () => Promise<ActionResponse<null>>
	/** Shown in place of the button once the resend succeeds. */
	sentLabel: string
	idleLabel?: string
	loadingLabel?: string
	/** Gate the button behind a countdown (e.g. verification resend). Omit for no cooldown. */
	cooldownSeconds?: number
	disabled?: boolean
	variant?: VariantProps<typeof buttonVariants>['variant']
	className?: string
}

const ResendButton = ({
	onResend,
	sentLabel,
	idleLabel = 'Send a new link',
	loadingLabel = 'Sending...',
	cooldownSeconds,
	disabled,
	variant = 'default',
	className = 'w-full py-4 text-base shadow-xl',
}: ResendButtonProps) => {
	const [status, setStatus] = useState<ResendState>(
		cooldownSeconds ? 'counting' : 'idle',
	)
	const [secondsLeft, setSecondsLeft] = useState(cooldownSeconds ?? 0)
	const [error, setError] = useState('')

	useEffect(() => {
		if (status !== 'counting') return

		if (secondsLeft <= 0) {
			setStatus('idle')
			return
		}

		const timeoutId = setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
		return () => clearTimeout(timeoutId)
	}, [status, secondsLeft])

	const handleResend = async () => {
		setStatus('loading')
		setError('')
		try {
			const res = await onResend()
			if (!res.success) throw new Error(res.error)
			setStatus('sent')
		} catch (err: any) {
			setError(err.message)
			setStatus('idle')
		}
	}

	if (status === 'sent') {
		return <p className="text-sm text-semantic-success">{sentLabel}</p>
	}

	if (status === 'counting') {
		const mm = Math.floor(secondsLeft / 60)
		const ss = String(secondsLeft % 60).padStart(2, '0')
		return (
			<p className="text-ink/60">
				Resend email in {mm}:{ss}
			</p>
		)
	}

	return (
		<div className="flex flex-col items-center gap-2 w-full">
			{error && <p className="form-message">{error}</p>}
			<Button
				type="button"
				variant={variant}
				disabled={status === 'loading' || disabled}
				onClick={handleResend}
				className={className}>
				{status === 'loading' ? loadingLabel : idleLabel}
			</Button>
		</div>
	)
}

export default ResendButton
