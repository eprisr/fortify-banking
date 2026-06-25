'use client'

import { BaseSyntheticEvent, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { Loader2 } from 'lucide-react'
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
		},
	})

	const { control, handleSubmit, trigger } = form

	const password = useWatch({ control, name: 'password' })

	const handleNext = async () => {
		const valid = await trigger(STEP_ONE_FIELDS)
		if (valid) setStep((prevStep) => prevStep + 1)
	}

	const onSubmit = async (data: SignUpValues, event?: BaseSyntheticEvent) => {
		function isNamedSubmitter(
			el: EventTarget | null,
		): el is HTMLButtonElement | HTMLInputElement {
			return el instanceof HTMLButtonElement || el instanceof HTMLInputElement
		}

		const submitter = (event?.nativeEvent as SubmitEvent | undefined)?.submitter
		const name =
			submitter && isNamedSubmitter(submitter) ? submitter.name : undefined

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
			if (name === 'connect') {
				redirect('/signin')
			}

			if (name === 'sample') {
				redirect('/confirmation')
			}
		}
	}

	return (
		<section className="auth-form">
			<Field className="w-full">
				<FieldLabel htmlFor="progress-upload">
					<span>Step {step} of 2 -</span>
					{step === 1 && <span>Your details</span>}
					{step === 2 && <span> Optional but recommended</span>}
				</FieldLabel>
				<Progress value={(step / 2) * 100} id="progress-upload" />
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
								<Button type="button" onClick={handleNext}>
									Continue
								</Button>
							)}
							{step === 2 && (
								<div className="flex flex-col gap-4">
									<Button
										type="submit"
										name="connect"
										disabled={isLoading}
										variant="default">
										Connect my bank now
									</Button>
									<Button
										type="submit"
										name="sample"
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
					<p className="text-14 font-normal text-gray-600">
						Already have an account?
					</p>
					<Link href="/signin" className="form-link">
						Sign In
					</Link>
				</footer>
			</>
		</section>
	)
}

export default SignUpForm
