import { Clock, CreditCard, Landmark, type LucideIcon } from 'lucide-react'

interface AccountDisplay {
	RowIcon: LucideIcon
	InstitutionIcon: LucideIcon
	badgeLabel: string
	rowDescriptor: string
	balanceLabel: string
	balance: number
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
			balanceLabel: 'Statement balance',
			balance: account.currentBalance,
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
		balanceLabel: 'Available balance',
		balance: account.availableBalance,
		cardBg: 'bg-ink',
		accentBg: 'bg-gold-decorative',
	}
}
