'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { resendRecoveryLink } from '@/lib/actions/user.actions'

const ResendRecoveryButton = ({ userId }: { userId?: string }) => {
	const [status, setStatus] = useState<'idle' | 'loading' | 'sent'>('idle')
	const [error, setError] = useState('')

	const handleResend = async () => {
		if (!userId) return
		setStatus('loading')
		setError('')
		try {
			const res = await resendRecoveryLink({ userId })
			if (!res.success) throw new Error(res.error)
			setStatus('sent')
		} catch (err: any) {
			setError(err.message)
			setStatus('idle')
		}
	}

	if (status === 'sent') {
		return (
			<p className="text-sm text-semantic-success">
				New link sent — check your email.
			</p>
		)
	}

	return (
		<div className="flex flex-col items-center gap-2 w-full">
			{error && <p className="form-message">{error}</p>}
			<Button
				type="button"
				disabled={status === 'loading' || !userId}
				onClick={handleResend}
				className="w-full py-4 text-base shadow-xl">
				{status === 'loading' ? 'Sending...' : 'Send a new link'}
			</Button>
		</div>
	)
}

export default ResendRecoveryButton
