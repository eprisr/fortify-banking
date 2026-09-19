import { Check } from 'lucide-react'
import { formatAmount } from '@/lib/utils'
import { getAccountDisplay } from './display'

interface AccountsSummaryProps {
	accounts: Account[]
}

export const AccountsSummary = ({ accounts }: AccountsSummaryProps) => {
	const total = accounts.reduce((sum, account) => {
		const { balance, isLiability } = getAccountDisplay(account)
		return sum + (isLiability ? -balance : balance)
	}, 0)

	return (
		<div className="flex flex-col gap-3 rounded-2xl bg-muted px-5 py-5">
			<span className="text-sm text-muted-foreground">
				Total balance across accounts
			</span>
			<span className="font-mono text-4xl font-bold text-foreground">
				{formatAmount(total)}
			</span>
			<div className="flex items-center justify-between">
				<span className="flex items-center gap-1.5 text-sm font-semibold text-sage">
					<Check className="size-4" />
					All {accounts.length} accounts connected
				</span>
				<span className="text-xs text-muted-foreground">Updated just now</span>
			</div>
		</div>
	)
}
