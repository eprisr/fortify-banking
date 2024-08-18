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
import { signIn, signUp } from '@/lib/actions/user.actions'

const AuthForm = ({ type }: { type: string }) => {
	const router = useRouter()
	const [user, setUser] = useState(null)
	const [isLoading, setIsLoading] = useState(false)

	const formSchema = authFormSchema(type)

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: '',
			password: '',
		},
	})

	const onSubmit = async (data: z.infer<typeof formSchema>) => {
		setIsLoading(true)

		try {
			if (type === 'signup') {
				const newUser = await signUp(data)
				setUser(newUser)
			}
			if (type === 'signin') {
				const res = await signIn({
					email: data.email,
					password: data.password,
				})
				if (res) router.push('/')
			}
		} catch (error) {
			console.log(error)
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<section className="auth-form">
			<header className="flex flex-col gap-5 md:gap-8">
				<div className="flex flex-col gap-1 md:gap-3">
					<h1 className="text-24 lg:text-36 font-semibold text-gray-900">
						{type === 'signin' ? 'Welcome Back' : 'Welcome to us,'}
						<p className="text-16 font-normal text-gray-600">
							{type === 'signin'
								? 'Hello there, sign in to continue'
								: 'Hello there, create New account'}
						</p>
					</h1>
				</div>
			</header>
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
				<div className="flex flex-col gap-4">{/* Plaid Link */}</div>
			) : (
				<>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
							{type === 'signup' && (
								<>
									<div className="flex gap-4">
										<CustomInput
											control={form.control}
											name="firstName"
											label="First Name"
											placeholder="Jane"
										/>
										<CustomInput
											control={form.control}
											name="lastName"
											label="Last Name"
											placeholder="Doe"
										/>
									</div>
								</>
							)}

							<CustomInput
								control={form.control}
								name="email"
								label="Email"
								placeholder="email@email.com"
							/>
							<CustomInput
								control={form.control}
								name="password"
								label="Password"
								placeholder="Enter your password"
							/>

							<div className="flex flex-col gap-4">
								<Button type="submit" disabled={isLoading} className="form-btn">
									{isLoading ? (
										<>
											<Loader2 size={20} className="animate-spin" /> &nbsp;
											Loading...
										</>
									) : type === 'signin' ? (
										'Sign In'
									) : (
										'Sign Up'
									)}
								</Button>
							</div>
						</form>
					</Form>

					<footer className="flex justify-center gap-1">
						<p className="text-14 font-normal text-gray-600">
							{type === 'signin'
								? "Don't have an account?"
								: 'Already have an account?'}
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
