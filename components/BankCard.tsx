import { formatAmount } from '@/lib/utils'
import Link from 'next/link'
import React from 'react'
import { BiLogoVisa } from 'react-icons/bi'
import Copy from './Copy'
import { CreditCard, Landmark } from 'lucide-react'

const BankCard = ({
	account,
	userName,
	showBalance = true,
	stackNumber = 0,
}: CreditCardProps) => {
	const checking = account.subtype === 'checking'
	const savings = account.subtype === 'savings'
	const credit = account.subtype === 'credit'

	const balanceTitle = checking
		? 'Available balance'
		: savings
			? 'Total balance'
			: 'Statement balance'
	const accountBalance = checking
		? account.availableBalance
		: savings
			? account.availableBalance
			: account.currentBalance

	return (
		<div className={`flex flex-col ${stackNumber === 2 && 'items-center'}`}>
			<Link
				href="/"
				className={`bank-card relative overflow-hidden ${savings ? 'bg-plum' : 'bg-ink'}`}>
				{stackNumber === 1 && (
					<div className="bank-card_content">
						<div>
							<h1 className="text-md font-semibold">{userName}</h1>
							<p className="text-xxs text-paper/70 font-light">
								{account?.name || ''}
							</p>
						</div>

						<article className="flex flex-col gap-2">
							<p className="text-[6px] tracking-[3px] flex items-center font-mono">
								&#9679;&#9679;&#9679;&#9679; &#9679;&#9679;&#9679;&#9679;
								&#9679;&#9679;&#9679;&#9679;{' '}
								<span className="text-sm tracking-widest pl-2">
									{account?.mask}
								</span>
							</p>
							<p className="flex flex-col text-xl tracking-wider font-mono">
								<span className="text-xxs tracking-normal font-normal text-paper/70 font-sans">
									{balanceTitle}
								</span>
								{formatAmount(accountBalance)}
							</p>
							{savings && (
								<p className="text-xxs tracking-normal font-normal text-paper/70 font-sans">
									4.10 APY
								</p>
							)}
							{credit && account.creditLimit && (
								<p className="text-xxs tracking-wide font-normal text-paper/70 font-sans">
									{formatAmount(account.availableBalance)} available of{' '}
									{formatAmount(account?.creditLimit)} limit
								</p>
							)}
						</article>
					</div>
				)}
				<div className="bank-card_icon">
					<div className="flex items-center gap-2 text-xxs">
						{credit ? <CreditCard size={12} /> : <Landmark size={12} />}
						{account.institutionName}
					</div>
					<div className="border-[0.5] border-gold-decorative text-gold-decorative text-xxs text-center font-mono uppercase rounded-lg px-2 py-1">
						{account.subtype}
					</div>
				</div>
			</Link>

			{showBalance && <Copy title={account?.shareableId} />}
		</div>
	)
}

export default BankCard
