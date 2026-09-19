import { Clock, CreditCard, Landmark, type LucideIcon } from 'lucide-react'

interface AccountDisplay {
	RowIcon: LucideIcon
	InstitutionIcon: LucideIcon
	badgeLabel: string
	rowDescriptor: string
	cardSubtitle: string
	detailLine?: string
	balanceLabel: string
	balance: number
	/** True for a balance that's money owed, not money held — subtract it in
	 * a cross-account total instead of adding it. */
	isLiability?: boolean
	cardBg: 'bg-ink' | 'bg-plum'
	accentBg: 'bg-gold-decorative' | 'bg-terracotta-decorative'
}

export const getAccountDisplay = (account: Account): AccountDisplay => {
	if (account.subtype === 'savings') {
		return {
			RowIcon: Clock,
			InstitutionIcon: Landmark,
			badgeLabel: 'SAVINGS',
			rowDescriptor: '4.10% APY',
			cardSubtitle: 'Auto-save on · 10% of deposits',
			balanceLabel: 'Total balance',
			balance: account.availableBalance,
			cardBg: 'bg-plum',
			accentBg: 'bg-gold-decorative',
		}
	}

	if (account.subtype === 'credit') {
		return {
			RowIcon: CreditCard,
			InstitutionIcon: CreditCard,
			badgeLabel: 'CREDIT',
			rowDescriptor: 'Statement balance',
			cardSubtitle: 'Rewards credit · opened 2022',
			balanceLabel: 'Statement balance',
			balance: account.currentBalance,
			isLiability: true,
			cardBg: 'bg-ink',
			accentBg: 'bg-terracotta-decorative',
		}
	}

	// checking (default)
	return {
		RowIcon: CreditCard,
		InstitutionIcon: Landmark,
		badgeLabel: 'DEBIT',
		rowDescriptor: 'Debit',
		cardSubtitle: 'Primary account · opened 2019',
		detailLine: 'Direct deposit active · Visa debit',
		balanceLabel: 'Available balance',
		balance: account.availableBalance,
		cardBg: 'bg-ink',
		accentBg: 'bg-gold-decorative',
	}
}
