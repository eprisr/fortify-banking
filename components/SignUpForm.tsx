'use client'

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { signupSchema, signupStepOneSchema } from '@/lib/utils'
import { type SignUpValues } from '@/lib/auth-form-config'
import { signUp } from '@/lib/actions/user.actions'
import CustomInput from './CustomInput'
import PlaidLink from './PlaidLink'
import { type Path } from 'react-hook-form'

const STEP_ONE_FIELDS = Object.keys(signupStepOneSchema.shape) as Path<SignUpValues>[]

const SignUpForm = () => {
	const [step, setStep] = useState<1 | 2>(1)
	const [user, setUser] = useState<User | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	const [serverError, setServerError] = useState('')

	const form = useForm<SignUpValues>({
		resolver: zodResolver(signupSchema),
		mode: 'onSubmit',
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

	const handleNext = async () => {
		const valid = await form.trigger(STEP_ONE_FIELDS)
		if (valid) setStep(2)
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
			<div className="flex justify-center my-8">
				<Image
					src="/icons/signup.svg"
					height={165}
					width={213}
					alt="Sign Up Mobile Illustration"
				/>
			</div>

			<header className="flex flex-col gap-5 md:gap-8">
				<div className="flex flex-col gap-1 md:gap-3">
					<h1 className="text-24 lg:text-36 font-semibold text-primary-700 text-center">
						Welcome to Fortify!
					</h1>
					<p className="text-12 font-normal text-gray-600 text-center">
						Hello there, create a new account.
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
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
							{step === 1 && (
								<>
									<div className="flex gap-4">
										<CustomInput
											control={form.control}
											name="firstName"
											label="First Name"
											placeholder="Jane"
											required
										/>
										<CustomInput
											control={form.control}
											name="lastName"
											label="Last Name"
											placeholder="Doe"
											required
										/>
									</div>
									<CustomInput
										control={form.control}
										name="email"
										label="Email"
										placeholder="email@email.com"
										required
									/>
									<CustomInput
										control={form.control}
										name="password"
										label="Password"
										placeholder="Password"
										required
									/>
								</>
							)}

							{step === 2 && (
								<>
									<CustomInput
										control={form.control}
										name="address1"
										label="Address"
										placeholder="Enter your specific address"
										required
									/>
									<CustomInput
										control={form.control}
										name="city"
										label="City"
										placeholder="Enter your city"
										required
									/>
									<div className="flex gap-4">
										<CustomInput
											control={form.control}
											name="state"
											label="State"
											placeholder="Example: NY"
											required
										/>
										<CustomInput
											control={form.control}
											name="postalCode"
											label="Postal Code"
											placeholder="Example: 11101"
											required
										/>
									</div>
									<div className="flex gap-4">
										<CustomInput
											control={form.control}
											name="dateOfBirth"
											label="Date of Birth"
											placeholder="YYYY-MM-DD"
											required
										/>
										<CustomInput
											control={form.control}
											name="ssn"
											label="SSN"
											placeholder="Example: 1234"
											required
										/>
									</div>
								</>
							)}

							<div className="flex flex-col gap-4">
								{serverError && <p className="form-message">{serverError}</p>}

								{step === 1 ? (
									<Button
										type="button"
										onClick={handleNext}
										className="form-btn">
										Next
									</Button>
								) : (
									<div className="flex gap-4">
										<Button
											type="button"
											variant="outline"
											onClick={() => setStep(1)}
											className="form-btn">
											Back
										</Button>
										<Button
											type="submit"
											disabled={isLoading}
											className="form-btn">
											{isLoading ? (
												<>
													<Loader2 size={20} className="animate-spin" /> &nbsp; Loading...
												</>
											) : (
												'Sign Up'
											)}
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
