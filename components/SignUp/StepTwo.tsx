'use client'

import CustomInput from '@/components/CustomInput'
import { type SignUpValues } from '@/lib/auth-form-config'
import { type Control } from 'react-hook-form'

interface StepTwoProps {
	control: Control<SignUpValues>
}

const StepTwo = ({ control }: StepTwoProps) => {
	return (
		<>
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
}

export default StepTwo
