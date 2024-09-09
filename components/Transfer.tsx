'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { BiExport, BiSend, BiSolidBank, BiTransferAlt } from 'react-icons/bi'
import { Label } from '@radix-ui/react-label'

const FormSchema = z.object({
	type: z.enum(['send', 'internal', 'external'], {
		required_error: 'You need to select a transaction type.',
	}),
})

const Transfer = () => {
	const form = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
	})

	return (
		<FormField
			control={form.control}
			name="type"
			render={({ field }) => (
				<FormItem className="space-y-3">
					<FormLabel>Choose transaction</FormLabel>
					<FormControl>
						<RadioGroup
							onValueChange={field.onChange}
							defaultValue={field.value}
							className="grid grid-cols-3 gap-4">
							<div>
								<RadioGroupItem
									value="send"
									id="send"
									className="peer sr-only"
								/>
								<Label
									htmlFor="send"
									className="h-28 flex flex-col items-center justify-between rounded-xl bg-gray-200 shadow-lg p-4 text-center text-sm hover:bg-gray-300 peer-data-[state=checked]:bg-primary-700 [&:has([data-state=checked])]:bg-primary-700 peer-data-[state=checked]:text-white [&:has([data-state=checked])]:text-white">
									<BiExport className="mb-3 h-6 w-6" />
									Send
									<br />
									Money
								</Label>
							</div>
							<div>
								<RadioGroupItem
									value="internal"
									id="internal"
									className="peer sr-only"
								/>
								<Label
									htmlFor="internal"
									className="h-28 flex flex-col items-center justify-between rounded-xl bg-gray-200 shadow-lg p-4 text-center text-sm hover:bg-gray-300 peer-data-[state=checked]:bg-primary-700 [&:has([data-state=checked])]:bg-primary-700 peer-data-[state=checked]:text-white [&:has([data-state=checked])]:text-white">
									<BiTransferAlt className="mb-3 h-6 w-6" />
									Internal Transfer
								</Label>
							</div>
							<div>
								<RadioGroupItem
									value="external"
									id="external"
									className="peer sr-only"
								/>
								<Label
									htmlFor="external"
									className="h-28 flex flex-col items-center justify-between rounded-xl bg-gray-200 shadow-lg p-4 text-center text-sm hover:bg-gray-300 peer-data-[state=checked]:bg-primary-700 [&:has([data-state=checked])]:bg-primary-700 peer-data-[state=checked]:text-white [&:has([data-state=checked])]:text-white">
									<BiSolidBank className="mb-3 h-6 w-6" />
									External Transfer
								</Label>
							</div>
						</RadioGroup>
					</FormControl>
					<FormMessage />
				</FormItem>
			)}
		/>
	)
}

export default Transfer
