'use client'

import { Bell, CreditCard, Moon, Shield, type LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { Switch } from '@/components/ui/switch'

interface Preference {
	key: string
	Icon: LucideIcon
	label: string
	subText: string
	defaultChecked: boolean
}

const PREFERENCES: Preference[] = [
	{
		key: 'push',
		Icon: Bell,
		label: 'Push Notifications',
		subText: 'Balance updates and general alerts',
		defaultChecked: true,
	},
	{
		key: 'transactions',
		Icon: CreditCard,
		label: 'Transaction Alerts',
		subText: 'Every time money moves in or out',
		defaultChecked: true,
	},
	{
		key: 'security',
		Icon: Shield,
		label: 'Security Alerts',
		subText: 'Sign-ins, password changes, new devices',
		defaultChecked: true,
	},
	{
		key: 'product',
		Icon: Moon,
		label: 'Product Updates',
		subText: 'New features and occasional tips',
		defaultChecked: false,
	},
]

export const NotificationPreferencesList = () => {
	const [checked, setChecked] = useState(() =>
		Object.fromEntries(PREFERENCES.map((p) => [p.key, p.defaultChecked])),
	)

	return (
		<div className="flex flex-col gap-3">
			{PREFERENCES.map(({ key, Icon, label, subText }) => (
				<div
					key={key}
					className="flex items-center gap-3 rounded-2xl bg-muted px-4 py-3.5">
					<span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
						<Icon className="size-5" />
					</span>
					<span className="min-w-0 flex-1">
						<span className="block text-sm font-bold text-foreground">
							{label}
						</span>
						<span className="block text-xs text-muted-foreground">
							{subText}
						</span>
					</span>
					<Switch
						checked={checked[key]}
						onCheckedChange={(value) =>
							setChecked((prev) => ({ ...prev, [key]: value }))
						}
					/>
				</div>
			))}
		</div>
	)
}
