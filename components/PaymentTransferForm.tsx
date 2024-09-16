'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useReducer, useState } from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import { createTransfer } from '@/lib/actions/dwolla.actions'
import { createTransaction } from '@/lib/actions/transaction.actions'
import { getBank, getBankByAccountId } from '@/lib/actions/user.actions'
import { decryptId, formatAmount, transferFormSchema } from '@/lib/utils'

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

const PaymentTransferForm = ({ accounts }: PaymentTransferFormProps) => {
	const router = useRouter()
	const [isLoading, setIsLoading] = useState(false)

	const [value, setValue] = useReducer((_: any, next: string) => {
		const digits = next.replace(/\D/g, '')
		return formatAmount(Number(digits) / 100)
	}, '')

	function handleChange(realChangeFn: Function, formattedValue: string) {
		const digits = formattedValue.replace(/\D/g, '')
		const realValue = Number(digits) / 100
		realChangeFn(realValue)
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
		setIsLoading(true)

		try {
			const receiverAccountId = decryptId(data.sharableId)
			const receiverBank = await getBankByAccountId({
				accountId: receiverAccountId,
			})
			const senderBank = await getBank({ documentId: data.senderBank })

			const transferParams = {
				sourceFundingSourceUrl: senderBank.fundingSourceUrl,
				destinationFundingSourceUrl: receiverBank.fundingSourceUrl,
				amount: data.amount,
			}
			// create transfer
			const transfer = await createTransfer(transferParams)

			// create transfer transaction
			if (transfer) {
				const transaction = {
					name: data.recipientName,
					email: data.recipientEmail,
					amount: data.amount,
					senderId: senderBank.userId.$id,
					senderBankId: senderBank.$id,
					receiverId: receiverBank.userId.$id,
					receiverBankId: receiverBank.$id,
					note: data.note,
				}

				const newTransaction = await createTransaction(transaction)

				if (newTransaction) {
					form.reset()
					router.push('/')
				}
			}
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
									<FormLabel className="text-14 font-medium text-gray-700 sr-only">
										Select Source Bank
									</FormLabel>
									<FormDescription className="text-12 font-normal text-gray-600 sr-only">
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
									<FormMessage className="text-12 text-red-500" />
								</div>
							</div>
						</FormItem>
					)}
				/>

				<Transfer />
				<Contacts />

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
										<FormLabel className="text-14 w-full max-w-[280px] font-medium text-gray-700">
											Recipient&apos;s Name
										</FormLabel>
										<div className="flex w-full flex-col">
											<FormControl>
												<Input
													placeholder="Enter the recipient's name"
													className="input-class"
													{...field}
												/>
											</FormControl>
											<FormMessage className="text-12 text-red-500" />
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
										<FormLabel className="text-14 w-full max-w-[280px] font-medium text-gray-700">
											Recipient&apos;s Email Address
										</FormLabel>
										<div className="flex w-full flex-col">
											<FormControl>
												<Input
													placeholder="ex: johndoe@gmail.com"
													className="input-class"
													{...field}
												/>
											</FormControl>
											<FormMessage className="text-12 text-red-500" />
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
										<FormLabel className="text-14 w-full max-w-[280px] font-medium text-gray-700">
											Receiver&apos;s Plaid Sharable Id
										</FormLabel>
										<div className="flex w-full flex-col">
											<FormControl>
												<Input
													placeholder="Enter the public account number"
													className="input-class"
													{...field}
												/>
											</FormControl>
											<FormMessage className="text-12 text-red-500" />
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
											<FormLabel className="text-14 w-full max-w-[280px] font-medium text-gray-700">
												Amount
											</FormLabel>
											<div className="flex w-full flex-col relative currency-input">
												<FormControl>
													<Input
														className="input-class pl-16"
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
												<FormMessage className="text-12 text-red-500" />
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
											<FormLabel className="text-14 font-medium text-gray-700">
												Transfer Note (Optional)
											</FormLabel>
											<FormDescription className="text-12 font-normal text-gray-600">
												Please provide any additional information or
												instructions related to the transfer
											</FormDescription>
										</div>
										<div className="flex w-full flex-col">
											<FormControl>
												<Textarea
													placeholder="Write a short note here"
													className="input-class"
													{...field}
												/>
											</FormControl>
											<FormMessage className="text-12 text-red-500" />
										</div>
									</div>
								</FormItem>
							)}
						/>

						<div className="payment-transfer_btn-box">
							<Button
								type="submit"
								disabled={!form.formState.isValid || isLoading}
								className="form-btn w-full">
								{isLoading ? (
									<>
										<Loader2 size={20} className="animate-spin" /> &nbsp;
										Sending...
									</>
								) : (
									'Transfer Funds'
								)}
							</Button>
						</div>
					</CardContent>
				</Card>
			</form>
		</Form>
	)
}

export default PaymentTransferForm
