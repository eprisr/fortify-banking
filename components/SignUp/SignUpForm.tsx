'use client'

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { signupSchema, signupStepOneSchema } from '@/lib/utils'
import { type SignUpValues } from '@/lib/auth-form-config'
import { signUp } from '@/lib/actions/user.actions'
import CustomInput from '@/components/CustomInput'
import PlaidLink from '@/components/PlaidLink'
import { type Path } from 'react-hook-form'
import { Field, FieldLabel } from '@/components/ui/field'
import { Progress } from '@/components/ui/progress'
import StepOne from './StepOne'
import StepTwo from './StepTwo'
import StepThree from './StepThree'

const STEP_ONE_FIELDS = Object.keys(
	signupStepOneSchema.shape,
) as Path<SignUpValues>[]

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
			address1: '',
			city: '',
			state: '',
			postalCode: '',
			dateOfBirth: '',
			ssn: '',
		},
	})

	const { control, handleSubmit, trigger } = form

	const password = useWatch({ control, name: 'password' })

	const handleNext = async () => {
		const valid = await trigger(STEP_ONE_FIELDS)
		if (valid) setStep((prevStep) => prevStep + 1)
	}

	const onSubmit = async (data: SignUpValues) => {
		setIsLoading(true)
		setServerError('')
		try {
			const res = await signUp(data)
			if (!res.success) throw new Error(res.error)
			setUser(res.data)
		} catch (error: any) {
			setServerError(error.message)
			console.error('Auth Error: ', error)
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<section className="auth-form">
			<Field className="w-full">
				<FieldLabel htmlFor="progress-upload">
					<span>Step {step} of 3 -</span>
					{step === 1 || (step === 2 && <span>Your details</span>)}
					{step === 3 && <span> Optional but recommended</span>}
				</FieldLabel>
				<Progress value={(step / 3) * 100} id="progress-upload" />
			</Field>

			<header className="flex flex-col gap-5 md:gap-8">
				<div className="flex flex-col gap-1 md:gap-3">
					<h1 className="text-24 lg:text-36 font-semibold text-primary-700 text-center">
						Welcome to Fortify!
					</h1>
					<p className="text-12 font-normal text-gray-600 text-center">
						Hello there, create your account.
					</p>
				</div>
			</header>

			{user ? (
				<div className="flex flex-col gap-4">
					<PlaidLink user={user} variant="primary" />
				</div>
			) : (
				<>
					<Form {...form}>
						<form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
							{step === 1 && <StepOne control={control} password={password} />}

							{step === 2 && <StepTwo control={control} />}

							{step == 3 && <StepThree />}

							<div className="flex flex-col gap-4">
								{serverError && <p className="form-message">{serverError}</p>}

								{step === 1 && (
									<Button type="button" onClick={handleNext}>
										Continue
									</Button>
								)}
								{step === 2 && (
									<div className="flex gap-4">
										<Button
											type="button"
											variant="outline"
											onClick={() => setStep(1)}>
											Back
										</Button>
										<Button type="submit" disabled={isLoading}>
											{isLoading ? (
												<>
													<Loader2 size={20} className="animate-spin" /> &nbsp;
												</>
											) : (
												'Continue'
											)}
										</Button>
									</div>
								)}
								{step === 3 && (
									<div className="flex flex-col gap-4">
										<Button
											type="submit"
											disabled={isLoading}
											variant="default">
											{isLoading ? (
												<>
													<Loader2 size={20} className="animate-spin" /> &nbsp;
												</>
											) : (
												'Connect my bank now'
											)}
										</Button>
										<Button type="submit" variant="secondary">
											I'll do this later
										</Button>
									</div>
								)}
							</div>
						</form>
					</Form>

					<footer className="flex justify-center gap-1">
						<p className="text-14 font-normal text-gray-600">
							Already have an account?
						</p>
						<Link href="/signin" className="form-link">
							Sign In
						</Link>
					</footer>
				</>
			)}
		</section>
	)
}

export default SignUpForm
