import { formatAmount } from '@/lib/utils'
import Link from 'next/link'
import React from 'react'
import BankCard from './BankCard'

interface AccountBoxProps extends TotalBalanceBoxProps {
	user: User
}

const AccountBox = ({
	user,
	accounts = [],
	banks,
	totalBanks,
	totalBalance,
}: AccountBoxProps) => {
	return (
		<section className="banks">
			{banks?.length > 0 && (
				<div className="relative flex flex-1 flex-col items-center justify-center gap-5">
					<div className="relative z-10">
						<BankCard
							key={banks[0].$id}
							account={banks[0]}
							userName={`${user?.firstName} ${user.lastName}`}
							showBalance={false}
							stackNumber={1}
						/>
					</div>
					{banks[1] && (
						<div className="absolute top-2 z-0">
							<BankCard
								key={banks[1].$id}
								account={banks[1]}
								userName={`${user?.firstName} ${user.lastName}`}
								showBalance={false}
								stackNumber={2}
							/>
						</div>
					)}
				</div>
			)}
		</section>
	)
}

export default AccountBox
