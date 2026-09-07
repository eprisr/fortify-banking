import Link from 'next/link'
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

type SettingRowShellProps = {
	Icon: LucideIcon
	label: string
	subText: string
	href?: string
	children: ReactNode
}

const rowClassName =
	'flex items-center justify-between bg-cloud rounded-lg p-4 my-2'

const SettingRowShell = ({
	Icon,
	label,
	subText,
	href,
	children,
}: SettingRowShellProps) => {
	const content = (
		<>
			<div className="flex items-center gap-2">
				<Icon size={20} className="m-2" />
				<div>
					<p className="text-sm font-semibold">{label}</p>
					<p className="text-xs text-gray-400">{subText}</p>
				</div>
			</div>
			{children}
		</>
	)

	if (href) {
		return (
			<Link href={href} className={rowClassName}>
				{content}
			</Link>
		)
	}

	return <div className={rowClassName}>{content}</div>
}

export default SettingRowShell
