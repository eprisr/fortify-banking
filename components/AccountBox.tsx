import { formatAmount } from '@/lib/utils'
import React from 'react'

interface AccountBoxProps extends TotalBalanceBoxProps {}

const AccountBox = ({
	accounts = [],
	banks,
	totalBanks,
	totalBalance,
}: AccountBoxProps) => {
	return (
		<section className="total-balance">
			{/* <p>{user}</p> */}
			<p>Jane Smith</p>
			<p>{accounts[0]?.officialName || 'Bank Institution'}</p>
			<p>{accounts[0]?.mask || 'xxxx xxxx xxxx 0000'}</p>
			<p>{formatAmount(totalBalance)}</p>
		</section>
	)
}

export default AccountBox
