'use client'

import { useCallback, useState } from 'react'
import { useForm, useFormState, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { ChevronLeft, CircleCheckBigIcon, CircleIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
	AuthFormType,
	AuthFormValues,
	FORM_CONFIG,
	ResetParams,
	SUBMIT_HANDLERS,
	getAuthResolver,
} from '@/lib/auth-form-config'
import CustomInput from './CustomInput'
import OtpInput from './OtpInput'
import {
	hardNavigate,
	mfaChallengeSchema,
	obscureEmail,
	passwordRequirements,
} from '@/lib/utils'
import { Item, ItemContent, ItemMedia, ItemTitle } from './ui/item'
import {
	completeMfaChallenge,
	enterDemoMode,
	requestMfaChallenge,
} from '@/lib/actions/user.actions'

type MfaChallengeValues = { code: string }
type MfaFactor = 'email' | 'recoverycode'
type MfaChallenge = { challengeId: string; factor: MfaFactor }

const AuthForm = ({
	type,
	resetParams,
}: {
	type: AuthFormType
	resetParams?: ResetParams
}) => {
	const router = useRouter()
	const pathname = usePathname()
	const searchParams = useSearchParams()
	const [isLoading, setIsLoading] = useState(false)
	const [serverError, setServerError] = useState('')
	const [mfaChallenge, setMfaChallenge] = useState<MfaChallenge | null>(null)

	const config = FORM_CONFIG[type]

	const createQueryString = useCallback(
		(name: string, value: string) => {
			const params = new URLSearchParams(searchParams.toString())
			params.delete('expire')
			params.set(name, value)
			return params.toString()
		},
		[searchParams],
	)

	const form = useForm<AuthFormValues>({
		resolver: getAuthResolver(type),
		mode: 'onChange',
		defaultValues: {
			email: '',
			password: '',
			confirmPassword: '',
		},
	})

	const mfaLength = mfaChallenge?.factor === 'recoverycode' ? 8 : 6

	const mfaForm = useForm<MfaChallengeValues>({
		resolver: zodResolver(mfaChallengeSchema(mfaLength)),
		mode: 'onChange',
		defaultValues: { code: '' },
	})

	const { control } = form

	const password = useWatch({ control, name: 'password' })

	const { dirtyFields, errors } = useFormState({ control: form.control })

	const requiredFields = (
		['email', 'password', 'confirmPassword'] as const
	).filter((field) => config.fields[field])

	const isFilledForm = requiredFields.every((field) => dirtyFields[field])
	const isFormValid = requiredFields.every((field) => !errors[field])
	const canSubmit = isFilledForm && isFormValid

	const onSubmit = async (data: AuthFormValues) => {
		setIsLoading(true)
		setServerError('')
		try {
			await SUBMIT_HANDLERS[type](data, {
				router,
				pathname,
				createQueryString,
				resetParams,
				onMfaRequired: (challengeId) =>
					setMfaChallenge({ challengeId, factor: 'email' }),
			})
		} catch (error: any) {
			setServerError(error.message)
			console.error('Auth Error: ', error)
		} finally {
			setIsLoading(false)
		}
	}

	const onMfaSubmit = async ({ code }: MfaChallengeValues) => {
		setIsLoading(true)
		setServerError('')
		try {
			const res = await completeMfaChallenge({
				challengeId: mfaChallenge!.challengeId,
				code,
			})
			if (!res.success) throw new Error(res.error)
			hardNavigate('/')
		} catch (error: any) {
			setServerError(error.message)
			console.error('MFA Challenge Error: ', error)
		} finally {
			setIsLoading(false)
		}
	}

	const switchMfaFactor = async (factor: MfaFactor) => {
		setServerError('')
		mfaForm.reset()
		const res = await requestMfaChallenge(factor)
		if (!res.success) {
			setServerError(res.error)
			return
		}
		setMfaChallenge({ challengeId: res.data.challengeId, factor })
	}

	if (mfaChallenge) {
		const isEmail = mfaChallenge.factor === 'email'

		return (
			<section className="auth-form" key="mfa-challenge">
				<header className="flex flex-col gap-5 md:gap-8">
					<button
						aria-label="Go back"
						onClick={() => {
							setMfaChallenge(null)
							setServerError('')
							mfaForm.reset()
						}}>
						<div className="flex flex-center h-8 w-8 bg-cloud rounded-full cursor-pointer">
							<ChevronLeft size={12} />
						</div>
					</button>
					<div className="flex flex-col gap-1 md:gap-3">
						<h1 className="text-3xl font-bold">
							{isEmail ? 'Check your email' : 'Enter a recovery code'}
						</h1>
						<p className="text-sm text-ink/70 font-serif italic">
							{isEmail
								? `We sent a 6-digit code to ${obscureEmail(form.getValues('email'))} to confirm two-factor authentication.`
								: 'Two-factor authentication is on for this account — enter one of your recovery codes to finish signing in.'}
						</p>
					</div>
				</header>

				<Form {...mfaForm}>
					<form
						onSubmit={mfaForm.handleSubmit(onMfaSubmit)}
						className="space-y-5">
						<OtpInput
							control={mfaForm.control}
							name="code"
							label={isEmail ? 'Code' : 'Recovery code'}
							length={mfaLength}
							numeric={isEmail}
						/>
						{isEmail && (
							<div className="flex justify-center">
								<Button
									type="button"
									variant="ghost"
									className="p-0 text-sm text-primary font-semibold"
									onClick={() => switchMfaFactor('email')}>
									Resend code
								</Button>
							</div>
						)}
						<div className="flex flex-col gap-4">
							{serverError && <p className="form-message">{serverError}</p>}
							<Button
								type="submit"
								disabled={isLoading || !mfaForm.formState.isValid}
								className="py-5 text-base shadow-xl">
								{isLoading ? <>Verifying...</> : 'Continue'}
							</Button>
						</div>
					</form>
				</Form>

				<footer>
					<div className="flex justify-center gap-1">
						<Button
							variant="ghost"
							className="p-0 text-sm text-primary font-semibold"
							onClick={() =>
								switchMfaFactor(isEmail ? 'recoverycode' : 'email')
							}>
							{isEmail
								? 'Use a recovery code instead'
								: 'Use your email instead'}
						</Button>
					</div>
				</footer>
			</section>
		)
	}

	return (
		<section className="auth-form" key={type}>
			{config.heading && (
				<header className="flex flex-col gap-5 md:gap-8">
					{type !== 'signin' && (
						<button aria-label="Go back" onClick={() => router.back()}>
							<div className="flex flex-center h-8 w-8 bg-cloud rounded-full cursor-pointer">
								<ChevronLeft size={12} />
							</div>
						</button>
					)}
					<div className="flex flex-col gap-1 md:gap-3">
						<h1 className="text-3xl font-bold">{config.heading}</h1>
						<p className="text-sm text-ink/70 font-serif italic">
							{config.subheading}
						</p>
					</div>
				</header>
			)}

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
					{config.fields.email && (
						<CustomInput
							control={form.control}
							name="email"
							label="Email"
							placeholder="Email"
							required
						/>
					)}

					{config.fields.password && (
						<CustomInput
							control={form.control}
							name="password"
							label="Password"
							placeholder={
								type === 'reset-pw' ? 'Enter new password' : 'Password'
							}
							required
						/>
					)}

					{type === 'reset-pw' && (
						<div className="grid grid-cols-2 grid-rows-2 gap-2">
							{passwordRequirements.map(({ label, test }) => {
								const met = test(password ?? '')
								return (
									<Item className="p-0" size="sm" key={label} asChild>
										<div>
											<ItemMedia
												className={
													met ? 'text-semantic-success' : 'text-ink/30'
												}>
												{met ? (
													<CircleCheckBigIcon className="size-5" />
												) : (
													<CircleIcon className="size-5" />
												)}
											</ItemMedia>
											<ItemContent>
												<ItemTitle
													className={`text-xs! ${met ? 'text-black' : 'text-ink/70'}`}>
													{label}
												</ItemTitle>
											</ItemContent>
										</div>
									</Item>
								)
							})}
						</div>
					)}

					{config.fields.confirmPassword && (
						<CustomInput
							control={form.control}
							name="confirmPassword"
							label="Confirm Password"
							placeholder={
								type === 'reset-pw'
									? 'Re-enter new password'
									: 'Confirm your password'
							}
							required
						/>
					)}

					{config.fields.forgotPasswordLink && (
						<div className="flex justify-end mt-1!">
							<Link
								className="text-right text-sm text-ink/70"
								href="/forgot-password">
								Forgot your password?
							</Link>
						</div>
					)}

					<div className="flex flex-col gap-4">
						{serverError && <p className="form-message">{serverError}</p>}
						<Button
							type="submit"
							disabled={isLoading || !canSubmit}
							className="py-5 text-base shadow-xl">
							{isLoading ? <>Signing in...</> : config.submitLabel}
						</Button>
					</div>
				</form>
			</Form>

			<footer>
				<div className="flex justify-center gap-1">
					<p className="text-sm font-normal text-ink/70">
						{config.footer.prompt}
					</p>
					{config.footer.linkHref && (
						<Link href={config.footer.linkHref} className="form-link">
							{config.footer.linkLabel}
						</Link>
					)}
				</div>

				{type === 'signin' && (
					<div className="flex justify-center items-center gap-1 mt-2">
						<p className="text-xs font-normal text-ink/60">Just exploring?</p>
						<form action={enterDemoMode}>
							<button type="submit" className="form-link text-xs">
								View the demo
							</button>
						</form>
					</div>
				)}
			</footer>
		</section>
	)
}

export default AuthForm
