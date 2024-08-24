'use client'

import React, { useState } from 'react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import CustomInput from './CustomInput'
import { authFormSchema } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { forgotPw, signIn, signUp } from '@/lib/actions/user.actions'
import PlaidLink from './PlaidLink'

const AuthForm = ({ type }: { type: string }) => {
	const router = useRouter()
	const [user, setUser] = useState(null)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState('')

	const renderHeader = type === 'signin' || type === 'signup'

	const formSchema = authFormSchema(type)

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		mode: 'onTouched',
		defaultValues: {
			firstName: '',
			lastName: '',
			address1: '',
			city: '',
			state: '',
			postalCode: '',
			dateOfBirth: '',
			ssn: '',
			email: '',
			password: '',
		},
	})

	const onSubmit = async (data: z.infer<typeof formSchema>) => {
		setIsLoading(true)

		try {
			const userData = {
				firstName: data.firstName!,
				lastName: data.lastName!,
				address1: data.address1!,
				city: data.city!,
				state: data.state!,
				postalCode: data.postalCode!,
				dateOfBirth: data.dateOfBirth!,
				ssn: data.ssn!,
				email: data.email!,
				password: data.password!,
			}
			if (type === 'signup') {
				const newUser = await signUp(userData)
				setUser(newUser)
			}
			if (type === 'signin') {
				const res = await signIn({
					email: data.email!,
					password: data.password!,
				})

				if (res.error) throw new Error(res.error)
				if (res) router.push('/')
			}
			if (type === 'forgot-pw') {
				const res = await forgotPw({
					email: data.email!,
				})

				if (res?.error) throw new Error(res.error)

				if (res) {
					setError('')
					router.push('/signin')
				}
			}
		} catch (error: any) {
			setError(error.message)
			console.error('Auth Error: ', error)
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<section className="auth-form">
			{renderHeader && (
				<header className="flex flex-col gap-5 md:gap-8">
					<div className="flex flex-col gap-1 md:gap-3">
						<h1 className="text-24 lg:text-36 font-semibold text-gray-900">
							{type === 'signin' ? 'Welcome Back' : 'Welcome to us,'}
							<p className="text-12 font-normal text-gray-600">
								{type === 'signin'
									? 'Hello there, sign in to continue'
									: 'Hello there, create New account'}
							</p>
						</h1>
					</div>
				</header>
			)}
			{type === 'signin' && (
				<div className="flex justify-center my-8">
					<Image
						src="/icons/signin.svg"
						height={165}
						width={213}
						alt="Sign In Lock Illustration"
					/>
				</div>
			)}
			{type === 'signup' && (
				<div className="flex justify-center my-8">
					<Image
						src="/icons/signup.svg"
						height={165}
						width={213}
						alt="Sign Up Mobile Illustration"
					/>
				</div>
			)}
			{user ? (
				<div className="flex flex-col gap-4">
					<PlaidLink user={user} variant="primary" />
				</div>
			) : (
				<>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
							{type === 'signup' && (
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

							{type !== 'reset-pw' && (
								<CustomInput
									control={form.control}
									name="email"
									label="Email"
									placeholder="email@email.com"
									required
								/>
							)}

							{type !== 'forgot-pw' && (
								<CustomInput
									control={form.control}
									name="password"
									label="Password"
									placeholder="Enter your password"
									required
								/>
							)}

							{type === 'reset-pw' && (
								<CustomInput
									control={form.control}
									name="confirmPassword"
									label="Confirm Password"
									placeholder="Confirm your password"
									required
								/>
							)}

							{type === 'signin' && (
								<div className="flex justify-end !mt-1">
									<Link className="text-right text-12" href="/forgot-password">
										Forgot your password?
									</Link>
								</div>
							)}

							<div className="flex flex-col gap-4">
								{error !== '' && <p className="form-message">{error}</p>}
								<Button
									type="submit"
									disabled={!form.formState.isValid || isLoading}
									className="form-btn">
									{isLoading ? (
										<>
											<Loader2 size={20} className="animate-spin" /> &nbsp;
											Loading...
										</>
									) : type === 'signin' ? (
										'Sign In'
									) : type === 'signup' ? (
										'Sign Up'
									) : (
										'Send'
									)}
								</Button>
							</div>
						</form>
					</Form>

					<footer className="flex justify-center gap-1">
						<p className="text-14 font-normal text-gray-600">
							{type === 'signin'
								? "Don't have an account?"
								: type === 'signup'
								? 'Already have an account?'
								: 'Remembered your password?'}
						</p>
						<Link
							href={type === 'signin' ? '/signup' : '/signin'}
							className="form-link">
							{type === 'signin' ? 'Sign Up' : 'Sign In'}
						</Link>
					</footer>
				</>
			)}
		</section>
	)
}

export default AuthForm
