'use client'

import { formatAmount } from '@/lib/utils'
import { getAccountDisplay } from './display'

interface AccountFullCardProps {
	account: Account
	onCollapse: () => void
}

export const AccountFullCard = ({ account, onCollapse }: AccountFullCardProps) => {
	const {
		InstitutionIcon,
		badgeLabel,
		rowDescriptor,
		cardSubtitle,
		detailLine,
		balanceLabel,
		balance,
		cardBg,
		accentBg,
	} = getAccountDisplay(account)

	return (
		<div className={`flex w-full flex-col overflow-hidden rounded-3xl text-paper ${cardBg}`}>
			<span className={`block h-1 w-full ${accentBg}`} />
			<button
				type="button"
				onClick={onCollapse}
				className="flex flex-col gap-5 px-5 py-5 text-left">
				<span className="flex items-start justify-between">
					<span>
						<span className="block text-lg font-bold">{account.name}</span>
						<span className="block text-xs text-paper/70">{cardSubtitle}</span>
					</span>
					<span className="flex flex-col items-end gap-2">
						<span className="flex items-center gap-1.5 text-xs text-paper/70">
							<InstitutionIcon className="size-3.5" />
							{account.institutionName}
						</span>
						<span className="rounded-lg border border-gold-decorative px-2 py-1 font-mono text-xs text-gold-decorative uppercase">
							{badgeLabel}
						</span>
					</span>
				</span>

				<span className="block font-mono text-lg tracking-widest">
					•••• •••• •••• {account.mask}
				</span>

				<span className="flex flex-col gap-1">
					<span className="text-xs text-paper/70">{balanceLabel}</span>
					<span className="font-mono text-3xl tracking-wide">
						{formatAmount(balance)}
					</span>
					{account.subtype === 'savings' && (
						<span className="text-xs text-paper/70">{rowDescriptor}</span>
					)}
					{account.subtype === 'credit' && account.creditLimit && (
						<span className="text-xs text-paper/70">
							{formatAmount(account.availableBalance)} available of{' '}
							{formatAmount(account.creditLimit)} limit
						</span>
					)}
					{detailLine && (
						<span className="text-xs text-paper/70">{detailLine}</span>
					)}
				</span>
			</button>

			<div className="mx-5 border-t border-paper/15" />

			<div className="flex gap-3 px-5 py-4">
				<button
					type="button"
					className="flex-1 rounded-xl border border-paper/20 py-2.5 text-sm font-semibold">
					Statements
				</button>
				<button
					type="button"
					className="flex-1 rounded-xl border border-paper/20 py-2.5 text-sm font-semibold">
					Remove account
				</button>
			</div>
		</div>
	)
}
