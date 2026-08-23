'use client'

import { BaseSyntheticEvent, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useFormState, useWatch } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { ChevronLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { signupSchema } from '@/lib/utils'
import { type SignUpValues } from '@/lib/auth-form-config'
import { signUp } from '@/lib/actions/user.actions'
import CustomInput from '@/components/CustomInput'
import PlaidLink from '@/components/PlaidLink'
import { type Path } from 'react-hook-form'
import { Field, FieldLabel } from '@/components/ui/field'
import { Progress } from '@/components/ui/progress'
import StepOne from './StepOne'
import StepTwo from './StepTwo'
import { redirect } from 'next/navigation'

const STEP_ONE_FIELDS = Object.keys(signupSchema.shape) as Path<SignUpValues>[]

const SignUpForm = () => {
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

	return (
		<section className="auth-form">
			<header className="flex flex-col gap-5 md:gap-8">
				<div className="flex items-center justify-between">
					<div className="flex flex-center h-8 w-8 bg-cloud rounded-full">
						<ChevronLeft size={12} />
					</div>
					<Field orientation="horizontal" className="w-fit">
						<FieldLabel htmlFor="progress-upload">
							<span>Step {step} of 2</span>
						</FieldLabel>
						<Progress
							value={(step / 2) * 100}
							id="progress-upload"
							className="w-10! rounded-sm"
						/>
					</Field>
				</div>
				<div className="flex flex-col gap-1 md:gap-3">
					<h1 className="text-3xl font-bold">Create your account</h1>
					<p className="text-sm text-ink/60 font-serif italic">
						Let's get you started.
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
							{step == 2 && <StepTwo />}
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
							{step === 2 && user && (
								<div className="flex flex-col gap-4">
									<PlaidLink
										user={user}
										variant="primary"
										text="Connect my bank now"
										redirectTo="/confirmation?connected=true"
									/>
									<Button
										type="button"
										onClick={() => redirect('/confirmation')}
										disabled={isLoading}
										variant="secondary">
										I'll do this later
									</Button>
								</div>
							)}
						</div>
					</form>
				</Form>

				<footer className="flex justify-center gap-1">
					<p className="text-sm font-normal text-gray-600">Have an account?</p>
					<Link href="/signin" className="form-link">
						Sign In
					</Link>
				</footer>
			</>
		</section>
	)
}

export default SignUpForm
