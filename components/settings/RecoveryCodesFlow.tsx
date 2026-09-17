'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import HeaderBox from '@/components/shared/HeaderBox'
import {
	Item,
	ItemContent,
	ItemDescription,
	ItemMedia,
} from '@/components/ui/item'
import { AlertTriangle, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Field } from '@/components/ui/field'
import { Label } from '@radix-ui/react-label'
import { Form } from '@/components/ui/form'
import OtpInput from '@/components/OtpInput'
import Copy from '@/components/Copy'
import {
	completeMfaChallenge,
	enableMFA,
	generateRecoveryCodes,
	requestMfaChallenge,
} from '@/lib/actions/user.actions'
import { hardNavigate, mfaChallengeSchema } from '@/lib/utils'

type MfaChallengeValues = { code: string }

const RecoveryCodesFlow = ({
	initialResult,
}: {
	initialResult: RecoveryCodesResult
}) => {
	const [codes, setCodes] = useState(
		initialResult.success && !initialResult.challengeRequired
			? initialResult.data
			: null,
	)
	const [needsChallenge, setNeedsChallenge] = useState(
		initialResult.success && initialResult.challengeRequired,
	)
	const [challengeId, setChallengeId] = useState<string | null>(null)
	const [error, setError] = useState(
		!initialResult.success ? initialResult.error : '',
	)
	const [isVerifying, setIsVerifying] = useState(false)
	const [isEnabling, setIsEnabling] = useState(false)

	const challengeForm = useForm<MfaChallengeValues>({
		resolver: zodResolver(mfaChallengeSchema(6)),
		mode: 'onChange',
		defaultValues: { code: '' },
	})

	// Guarded with a ref, not just the `challengeId` state: React can invoke
	// an effect more than once before that state update lands (dev
	// double-invoke, a parent re-render racing the pending promise), and
	// without the ref that fires a second challenge — and a second email —
	// every time.
	const hasRequestedChallenge = useRef(false)
	useEffect(() => {
		if (!needsChallenge || hasRequestedChallenge.current) return
		hasRequestedChallenge.current = true
		requestMfaChallenge('email').then((res) => {
			if (res.success) setChallengeId(res.data.challengeId)
			else setError(res.error)
		})
	}, [needsChallenge])

	const onChallengeSubmit = async ({ code }: MfaChallengeValues) => {
		if (!challengeId) return
		setIsVerifying(true)
		setError('')
		try {
			const challengeResult = await completeMfaChallenge({ challengeId, code })
			if (!challengeResult.success) throw new Error(challengeResult.error)

			const retry = await generateRecoveryCodes()
			if (!retry.success) throw new Error(retry.error)
			if (retry.challengeRequired) {
				throw new Error(
					"Verification succeeded but codes still couldn't be generated — please try again.",
				)
			}

			setCodes(retry.data)
			setNeedsChallenge(false)
		} catch (err: any) {
			setError(err.message)
			challengeForm.reset()
		} finally {
			setIsVerifying(false)
		}
	}

	const onEnable = async () => {
		setIsEnabling(true)
		const result = await enableMFA()
		if (result.success) {
			hardNavigate('/')
		} else {
			setError(result.error)
			setIsEnabling(false)
		}
	}

	if (needsChallenge) {
		return (
			<section>
				<HeaderBox
					title="Verify it's you"
					subtext="Enter the code we sent to your email to regenerate your recovery codes."
				/>
				<Form {...challengeForm}>
					<form
						onSubmit={challengeForm.handleSubmit(onChallengeSubmit)}
						className="space-y-5 mt-6">
						<OtpInput
							control={challengeForm.control}
							name="code"
							label="Code"
							length={6}
							numeric
						/>
						{error && <p className="form-message">{error}</p>}
						<Button
							type="submit"
							disabled={isVerifying || !challengeForm.formState.isValid}
							className="w-full py-5 text-base shadow-xl">
							{isVerifying ? 'Verifying...' : 'Continue'}
						</Button>
					</form>
				</Form>
			</section>
		)
	}

	return (
		<section>
			<HeaderBox
				title="Save your recovery codes"
				subtext="Your backup if you ever lose access."
			/>
			<Item className="bg-semantic-danger/10 p-4 rounded-md my-6">
				<ItemMedia
					variant="icon"
					className="[&_svg:not([class*='size-'])]:size-5">
					<AlertTriangle className="text-semantic-danger" size={16} />
				</ItemMedia>
				<ItemContent>
					<ItemDescription className="text-xs line-clamp-none">
						<span className="text-semantic-danger font-bold">
							These codes are shown once.{' '}
						</span>
						{codes &&
							"Each one works a single time. Store them somewhere safe — we can't show them to you again."}
						{!codes && error}
					</ItemDescription>
				</ItemContent>
			</Item>
			{codes && (
				<>
					<div className="flex flex-col gap-4">
						<div className="flex-center font-mono bg-cloud p-4 rounded-sm">
							<div className="grid grid-cols-2 gap-3 w-full">
								{codes.recoveryCodes.map((c, i) => (
									<div
										key={i}
										className="text-center w-full text-sm uppercase bg-paper py-2 rounded-md">
										<p>{c}</p>
									</div>
								))}
							</div>
						</div>
						<div className="flex gap-4 font-semibold">
							<Copy
								text={codes.recoveryCodes.join('\n')}
								classNames="flex-1 gap-1.5 mt-0"
							/>
							<Button variant="secondary" className="flex-1" asChild>
								<a
									href={`data:text/plain;charset=utf-8,${encodeURIComponent(codes.recoveryCodes.join('\n'))}`}
									download="fortify-bank-recovery-codes.txt">
									Download <Download />
								</a>
							</Button>
						</div>
					</div>
					<form
						onSubmit={(e) => {
							e.preventDefault()
							onEnable()
						}}
						className="w-full group/mfa">
						<Field orientation="horizontal" className="my-3">
							<Checkbox id="recovery-codes" name="recovery-codes" required />
							<Label htmlFor="recovery-codes" className="text-xs text-ink/70">
								I&apos;ve saved these recovery codes in a safe place
							</Label>
						</Field>
						<button
							type="submit"
							disabled={isEnabling}
							className="font-semibold w-full inline-flex items-center justify-center rounded-xl px-4 py-4 bg-primary text-white shadow-xl mt-2 opacity-50 cursor-not-allowed transition-opacity group-has-data-[state=checked]/mfa:opacity-100 group-has-data-[state=checked]/mfa:cursor-pointer focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40">
							{isEnabling ? 'Enabling...' : 'Continue'}
						</button>
					</form>
				</>
			)}
		</section>
	)
}

export default RecoveryCodesFlow
