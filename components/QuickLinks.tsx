'use client'

import { quickLinks } from '@/constants'
import Link from 'next/link'
import { IconType } from 'react-icons/lib'
import { toast } from 'sonner'

const QuickLinks = () => {
	return (
		<div>
			<div className="grid grid-cols-4 gap-2 justify-items-center">
				{quickLinks.map((link) => {
					const { Icon, route, label, toastText, demoToast } = link
					const disabled = route === '#'
					return (
						<div key={label}>
							{disabled ? (
								<button
									onClick={() => toast.warning(`${toastText}`)}
									className={`quicklink ${
										disabled ? 'cursor-default' : 'cursor-pointer'
									}`}>
									<QuickLink Icon={Icon} disabled={disabled} label={label} />
								</button>
							) : (
								<Link href={route} className={'quicklink'}>
									<QuickLink Icon={Icon} disabled={disabled} label={label} />
								</Link>
							)}
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
