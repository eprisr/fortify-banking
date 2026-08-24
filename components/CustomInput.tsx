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
					<div className="flex w-full flex-col bg-cloud rounded-lg">
						<FormControl>
							<Input
								placeholder={placeholder}
								type={
									name === 'password' || name === 'confirmPassword'
										? 'password'
										: 'text'
								}
								id={name}
								className="h-14 px-5 border-none text-base! placeholder:text-base placeholder:text-ink/40"
								{...field}
							/>
						</FormControl>
						{name === 'password' ||
							(name === 'confirmPassword' && (
								<FormMessage className="form-message mt-2" />
							))}
					</div>
				</FormItem>
			)}
		/>
	)
}

export default CustomInput
