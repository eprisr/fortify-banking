'use client'

import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import {
	getVerificationStatus,
	transferFunds,
} from '@/lib/actions/user.actions'
import { amountToWords, formatAmount } from '@/lib/utils'

import { AccountPicker, Destination } from './transfers/AccountPicker'
import { IdentityVerificationForm } from './transfers/IdentityVerificationForm'
import { Button } from './ui/button'
import HeaderBox from './shared/HeaderBox'

type Step = 'entry' | 'review' | 'identity' | 'success'

const CTA_BUTTON = 'h-auto w-full rounded-2xl py-4 text-base'

const PaymentTransferForm = ({
	accounts,
	currentUserEmail,
	isDemo = false,
}: PaymentTransferFormProps) => {
	const router = useRouter()
	const [step, setStep] = useState<Step>('entry')
	const [fromAccount, setFromAccount] = useState<Account | undefined>(
		accounts?.[0],
	)
	const [destination, setDestination] = useState<Destination | null>(null)
	const [amountDigits, setAmountDigits] = useState('')
	const [note, setNote] = useState('')
	const [verificationStatus, setVerificationStatus] =
		useState<DwollaCustomerStatus | null>(null)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [submitError, setSubmitError] = useState('')

	useEffect(() => {
		if (isDemo) return
		getVerificationStatus().then((res) => {
			if (res.success) setVerificationStatus(res.data.status)
		})
	}, [isDemo])

	const amount = Number(amountDigits || '0') / 100
	const limit = verificationStatus === 'verified' ? 10_000 : 5_000
	const overLimit = amount > limit
	const sameAccountConflict =
		destination?.kind === 'account' &&
		fromAccount &&
		destination.account.appwriteItemId === fromAccount.appwriteItemId
	const needsVerification =
		destination?.kind === 'recipient' && verificationStatus !== 'verified'

	const canContinue =
		!!fromAccount &&
		!!destination &&
		amount > 0 &&
		!overLimit &&
		!sameAccountConflict

	const handleAmountChange = (raw: string) => {
		setAmountDigits(raw.replace(/\D/g, ''))
	}

	const goToReview = () => {
		if (!canContinue) return
		setStep('review')
	}

	const submitTransfer = async () => {
		if (!fromAccount || !destination) return
		setIsSubmitting(true)
		setSubmitError('')

		const recipientName =
			destination.kind === 'account'
				? destination.account.name
				: destination.recipient.name
		const recipientEmail =
			destination.kind === 'account' ? currentUserEmail : destination.email
		const receiverShareableId =
			destination.kind === 'account'
				? destination.account.shareableId
				: destination.recipient.shareableId

		const res = await transferFunds({
			senderBankDocumentId: fromAccount.appwriteItemId,
			receiverShareableId,
			amount: amount.toFixed(2),
			recipientName,
			recipientEmail,
			note,
		})

		setIsSubmitting(false)

		if (!res.success) {
			setSubmitError(res.error)
			return
		}

		router.refresh()
		setStep('success')
	}

	const handleConfirm = () => {
		if (isDemo) return
		if (needsVerification) {
			setStep('identity')
			return
		}
		submitTransfer()
	}

	const recipientLabel =
		destination?.kind === 'account'
			? destination.account.name
			: destination?.recipient.name

	if (step === 'success') {
		return (
			<div className="flex flex-col items-center gap-4 text-center">
				<div className="flex size-14 items-center justify-center rounded-full bg-accent">
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth={2.5}
						strokeLinecap="round"
						strokeLinejoin="round"
						className="size-6 text-accent-foreground">
						<path d="M5 13l4 4L19 7" />
					</svg>
				</div>
				<h2 className="text-xl font-bold text-foreground">Transfer complete</h2>
				<div className="w-full rounded-2xl bg-muted px-4 py-2 text-left">
					<div className="flex justify-between border-b border-foreground/10 py-3 text-sm">
						<span className="text-muted-foreground">Amount</span>
						<span className="font-mono font-medium text-foreground">
							{formatAmount(amount)}
						</span>
					</div>
					<div className="flex justify-between border-b border-foreground/10 py-3 text-sm">
						<span className="text-muted-foreground">From</span>
						<span className="font-medium text-foreground">
							{fromAccount?.name}
						</span>
					</div>
					<div className="flex justify-between py-3 text-sm">
						<span className="text-muted-foreground">To</span>
						<span className="font-medium text-foreground">
							{recipientLabel}
						</span>
					</div>
				</div>
				<Button className={CTA_BUTTON} onClick={() => router.push('/')}>
					Done
				</Button>
			</div>
		)
	}

	if (step === 'identity') {
		return (
			<div className="flex flex-col gap-4">
				<h2 className="text-xl font-bold text-foreground">
					Verify your identity
				</h2>
				<IdentityVerificationForm
					onVerified={submitTransfer}
					onCancel={() => setStep('review')}
				/>
			</div>
		)
	}

	if (step === 'review') {
		return (
			<div className="flex flex-col gap-4">
				<HeaderBox title="Review transfer" subtext="" />
				<div className="py-2 text-center">
					<p className="font-mono text-4xl text-foreground">
						{formatAmount(amount)}
					</p>
					<p className="mt-1 text-xs font-semibold text-primary capitalize">
						{amountToWords(amount)}
					</p>
				</div>
				<div className="rounded-2xl bg-muted px-4">
					<div className="flex justify-between border-b border-foreground/10 py-3 text-sm">
						<span className="text-muted-foreground">From</span>
						<span className="font-medium text-foreground">
							{fromAccount?.name}
						</span>
					</div>
					<div className="flex justify-between border-b border-foreground/10 py-3 text-sm">
						<span className="text-muted-foreground">To</span>
						<span className="font-medium text-foreground">
							{recipientLabel}
						</span>
					</div>
					<div className="flex justify-between py-3 text-sm">
						<span className="text-muted-foreground">Note</span>
						<span className="font-medium text-foreground">{note || '—'}</span>
					</div>
				</div>
				{submitError && (
					<p className="text-xs font-medium text-destructive">{submitError}</p>
				)}
				<Button
					onClick={handleConfirm}
					disabled={isDemo || isSubmitting}
					className={CTA_BUTTON}>
					{isSubmitting ? (
						<>
							<Loader2 size={18} className="animate-spin" /> Sending…
						</>
					) : (
						'Confirm & send'
					)}
				</Button>
				<Button
					variant="secondary"
					onClick={() => setStep('entry')}
					className={CTA_BUTTON}>
					Edit
				</Button>
				{isDemo && (
					<p className="text-center text-xs text-muted-foreground">
						Transfers aren&apos;t available in demo mode.
					</p>
				)}
			</div>
		)
	}

	return (
		<div className="flex flex-col gap-4">
			<HeaderBox title="Transfer" subtext="" />
			<div>
				<p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
					From
				</p>
				<AccountPicker
					mode="from"
					label="Choose account"
					accounts={accounts}
					value={fromAccount ? { kind: 'account', account: fromAccount } : null}
					onChange={(d) => d.kind === 'account' && setFromAccount(d.account)}
				/>
			</div>

			<div>
				<p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
					To
				</p>
				<AccountPicker
					mode="to"
					label="Choose recipient"
					accounts={accounts}
					excludeAccountId={fromAccount?.appwriteItemId}
					value={destination}
					onChange={setDestination}
				/>
				{sameAccountConflict && (
					<p className="mt-1 text-xs font-medium text-destructive">
						Choose a different account than the one you&apos;re sending from.
					</p>
				)}
			</div>

			<div className="py-2 text-center">
				<input
					className="w-full bg-transparent text-center font-mono text-5xl text-foreground outline-none placeholder:text-muted-foreground"
					placeholder="$0.00"
					inputMode="decimal"
					value={amountDigits ? formatAmount(amount) : ''}
					onChange={(e) => handleAmountChange(e.target.value)}
				/>
				<p
					className={
						overLimit
							? 'text-xs font-semibold text-destructive'
							: 'text-xs text-muted-foreground'
					}>
					{overLimit
						? `This exceeds your ${formatAmount(limit)} ${verificationStatus === 'verified' ? 'per-transfer' : 'weekly'} limit`
						: verificationStatus === 'verified'
							? `Verified accounts can send up to ${formatAmount(limit)} per transfer`
							: `Unverified accounts can send up to ${formatAmount(limit)} per week`}
				</p>
			</div>

			<div>
				<p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
					Note (optional)
				</p>
				<input
					className="w-full rounded-2xl bg-muted px-4 py-3.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
					placeholder="e.g. Moving to savings"
					value={note}
					onChange={(e) => setNote(e.target.value)}
				/>
			</div>

			<Button
				onClick={goToReview}
				disabled={!canContinue}
				className={CTA_BUTTON}>
				Review transfer
			</Button>
		</div>
	)
}

export default PaymentTransferForm
