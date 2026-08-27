'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useReducer, useState } from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import { transferFunds } from '@/lib/actions/user.actions'
import { formatAmount, transferFormSchema } from '@/lib/utils'

import { BankDropdown } from './BankDropdown'
import { Button } from './ui/button'
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from './ui/form'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import Transfer from './Transfer'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from './ui/card'
import Contacts from './Contacts'
import { consoleIntegration } from '@sentry/nextjs'

const PaymentTransferForm = ({
	accounts,
	isDemo = false,
}: PaymentTransferFormProps) => {
	const router = useRouter()
	const [isLoading, setIsLoading] = useState(false)
	const [contact, setContact] = useState()

	const populateContact = (contact: any) => {
		setContact(contact)
	}

	const digitsToAmount = (raw: string) =>
		formatAmount(Number(raw.replace(/\D/g, '')) / 100)

	const [value, setValue] = useReducer(
		(_: any, next: string) => digitsToAmount(next),
		'',
	)

	function handleChange(realChangeFn: Function, formattedValue: string) {
		realChangeFn(digitsToAmount(formattedValue))
	}

	const formSchema = transferFormSchema()

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			recipientName: '',
			recipientEmail: '',
			amount: '',
			senderBank: '',
			sharableId: '',
			note: '',
		},
	})

	const submit = async (data: z.infer<typeof formSchema>) => {
		if (isDemo) return
		setIsLoading(true)

		try {
			const res = await transferFunds({
				senderBankDocumentId: data.senderBank,
				receiverShareableId: data.sharableId,
				amount: data.amount,
				recipientName: data.recipientName,
				recipientEmail: data.recipientEmail,
				note: data.note,
			})

			if (!res.success) throw new Error(res.error)

			form.reset()
			router.push('/')
		} catch (error) {
			console.error('Submitting create transfer request failed: ', error)
		}

		setIsLoading(false)
	}

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(submit)}
				className="flex flex-col gap-4">
				<FormField
					control={form.control}
					name="senderBank"
					render={() => (
						<FormItem>
							<div className="payment-transfer_form-item pb-6 pt-5">
								<div className="payment-transfer_form-content">
									<FormLabel className="text-sm font-medium text-gray-700 sr-only">
										Select Source Bank
									</FormLabel>
									<FormDescription className="text-xs font-normal text-gray-600 sr-only">
										Select the bank account you want to transfer funds from
									</FormDescription>
								</div>
								<div className="flex w-full flex-col">
									<FormControl>
										<BankDropdown
											accounts={accounts}
											setValue={form.setValue}
											otherStyles="!w-full rounded-2xl"
										/>
									</FormControl>
									<FormMessage className="text-xs text-red-500" />
								</div>
							</div>
						</FormItem>
					)}
				/>

				<Transfer />
				<Contacts setContact={populateContact} />

				<Card className="mt-4 shadow-xl border-none">
					<CardHeader>
						<CardTitle>Recipient Information</CardTitle>
						<CardDescription>Select or add a new recipient</CardDescription>
					</CardHeader>
					<CardContent>
						<FormField
							control={form.control}
							name="recipientName"
							render={({ field }) => (
								<FormItem>
									<div className="payment-transfer_form-item pb-5 pt-6">
										<FormLabel className="text-sm w-full max-w-70 font-medium text-gray-700">
											Recipient&apos;s Name
										</FormLabel>
										<div className="flex w-full flex-col">
											<FormControl>
												<Input placeholder="J Doe" {...field} />
											</FormControl>
											<FormMessage className="text-xs text-red-500" />
										</div>
									</div>
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="recipientEmail"
							render={({ field }) => (
								<FormItem>
									<div className="payment-transfer_form-item py-5">
										<FormLabel className="text-sm w-full max-w-70 font-medium text-gray-700">
											Recipient&apos;s Email Address
										</FormLabel>
										<div className="flex w-full flex-col">
											<FormControl>
												<Input placeholder="ex: johndoe@email.com" {...field} />
											</FormControl>
											<FormMessage className="text-xs text-red-500" />
										</div>
									</div>
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="sharableId"
							render={({ field }) => (
								<FormItem>
									<div className="payment-transfer_form-item pb-5 pt-6">
										<FormLabel className="text-sm w-full max-w-70 font-medium text-gray-700">
											Recipient&apos;s Sharable Id
										</FormLabel>
										<div className="flex w-full flex-col">
											<FormControl>
												<Input
													placeholder="ex: fdewkl8JF23fS93ngr8984"
													{...field}
												/>
											</FormControl>
											<FormMessage className="text-xs text-red-500" />
										</div>
									</div>
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="amount"
							render={({ field }) => {
								field.value = value
								const _change = field.onChange

								return (
									<FormItem>
										<div className="payment-transfer_form-item py-5">
											<FormLabel className="text-sm w-full max-w-70 font-medium text-gray-700">
												Amount
											</FormLabel>
											<div className="flex w-full flex-col relative currency-input">
												<FormControl>
													<Input
														className="pl-16"
														placeholder="ex: 5.00"
														type="text"
														{...field}
														onChange={(ev) => {
															setValue(ev.target.value)
															handleChange(_change, ev.target.value)
														}}
														value={value}
													/>
												</FormControl>
												<FormMessage className="text-xs text-red-500" />
											</div>
										</div>
									</FormItem>
								)
							}}
						/>

						<FormField
							control={form.control}
							name="note"
							render={({ field }) => (
								<FormItem>
									<div className="payment-transfer_form-item pb-6 pt-5">
										<div className="payment-transfer_form-content">
											<FormLabel className="text-sm font-medium text-gray-700">
												Transfer Note (Optional)
											</FormLabel>
											<FormDescription className="text-xs font-normal text-gray-600">
												Please provide any additional information or
												instructions related to the transfer
											</FormDescription>
										</div>
										<div className="flex w-full flex-col">
											<FormControl>
												<Textarea
													placeholder="Write a short note here"
													{...field}
												/>
											</FormControl>
											<FormMessage className="text-xs text-red-500" />
										</div>
									</div>
								</FormItem>
							)}
						/>

						<div className="payment-transfer_btn-box">
							<Button
								type="submit"
								disabled={isDemo || isLoading}
								className="w-full">
								{isLoading ? (
									<>
										<Loader2 size={20} className="animate-spin" /> &nbsp;
										Sending...
									</>
								) : (
									'Transfer Funds'
								)}
							</Button>
							{isDemo && (
								<p className="form-message mt-1 text-center">
									Transfers aren&apos;t available in demo mode.
								</p>
							)}
						</div>
					</CardContent>
				</Card>
			</form>
		</Form>
	)
}

export default PaymentTransferForm
