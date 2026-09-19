'use client'

import { MoreVertical } from 'lucide-react'
import { useState } from 'react'
import { formatAmount } from '@/lib/utils'
import { AccountOptionsSheet } from './AccountOptionsSheet'
import { getAccountDisplay } from './display'

interface AccountFullCardProps {
	account: Account
	onCollapse: () => void
}

export const AccountFullCard = ({
	account,
	onCollapse,
}: AccountFullCardProps) => {
	const [menuOpen, setMenuOpen] = useState(false)
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
		<div
			className={`flex w-full flex-col overflow-hidden rounded-3xl text-paper ${cardBg}`}>
			<span className={`block h-1 w-full ${accentBg}`} />

			<div className="flex flex-col gap-5 px-5 pt-5">
				<div className="flex items-start justify-between gap-3">
					<button
						type="button"
						onClick={onCollapse}
						className="min-w-0 text-left">
						<span className="block text-lg font-bold">{account.name}</span>
						<span className="block text-xs text-paper/70">{cardSubtitle}</span>
					</button>
					<span className="flex shrink-0 flex-col items-end gap-2">
						<span className="flex max-w-28 items-center gap-1.5 text-xs text-paper/70">
							<InstitutionIcon className="size-3.5 shrink-0" />
							<span className="truncate">{account.institutionName}</span>
						</span>
						<span className="flex items-center gap-2">
							<span className="rounded-lg border border-gold-decorative px-2 py-1 font-mono text-xs text-gold-decorative uppercase">
								{badgeLabel}
							</span>
							<button
								type="button"
								aria-label="Account options"
								onClick={() => setMenuOpen(true)}
								className="flex size-7 shrink-0 items-center justify-center rounded-full border border-paper/20 text-paper/70">
								<MoreVertical className="size-4" />
							</button>
						</span>
					</span>
				</div>

				<button
					type="button"
					onClick={onCollapse}
					className="flex flex-col gap-5 pb-5 text-left">
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
			</div>

			<div className="mx-5 border-t border-paper/15" />

			<div className="px-5 py-4">
				<button
					type="button"
					className="w-full rounded-xl border border-paper/20 py-2.5 text-sm font-semibold">
					Statements
				</button>
			</div>

			<AccountOptionsSheet
				account={account}
				open={menuOpen}
				onOpenChange={setMenuOpen}
			/>
		</div>
	)
}
