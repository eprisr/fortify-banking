import { formatAmount } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { BiLogoVisa } from 'react-icons/bi'

const BankCard = ({
	account,
	userName,
	showBalance = true,
}: CreditCardProps) => {
	return (
		<div className="flex flex-col">
			<Link href="/" className="bank-card relative overflow-hidden">
				<div className="bank-card_content">
					<div>
						<h1 className="text-20 text-white">{userName}</h1>
					</div>

					<article className="flex flex-col gap-2">
						<div className="flex justify-between">
							<h1 className="text-12 font-semibold text-white">
								{account?.name || ''}
							</h1>
							<h2 className="text-10 font-semibold text-white">
								&#9679;&#9679; / &#9679;&#9679;
							</h2>
						</div>
						<p className="text-10 tracking-[1.1px] text-white">
							&#9679;&#9679;&#9679;&#9679; &#9679;&#9679;&#9679;&#9679;
							&#9679;&#9679;&#9679;&#9679;{' '}
							<span className="text-16">{account?.mask}</span>
						</p>
						{showBalance && (
							<p className="text-20 font-semibold text-white">
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
		</div>
	)
}

export default BankCard
