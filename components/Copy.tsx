'use client'
import { useState } from 'react'
import { Button } from './ui/button'

const Copy = ({ text, classNames }: { text: string; classNames?: string }) => {
	const [hasCopied, setHasCopied] = useState(false)

	const copyToClipboard = () => {
		if (navigator.clipboard) {
			navigator.clipboard
				.writeText(text)
				.then((res) => {
					return { success: true }
				})
				.catch((err) => console.error('Failed to copy text:', err))

			const textarea = document.createElement('textarea')
			textarea.value = text
			textarea.style.cssText = 'position: absolute; left: -9999px;'
			document.body.appendChild(textarea)
			textarea.select()

			const success = document.execCommand('copy')
			document.body.removeChild(textarea)

			setHasCopied(true)
			return { success }
		}

		setTimeout(() => {
			setHasCopied(false)
		}, 2000)
	}

	return (
		<Button
			data-state="closed"
			className={`mt-3 flex max-w-[320px] gap-4 ${classNames}`}
			variant="secondary"
			onClick={copyToClipboard}>
			<p className="line-clamp-1 max-w-full text-xs font-medium text-neutral-800">
				Copy all
			</p>

			{!hasCopied ? (
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
					className="mr-2 size-4">
					<rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
					<path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
				</svg>
			) : (
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
					className="mr-2 size-4">
					<polyline points="20 6 9 17 4 12"></polyline>
				</svg>
			)}
		</Button>
	)
}

export default Copy
