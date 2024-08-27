import { formatAmount } from '@/lib/utils'
import Link from 'next/link'
import React from 'react'
import { BiLogoVisa } from 'react-icons/bi'
import Copy from './Copy'

const BankCard = ({
	account,
	userName,
	showBalance = true,
	stackNumber = 0,
}: CreditCardProps) => {
	return (
		<div className={`flex flex-col ${stackNumber === 2 && 'items-center'}`}>
			<Link
				href="/"
				className={`bank-card relative overflow-hidden ${
					stackNumber === 2 && '!w-[290px]'
				}`}>
				<div className="bank-card_content">
					<div>
						<h1 className="text-20 text-white">{userName}</h1>
					</div>

					<article className="flex flex-col gap-2">
						<div className="flex justify-between">
							<h1 className="text-12 font-medium text-white">
								{account?.name || ''}
							</h1>
							<h2 className="text-[8px] font-semibold text-white">
								&#9679; &#9679; / &#9679; &#9679;
							</h2>
						</div>
						<p className="text-[8px] tracking-[3px] text-white">
							&#9679;&#9679;&#9679;&#9679; &#9679;&#9679;&#9679;&#9679;
							&#9679;&#9679;&#9679;&#9679;{' '}
							<span className="text-14 tracking-normal">{account?.mask}</span>
						</p>
						{stackNumber === 1 && (
							<p className="text-20 tracking-wider font-semibold text-white">
								{formatAmount(account.currentBalance)}
							</p>
						)}
					</article>
				</div>

				<div className="bank-card_icon">
					<BiLogoVisa className="text-5xl text-white -mb-4" />
				</div>
				<div className="bank-card-circle_one"></div>
				<div className="bank-card-circle_two"></div>
			</Link>

			{showBalance && <Copy title={account?.shareableId} />}
		</div>
	)
}

export default BankCard
