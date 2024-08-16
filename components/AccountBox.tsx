import { formatAmount } from '@/lib/utils'
import Link from 'next/link'
import React from 'react'
import BankCard from './BankCard'

interface AccountBoxProps extends User, TotalBalanceBoxProps {}

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
							userName={`${user.firstName} ${user.lastName}`}
							showBalance={true}
						/>
					</div>
					{banks[1] && (
						<div className="absolute top-4 z-0 w-[90%]">
							<BankCard
								key={banks[1].$id}
								account={banks[1]}
								userName={`${user.firstName} ${user.lastName}`}
								showBalance={false}
							/>
						</div>
					)}
				</div>
			)}
		</section>
	)
}

export default AccountBox
