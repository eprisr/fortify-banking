'use client'

import CustomInput from '@/components/CustomInput'
import { Item, ItemContent, ItemMedia, ItemTitle } from '@/components/ui/item'
import { CircleIcon, CircleCheckBigIcon } from 'lucide-react'
import { passwordRequirements } from '@/lib/utils'
import { type SignUpValues } from '@/lib/auth-form-config'
import { type Control } from 'react-hook-form'

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
					placeholder="Jane"
					required
				/>
				<CustomInput
					control={control}
					name="lastName"
					label="Last Name"
					placeholder="Doe"
					required
				/>
			</div>
			<CustomInput
				control={control}
				name="email"
				label="Email"
				placeholder="email@email.com"
				required
			/>
			<CustomInput
				control={control}
				name="password"
				label="Password"
				placeholder="Password"
				required
			/>
			{passwordRequirements.map(({ label, test }) => {
				const met = test(password ?? '')
				return (
					<Item className="p-0" size="sm" key={label} asChild>
						<div>
							<ItemMedia className={met ? 'text-green-600' : 'text-gray-300'}>
								{met ? (
									<CircleCheckBigIcon className="size-4" />
								) : (
									<CircleIcon className="size-4" />
								)}
							</ItemMedia>
							<ItemContent>
								<ItemTitle
									className={`text-10! ${met ? 'text-black' : 'text-gray-300'}`}>
									{label}
								</ItemTitle>
							</ItemContent>
						</div>
					</Item>
				)
			})}
		</>
	)
}

export default StepOne
