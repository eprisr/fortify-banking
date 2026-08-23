'use client'

import { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
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
		mode: 'onSubmit',
		defaultValues: {
			email: '',
			password: '',
			confirmPassword: '',
		},
	})

	const onSubmit = async (data: AuthFormValues) => {
		setIsLoading(true)
		setServerError('')
		try {
			await SUBMIT_HANDLERS[type](data, {
				router,
				pathname,
				createQueryString,
				resetParams,
			})
		} catch (error: any) {
			setServerError(error.message)
			console.error('Auth Error: ', error)
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<section className="auth-form">
			{config.heading && (
				<header className="flex flex-col gap-5 md:gap-8">
					<div className="flex flex-col gap-1 md:gap-3">
						<h1 className="text-2xl lg:text- font-bold">{config.heading}</h1>
						<p className="text-xs text-gray-600 font-serif italic">
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
							placeholder="email@email.com"
							required
						/>
					)}

					{config.fields.password && (
						<CustomInput
							control={form.control}
							name="password"
							label="Password"
							placeholder="Password"
							required
						/>
					)}

					{config.fields.confirmPassword && (
						<CustomInput
							control={form.control}
							name="confirmPassword"
							label="Confirm Password"
							placeholder="Confirm your password"
							required
						/>
					)}

					{config.fields.forgotPasswordLink && (
						<div className="flex justify-end mt-1!">
							<Link className="text-right text-xs" href="/forgot-password">
								Forgot password?
							</Link>
						</div>
					)}

					<div className="flex flex-col gap-4">
						{serverError && <p className="form-message">{serverError}</p>}
						<Button type="submit" disabled={isLoading}>
							{isLoading ? (
								<>
									<Loader2 size={20} className="animate-spin" /> &nbsp;
									Loading...
								</>
							) : (
								config.submitLabel
							)}
						</Button>
					</div>
				</form>
			</Form>

			<footer className="flex justify-center gap-1">
				<p className="text-sm font-normal text-gray-600">
					{config.footer.prompt}
				</p>
				<Link href={config.footer.linkHref} className="form-link">
					{config.footer.linkLabel}
				</Link>
			</footer>
		</section>
	)
}

export default AuthForm
