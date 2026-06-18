import React from 'react'
import { Control } from 'react-hook-form'
import { z } from 'zod'
import { authFormSchema } from '@/lib/utils'
import CustomInput from './CustomInput'

const formSchema = authFormSchema('signup')

interface SignUpFieldsProps {
	control: Control<z.infer<typeof formSchema>>
}

const SignUpFields = ({ control }: SignUpFieldsProps) => (
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
			name="address1"
			label="Address"
			placeholder="Enter your specific address"
			required
		/>
		<CustomInput
			control={control}
			name="city"
			label="City"
			placeholder="Enter your city"
			required
		/>
		<div className="flex gap-4">
			<CustomInput
				control={control}
				name="state"
				label="State"
				placeholder="Example: NY"
				required
			/>
			<CustomInput
				control={control}
				name="postalCode"
				label="Postal Code"
				placeholder="Example: 11101"
				required
			/>
		</div>
		<div className="flex gap-4">
			<CustomInput
				control={control}
				name="dateOfBirth"
				label="Date of Birth"
				placeholder="YYYY-MM-DD"
				required
			/>
			<CustomInput
				control={control}
				name="ssn"
				label="SSN"
				placeholder="Example: 1234"
				required
			/>
		</div>
	</>
)

export default SignUpFields
