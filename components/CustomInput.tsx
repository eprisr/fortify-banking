'use client'

import { useState } from 'react'
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from './ui/form'
import { Input } from './ui/input'
import * as VisuallyHiddenPrimative from '@radix-ui/react-visually-hidden'
import { Control, FieldPath, FieldValues } from 'react-hook-form'

interface CustomInputProps<T extends FieldValues> {
	control: Control<T>
	name: FieldPath<T>
	label: string
	placeholder: string
	required?: boolean
}

function CustomInput<T extends FieldValues>({
	control,
	name,
	label,
	placeholder,
	required,
}: CustomInputProps<T>) {
	const [visible, setVisible] = useState(false)
	const isPasswordField = name === 'password' || name === 'confirmPassword'

	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => (
				<FormItem className="form-item">
					<VisuallyHiddenPrimative.Root>
						<FormLabel className="form-label">
							{label}
							{required && <sup>*</sup>}
						</FormLabel>
					</VisuallyHiddenPrimative.Root>
					<div className="relative flex w-full flex-col bg-cloud rounded-lg">
						<FormControl>
							<Input
								placeholder={placeholder}
								type={
									isPasswordField
										? visible
											? 'text'
											: 'password'
										: name === 'email' || name === 'recipientEmail'
											? 'email'
											: 'text'
								}
								id={name}
								// Mobile keyboards auto-capitalize the first letter of a plain
								// text input, which silently turns a valid email/password into
								// a mismatched credential. Disable that here.
								autoCapitalize="none"
								autoCorrect="off"
								spellCheck={false}
								className={`h-14 px-5 border-none text-base! placeholder:text-base placeholder:text-ink/40 ${isPasswordField ? 'pr-16' : ''}`}
								{...field}
							/>
						</FormControl>
						{isPasswordField && (
							<button
								type="button"
								onClick={() => setVisible((prev) => !prev)}
								className="absolute right-5 top-1/2 -translate-y-1/2 text-xs font-semibold tracking-wide text-ink/60 transition-colors hover:text-plum">
								{visible ? 'HIDE' : 'SHOW'}
							</button>
						)}
					</div>
				</FormItem>
			)}
		/>
	)
}

export default CustomInput
