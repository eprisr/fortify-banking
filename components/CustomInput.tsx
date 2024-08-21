import React from 'react'
import { FormControl, FormField, FormLabel, FormMessage } from './ui/form'
import { Input } from './ui/input'
import { Control, FieldPath } from 'react-hook-form'
import { z } from 'zod'
import { authFormSchema } from '@/lib/utils'

const formSchema = authFormSchema('signup')

interface CustomInputProps {
	control: Control<z.infer<typeof formSchema>>
	name: FieldPath<z.infer<typeof formSchema>>
	label: string
	placeholder: string
	required: boolean
}

const CustomInput = ({
	control,
	name,
	label,
	placeholder,
	required,
}: CustomInputProps) => {
	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => (
				<div className="form-item">
					<FormLabel className="form-label">
						{label}
						{required && <sup>*</sup>}
					</FormLabel>
					<div className="flex w-full flex-col">
						<FormControl>
							<Input
								placeholder={placeholder}
								className="input-class"
								type={name === 'password' ? 'password' : 'text'}
								id={name}
								{...field}
							/>
						</FormControl>
						<FormMessage className="form-message mt-2" />
					</div>
				</div>
			)}
		/>
	)
}

export default CustomInput
