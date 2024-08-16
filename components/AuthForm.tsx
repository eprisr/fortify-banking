'use client'

import React, { useState } from 'react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import CustomInput from './CustomInput'
import { authFormSchema } from '@/lib/utils'

const AuthForm = ({ type }: { type: string }) => {
	const [user, setUser] = useState(null)

	const form = useForm<z.infer<typeof authFormSchema>>({
		resolver: zodResolver(authFormSchema),
		defaultValues: {
			email: '',
			password: '',
		},
	})

	function onSubmit(values: z.infer<typeof authFormSchema>) {
		console.log(values)
	}

	return (
		<section className="auth-form">
			<header className="flex flex-col gap-5 md:gap-8">
				<div className="flex flex-col gap-1 md:gap-3">
					<h1 className="text-24 lg:text-36 font-semibold text-gray-900">
						{user
							? 'Link Account'
							: type === 'signin'
							? 'Welcome Back'
							: 'Welcome to us,'}
						<p className="text-16 font-normal text-gray-600">
							{user
								? 'Hello there, sign in to continue'
								: 'Hello there, create New account'}
						</p>
					</h1>
				</div>
			</header>
			{user ? (
				<div className="flex flex-col gap-4">{/* Plaid Link */}</div>
			) : (
				<>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
							<CustomInput
								control={form.control}
								name="email"
								label="Email"
								placeholder="Enter your email"
							/>
							<CustomInput
								control={form.control}
								name="password"
								label="Password"
								placeholder="Enter your password"
							/>

							<Button type="submit">Submit</Button>
						</form>
					</Form>
				</>
			)}
		</section>
	)
}

export default AuthForm
