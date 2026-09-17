'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, ShieldCheck } from 'lucide-react'
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
import { Input } from '@/components/ui/input'

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
				<Button type="button" variant="secondary" onClick={onCancel}>
					Back
				</Button>
			</div>
		)
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(submit)} className="flex flex-col gap-4">
				<div className="flex gap-3 rounded-lg bg-accent px-4 py-3">
					<ShieldCheck className="size-5 shrink-0 text-accent-foreground" />
					<p className="text-xs text-foreground">
						Federal law requires us to verify your identity before you can send
						money to another person. This unlocks transfers to others going
						forward. Your information is encrypted and never shared.
					</p>
				</div>

				<div className="grid grid-cols-2 gap-3">
					<FormField
						control={form.control}
						name="address1"
						render={({ field }) => (
							<FormItem className="col-span-2">
								<FormLabel>Street address</FormLabel>
								<FormControl>
									<Input placeholder="123 Main St" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="city"
						render={({ field }) => (
							<FormItem>
								<FormLabel>City</FormLabel>
								<FormControl>
									<Input placeholder="City" {...field} />
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
								<FormLabel>State</FormLabel>
								<FormControl>
									<Input placeholder="NY" maxLength={2} {...field} />
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
								<FormLabel>ZIP code</FormLabel>
								<FormControl>
									<Input placeholder="10001" inputMode="numeric" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="dateOfBirth"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Date of birth</FormLabel>
								<FormControl>
									<Input type="date" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<FormField
					control={form.control}
					name="ssn"
					render={({ field }) => (
						<FormItem>
							<FormLabel>
								{retryRequested
									? 'Full Social Security Number'
									: 'Last 4 digits of your SSN'}
							</FormLabel>
							<FormControl>
								<Input
									placeholder={retryRequested ? '123456789' : '1234'}
									inputMode="numeric"
									maxLength={retryRequested ? 9 : 4}
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

				{serverError && (
					<p className="text-xs font-medium text-destructive">{serverError}</p>
				)}

				<div className="flex flex-col gap-2">
					<Button type="submit" disabled={isSubmitting}>
						{isSubmitting ? (
							<>
								<Loader2 size={16} className="animate-spin" /> Verifying…
							</>
						) : (
							'Verify identity'
						)}
					</Button>
					<Button type="button" variant="secondary" onClick={onCancel}>
						Back
					</Button>
				</div>
			</form>
		</Form>
	)
}
