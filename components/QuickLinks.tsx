'use client'

import { quickLinks } from '@/constants'
import Link from 'next/link'
import { IconType } from 'react-icons/lib'
import { toast } from 'sonner'

interface QuickLinksProps {
	isDemoUser?: boolean
}

const QuickLinks = ({ isDemoUser = false }: QuickLinksProps) => {
	return (
		<div>
			<div className="grid grid-cols-4 gap-2 justify-items-center">
				{quickLinks.map((link) => {
					const { Icon, route, label, toastText, demoToast } = link
					const demoBlocked = isDemoUser && route !== '#' && !!demoToast
					const disabled = route === '#' || demoBlocked
					const message = route === '#' ? toastText : demoToast

					return (
						<div key={label}>
							<Link
								href={disabled ? '#' : route}
								onClick={
									disabled
										? (e) => {
												e.preventDefault()
												toast.warning(`${message}`)
											}
										: undefined
								}
								className={`quicklink ${
									disabled ? 'cursor-default' : 'cursor-pointer'
								}`}>
								<QuickLink Icon={Icon} disabled={disabled} label={label} />
							</Link>
						</div>
					)
				})}
			</div>
		</div>
	)
}

export default QuickLinks

interface QuickLinkProps {
	Icon: IconType
	disabled: boolean
	label: string
}

const QuickLink = ({ Icon, disabled, label }: QuickLinkProps) => {
	return (
		<>
			<div className="flex-center h-14 w-14 bg-cloud rounded-2xl">
				<Icon
					className={`text-xl ${disabled ? 'text-primary/30' : 'text-primary'}`}
				/>
			</div>
			<p
				className={`text-xs font-semibold ${disabled ? 'text-ink/30' : 'text-ink'}`}>
				{label}
			</p>
		</>
	)
}
