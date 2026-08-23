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
			{config.illustration && (
				<div className="flex justify-center my-8">
					<Image
						src={config.illustration.src}
						height={165}
						width={213}
						alt={config.illustration.alt}
					/>
				</div>
			)}

			{config.heading && (
				<header className="flex flex-col gap-5 md:gap-8">
					<div className="flex flex-col gap-1 md:gap-3">
						<h1 className="text-24 lg:text-36 font-semibold text-primary-700 text-center">
							{config.heading}
						</h1>
						<p className="text-12 font-normal text-gray-600 text-center">
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
							<Link className="text-right text-12" href="/forgot-password">
								Forgot password?
							</Link>
						</div>
					)}

					<div className="flex flex-col gap-4">
						{serverError && <p className="form-message">{serverError}</p>}
						<Button type="submit" disabled={isLoading}>
							{isLoading ? (
								<>
									<Loader2 size={20} className="animate-spin" /> &nbsp; Loading...
								</>
							) : (
								config.submitLabel
							)}
						</Button>
					</div>
				</form>
			</Form>

			<footer className="flex justify-center gap-1">
				<p className="text-14 font-normal text-gray-600">{config.footer.prompt}</p>
				<Link href={config.footer.linkHref} className="form-link">
					{config.footer.linkLabel}
				</Link>
			</footer>
		</section>
	)
}

export default AuthForm
