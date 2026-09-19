'use client'

import { formatAmount } from '@/lib/utils'
import { getAccountDisplay } from './display'

interface AccountRowProps {
	account: Account
	onSelect: () => void
}

export const AccountRow = ({ account, onSelect }: AccountRowProps) => {
	const { RowIcon, rowDescriptor, balance } = getAccountDisplay(account)

	return (
		<button
			type="button"
			onClick={onSelect}
			className="flex w-full items-center gap-3 rounded-2xl bg-muted px-4 py-3.5 text-left">
			<span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
				<RowIcon className="size-5" />
			</span>
			<span className="min-w-0 flex-1">
				<span className="block truncate text-sm font-bold text-foreground">
					{account.name}
				</span>
				<span className="block font-mono text-xs text-muted-foreground">
					•••• {account.mask} · {rowDescriptor}
				</span>
			</span>
			<span className="shrink-0 font-mono text-base font-bold text-foreground">
				{formatAmount(balance)}
			</span>
		</button>
	)
}
