'use client'

import { useCallback, useState } from 'react'
import { useForm, useFormState, useWatch } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { ChevronLeft, CircleCheckBigIcon, CircleIcon } from 'lucide-react'
import Link from 'next/link'
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
import { passwordRequirements } from '@/lib/utils'
import { Item, ItemContent, ItemMedia, ItemTitle } from './ui/item'

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
		mode: 'onChange',
		defaultValues: {
			email: '',
			password: '',
			confirmPassword: '',
		},
	})

	const { control } = form

	const password = useWatch({ control, name: 'password' })

	const { dirtyFields, errors } = useFormState({ control: form.control })

	const requiredFields = (
		['email', 'password', 'confirmPassword'] as const
	).filter((field) => config.fields[field])

	const isFilledForm = requiredFields.every((field) => dirtyFields[field])
	const isFormValid = requiredFields.every((field) => !errors[field])
	const canSubmit = isFilledForm && isFormValid

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
					{type !== 'signin' && (
						<div className="flex flex-center h-8 w-8 bg-cloud rounded-full">
							<ChevronLeft size={12} />
						</div>
					)}
					<div className="flex flex-col gap-1 md:gap-3">
						<h1 className="text-3xl font-bold">{config.heading}</h1>
						<p className="text-sm text-ink/70 font-serif italic">
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
							placeholder="Email"
							required
						/>
					)}

					{config.fields.password && (
						<CustomInput
							control={form.control}
							name="password"
							label="Password"
							placeholder={
								type === 'reset-pw' ? 'Enter new password' : 'Password'
							}
							required
						/>
					)}

					{type === 'reset-pw' && (
						<div className="grid grid-cols-2 grid-rows-2 gap-2">
							{passwordRequirements.map(({ label, test }) => {
								const met = test(password ?? '')
								return (
									<Item className="p-0" size="sm" key={label} asChild>
										<div>
											<ItemMedia
												className={
													met ? 'text-semantic-success' : 'text-ink/30'
												}>
												{met ? (
													<CircleCheckBigIcon className="size-5" />
												) : (
													<CircleIcon className="size-5" />
												)}
											</ItemMedia>
											<ItemContent>
												<ItemTitle
													className={`text-xs! ${met ? 'text-black' : 'text-ink/70'}`}>
													{label}
												</ItemTitle>
											</ItemContent>
										</div>
									</Item>
								)
							})}
						</div>
					)}

					{config.fields.confirmPassword && (
						<CustomInput
							control={form.control}
							name="confirmPassword"
							label="Confirm Password"
							placeholder={
								type === 'reset-pw'
									? 'Re-enter new password'
									: 'Confirm your password'
							}
							required
						/>
					)}

					{config.fields.forgotPasswordLink && (
						<div className="flex justify-end mt-1!">
							<Link
								className="text-right text-sm text-ink/70"
								href="/forgot-password">
								Forgot your password?
							</Link>
						</div>
					)}

					<div className="flex flex-col gap-4">
						{serverError && <p className="form-message">{serverError}</p>}
						<Button
							type="submit"
							disabled={isLoading || !canSubmit}
							className="py-5 text-base shadow-xl">
							{isLoading ? <>Signing in...</> : config.submitLabel}
						</Button>
					</div>
				</form>
			</Form>

			<footer className="flex justify-center gap-1">
				<p className="text-sm font-normal text-ink/70">
					{config.footer.prompt}
				</p>
				{config.footer.linkHref && (
					<Link href={config.footer.linkHref} className="form-link">
						{config.footer.linkLabel}
					</Link>
				)}
			</footer>
		</section>
	)
}

export default AuthForm
