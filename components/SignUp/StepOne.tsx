'use client'

import CustomInput from '@/components/CustomInput'
import { Item, ItemContent, ItemMedia, ItemTitle } from '@/components/ui/item'
import { CircleIcon, CircleCheckBigIcon } from 'lucide-react'
import { passwordRequirements } from '@/lib/utils'
import { type SignUpValues } from '@/lib/auth-form-config'
import { type Control } from 'react-hook-form'
import { Field } from '../ui/field'
import { Label } from '../ui/label'
import { Checkbox } from '../ui/checkbox'
import { FormControl, FormField, FormItem, FormMessage } from '../ui/form'
import Link from 'next/link'

interface StepOneProps {
	control: Control<SignUpValues>
	password: string
}

const StepOne = ({ control, password }: StepOneProps) => {
	return (
		<>
			<div className="flex gap-4">
				<CustomInput
					control={control}
					name="firstName"
					label="First Name"
					placeholder="First name"
					required
				/>
				<CustomInput
					control={control}
					name="lastName"
					label="Last Name"
					placeholder="Last name"
					required
				/>
			</div>
			<CustomInput
				control={control}
				name="email"
				label="Email"
				placeholder="Email"
				required
			/>
			<CustomInput
				control={control}
				name="password"
				label="Password"
				placeholder="Password"
				required
			/>
			<div className="grid grid-cols-2 grid-rows-2 gap-2">
				{passwordRequirements.map(({ label, test }) => {
					const met = test(password ?? '')
					return (
						<Item className="gap-1.5 p-0" size="sm" key={label} asChild>
							<div>
								<ItemMedia
									className={met ? 'text-semantic-success' : 'text-ink/30'}>
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
			<FormField
				control={control}
				name="agreeToTerms"
				render={({ field }) => (
					<FormItem className="space-y-1">
						<Field orientation="horizontal" className="items-start">
							<FormControl>
								<Checkbox
									id="terms-checkbox"
									checked={field.value ?? false}
									onCheckedChange={field.onChange}
									className="h-5 w-5 rounded mr-1"
								/>
							</FormControl>
							<Label
								htmlFor="terms-checkbox"
								className="block text-xs leading-5 text-ink/70">
								By creating an account you agree to our{' '}
								<Link href="/terms" className="font-bold text-primary">
									Terms and Conditions
								</Link>
							</Label>
						</Field>
						<FormMessage className="form-message" />
					</FormItem>
				)}
			/>
		</>
	)
}

export default StepOne
