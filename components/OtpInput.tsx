'use client'

import { useRef } from 'react'
import { FormField, FormItem, FormLabel, FormMessage } from './ui/form'
import * as VisuallyHiddenPrimative from '@radix-ui/react-visually-hidden'
import { Control, FieldPath, FieldValues } from 'react-hook-form'

interface OtpInputProps<T extends FieldValues> {
	control: Control<T>
	name: FieldPath<T>
	label: string
	length: number
	numeric?: boolean
}

function OtpInput<T extends FieldValues>({
	control,
	name,
	label,
	length,
	numeric,
}: OtpInputProps<T>) {
	const inputRefs = useRef<(HTMLInputElement | null)[]>([])
	const pattern = numeric ? /[0-9]/ : /[a-zA-Z0-9]/

	return (
		<FormField
			control={control}
			name={name}
			render={({ field, fieldState }) => {
				const value: string = field.value ?? ''
				const digits = Array.from({ length }, (_, i) => value[i] ?? '')

				const focusInput = (index: number) => {
					inputRefs.current[index]?.focus()
				}

				const handleChange = (index: number, raw: string) => {
					const char = raw.slice(-1)
					if (char && !pattern.test(char)) return

					const next = digits.slice()
					next[index] = char
					field.onChange(next.join(''))

					if (char && index < length - 1) focusInput(index + 1)
				}

				const handleKeyDown = (
					index: number,
					e: React.KeyboardEvent<HTMLInputElement>,
				) => {
					if (e.key === 'Backspace') {
						const next = digits.slice()
						if (next[index]) {
							next[index] = ''
							field.onChange(next.join(''))
						} else if (index > 0) {
							next[index - 1] = ''
							field.onChange(next.join(''))
							focusInput(index - 1)
						}
						return
					}
					if (e.key === 'ArrowLeft' && index > 0) {
						e.preventDefault()
						focusInput(index - 1)
					}
					if (e.key === 'ArrowRight' && index < length - 1) {
						e.preventDefault()
						focusInput(index + 1)
					}
				}

				const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
					e.preventDefault()
					const pasted = e.clipboardData
						.getData('text')
						.trim()
						.split('')
						.filter((char) => pattern.test(char))
						.join('')
						.slice(0, length)

					field.onChange(pasted)
					focusInput(Math.min(pasted.length, length - 1))
				}

				return (
					<FormItem className="form-item">
						<VisuallyHiddenPrimative.Root>
							<FormLabel className="form-label">{label}</FormLabel>
						</VisuallyHiddenPrimative.Root>
						<div
							className="grid gap-2"
							style={{ gridTemplateColumns: `repeat(${length}, minmax(0, 1fr))` }}
							onPaste={handlePaste}>
							{digits.map((digit, index) => (
								<input
									key={index}
									ref={(el) => {
										inputRefs.current[index] = el
									}}
									id={index === 0 ? name : undefined}
									aria-label={`${label} — character ${index + 1} of ${length}`}
									value={digit}
									onChange={(e) => handleChange(index, e.target.value)}
									onKeyDown={(e) => handleKeyDown(index, e)}
									onBlur={field.onBlur}
									inputMode={numeric ? 'numeric' : 'text'}
									autoCapitalize="none"
									autoCorrect="off"
									spellCheck={false}
									maxLength={1}
									className="h-14 w-full min-w-0 rounded-lg border border-input bg-cloud text-center text-lg font-semibold outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset focus-visible:bg-white"
								/>
							))}
						</div>
						{fieldState.isTouched && <FormMessage className="form-message" />}
					</FormItem>
				)
			}}
		/>
	)
}

export default OtpInput
