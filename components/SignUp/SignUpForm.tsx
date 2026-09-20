'use client'

import { BaseSyntheticEvent, useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useFormState, useWatch } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { ChevronLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { obscureEmail, signupSchema } from '@/lib/utils'
import { type SignUpValues } from '@/lib/auth-form-config'
import { getLoggedInUser, signUp } from '@/lib/actions/user.actions'
import CustomInput from '@/components/CustomInput'
import PlaidLink from '@/components/PlaidLink'
import { type Path } from 'react-hook-form'
import { Field, FieldLabel } from '@/components/ui/field'
import { Progress } from '@/components/ui/progress'
import StepOne from './StepOne'
import StepTwo from './StepTwo'
import VerifyEmail from '@/components/auth/VerifyEmail'
import { useRouter } from 'next/navigation'

const STEP_ONE_FIELDS = Object.keys(signupSchema.shape) as Path<SignUpValues>[]
const TOTAL_STEPS = 3
const VERIFY_POLL_MS = 4000

const STEP_COPY: Record<number, { title: string; subtitle: string }> = {
	1: { title: 'Create your account', subtitle: "Let's get you started." },
	2: {
		title: 'Verify your email',
		subtitle: "We just need to confirm it's really you.",
	},
	3: {
		title: 'Connect your bank',
		subtitle: 'See your full picture, automatically.',
	},
}

const SignUpForm = () => {
	const router = useRouter()
	const [step, setStep] = useState<number>(1)
	const [user, setUser] = useState<User | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	const [serverError, setServerError] = useState('')

	const form = useForm<SignUpValues>({
		resolver: zodResolver(signupSchema),
		mode: 'onChange',
		defaultValues: {
			firstName: '',
			lastName: '',
			email: '',
			password: '',
			agreeToTerms: false,
		},
	})

	const { control, handleSubmit, trigger } = form

	const password = useWatch({ control, name: 'password' })

	const { dirtyFields, isValid } = useFormState({ control })
	const isStepOneFilled = STEP_ONE_FIELDS.every((field) => dirtyFields[field])
	const canContinue = isStepOneFilled && isValid

	const handleNext = async () => {
		const valid = await trigger(STEP_ONE_FIELDS)
		if (valid) setStep((prevStep) => prevStep + 1)
	}

	const onSubmit = async ({ agreeToTerms, ...data }: SignUpValues) => {
		setIsLoading(true)
		setServerError('')
		try {
			const res = await signUp(data)
			if (!res.success) throw new Error(res.error)
			setUser(res.data)
			handleNext()
		} catch (error: any) {
			setServerError(error.message)
			console.error('Auth Error: ', error)
		} finally {
			setIsLoading(false)
		}
	}

	useEffect(() => {
		if (step !== 2 || !user) return

		let cancelled = false
		const poll = async () => {
			const loggedIn = await getLoggedInUser()
			if (!cancelled && loggedIn?.verifiedEmail) setStep(3)
		}
		const intervalId = setInterval(poll, VERIFY_POLL_MS)
		return () => {
			cancelled = true
			clearInterval(intervalId)
		}
	}, [step, user])

	return (
		<section className="auth-form">
			<header className="flex flex-col gap-5 md:gap-8">
				<div className="flex items-center justify-between">
					<button onClick={() => router.back()}>
						<div className="flex flex-center h-8 w-8 bg-cloud rounded-full cursor-pointer">
							<ChevronLeft size={12} />
						</div>
					</button>
					<Field orientation="horizontal" className="w-fit">
						<FieldLabel htmlFor="progress-upload">
							<span>
								Step {step} of {TOTAL_STEPS}
							</span>
						</FieldLabel>
						<Progress
							value={(step / TOTAL_STEPS) * 100}
							id="progress-upload"
							className="w-10! rounded-sm"
						/>
					</Field>
				</div>
				<div className="flex flex-col gap-1 md:gap-3">
					<h1 className="text-3xl font-bold">{STEP_COPY[step]?.title}</h1>
					<p className="text-sm text-ink/70 font-serif italic">
						{STEP_COPY[step]?.subtitle}
					</p>
				</div>
			</header>

			<>
				<Form {...form}>
					<form
						onSubmit={handleSubmit(onSubmit)}
						className="flex flex-col grow space-y-5">
						<div className="flex flex-col grow gap-4">
							{step === 1 && <StepOne control={control} password={password} />}
							{step === 2 && user && (
								<VerifyEmail email={obscureEmail(user.email)} />
							)}
							{step === 3 && <StepTwo />}
							{serverError && <p className="form-message">{serverError}</p>}
						</div>

						<div className="flex flex-col gap-4">
							{step === 1 && (
								<Button
									type="submit"
									disabled={isLoading || !canContinue}
									className="py-4 text-base shadow-xl">
									Continue
								</Button>
							)}
							{step === 2 && (
								<Button
									type="button"
									onClick={() => setStep(3)}
									variant="secondary"
									className="py-4 text-base shadow-xl">
									Skip for now
								</Button>
							)}
							{step === 3 && user && (
								<div className="flex flex-col gap-4">
									<PlaidLink
										user={user}
										variant="primary"
										text="Connect my bank now"
										redirectTo="/confirmation?connected=true"
										className="py-4 text-base shadow-xl"
									/>
									<Button
										type="button"
										onClick={() => router.push('/confirmation')}
										disabled={isLoading}
										variant="secondary"
										className="py-4 text-base shadow-xl">
										I'll do this later
									</Button>
								</div>
							)}
						</div>
					</form>
				</Form>

				{step === 1 && (
					<footer className="flex justify-center gap-1">
						<p className="text-sm font-normal text-gray-600">
							Have an account?
						</p>
						<Link href="/signin" className="form-link">
							Sign In
						</Link>
					</footer>
				)}
			</>
		</section>
	)
}

export default SignUpForm
