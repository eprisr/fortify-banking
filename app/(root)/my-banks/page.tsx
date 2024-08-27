import BankCard from '@/components/BankCard'
import { getAccounts } from '@/lib/actions/bank.actions'
import { getLoggedInUser } from '@/lib/actions/user.actions'
import React from 'react'

const MyBanks = async () => {
	const loggedIn = await getLoggedInUser()
	const accounts = await getAccounts({ userId: loggedIn.$id })

	return (
		<section className="flex bg-white rounded-t-3xl">
			<div className="my-banks">
				<div>
					<h2 className="header-2 mb-4">Account and Card</h2>
					<div className="flex flex-wrap justify-center gap-6">
						{accounts &&
							accounts.data.map((a: Account) => (
								<BankCard
									key={accounts.id}
									account={a}
									userName={loggedIn?.firstName}
								/>
							))}
					</div>
				</div>
			</div>
		</section>
	)
}

export default MyBanks
