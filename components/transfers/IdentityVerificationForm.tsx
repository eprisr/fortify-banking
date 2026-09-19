'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Shield } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import { verifyIdentity } from '@/lib/actions/user.actions'
import { dwollaSchema } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form'
import { CTA_BUTTON } from './styles'

const FIELD_INPUT =
	'w-full rounded-2xl bg-muted px-4 py-3.5 text-sm text-foreground outline-none placeholder:text-muted-foreground'

interface IdentityVerificationFormProps {
	onVerified: () => void
	onCancel: () => void
}

export const IdentityVerificationForm = ({
	onVerified,
	onCancel,
}: IdentityVerificationFormProps) => {
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [retryRequested, setRetryRequested] = useState(false)
	const [blockedReason, setBlockedReason] = useState('')
	const [serverError, setServerError] = useState('')

	const form = useForm<z.infer<typeof dwollaSchema>>({
		resolver: zodResolver(dwollaSchema),
		defaultValues: {
			address1: '',
			city: '',
			state: '',
			postalCode: '',
			dateOfBirth: '',
			ssn: '',
		},
	})

	const submit = async (data: z.infer<typeof dwollaSchema>) => {
		setIsSubmitting(true)
		setServerError('')

		const res = await verifyIdentity(data)
		setIsSubmitting(false)

		if (!res.success) {
			setServerError(res.error)
			return
		}

		if (res.data.status === 'verified') {
			onVerified()
			return
		}

		if (res.data.status === 'retry') {
			setRetryRequested(true)
			form.setValue('ssn', '')
			setServerError('')
			return
		}

		setBlockedReason(
			res.data.status === 'document'
				? "We couldn't verify you automatically from this information. Document upload isn't supported yet — please contact support."
				: 'Your account could not be verified. Please contact support.',
		)
	}

	if (blockedReason) {
		return (
			<div className="flex flex-col gap-4">
				<p className="text-sm text-foreground">{blockedReason}</p>
				<Button type="button" variant="secondary" className={CTA_BUTTON} onClick={onCancel}>
					Back
				</Button>
			</div>
		)
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(submit)} className="flex flex-col gap-4">
				<div className="flex gap-3 rounded-2xl bg-gold/10 px-4 py-3.5">
					<Shield className="size-5 shrink-0 text-gold" />
					<p className="text-xs text-foreground">
						Federal law requires us to verify your identity before you can send
						money. This unlocks transfers, bill pay, top-ups, and withdrawals —
						all at once. Your information is encrypted and never shared.
					</p>
				</div>

				<FormField
					control={form.control}
					name="dateOfBirth"
					render={({ field }) => (
						<FormItem>
							<FormLabel className="sr-only">Date of birth</FormLabel>
							<FormControl>
								<input type="date" className={FIELD_INPUT} {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="ssn"
					render={({ field }) => (
						<FormItem>
							<FormLabel className="sr-only">
								{retryRequested ? 'Full Social Security Number' : 'Last 4 digits of your SSN'}
							</FormLabel>
							<FormControl>
								<input
									placeholder={
										retryRequested ? 'Full Social Security Number' : 'Last 4 digits of SSN'
									}
									inputMode="numeric"
									maxLength={retryRequested ? 9 : 4}
									className={FIELD_INPUT}
									{...field}
								/>
							</FormControl>
							{retryRequested && (
								<p className="text-xs text-muted-foreground">
									We couldn&apos;t confirm your identity from the last 4 digits
									alone — your full SSN gives us enough to verify you.
								</p>
							)}
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="address1"
					render={({ field }) => (
						<FormItem>
							<FormLabel className="sr-only">Street address</FormLabel>
							<FormControl>
								<input placeholder="Street address" className={FIELD_INPUT} {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="grid grid-cols-3 gap-3">
					<FormField
						control={form.control}
						name="city"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="sr-only">City</FormLabel>
								<FormControl>
									<input placeholder="City" className={FIELD_INPUT} {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="state"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="sr-only">State</FormLabel>
								<FormControl>
									<input placeholder="State" maxLength={2} className={FIELD_INPUT} {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="postalCode"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="sr-only">ZIP</FormLabel>
								<FormControl>
									<input
										placeholder="ZIP"
										inputMode="numeric"
										className={FIELD_INPUT}
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				{serverError && (
					<p className="text-xs font-medium text-destructive">{serverError}</p>
				)}

				<Button type="submit" disabled={isSubmitting} className={CTA_BUTTON}>
					{isSubmitting ? (
						<>
							<Loader2 size={18} className="animate-spin" /> Verifying…
						</>
					) : (
						'Verify identity'
					)}
				</Button>
				<Button
					type="button"
					variant="secondary"
					className={CTA_BUTTON}
					onClick={onCancel}>
					Back
				</Button>
			</form>
		</Form>
	)
}
