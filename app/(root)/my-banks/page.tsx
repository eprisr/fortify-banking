import BankCard from '@/components/BankCard'
import Navbar from '@/components/Navbar'
import { getAccounts } from '@/lib/actions/bank.actions'
import { getLoggedInUser } from '@/lib/actions/user.actions'
import React from 'react'

const MyBanks = async () => {
	const loggedIn = await getLoggedInUser()
	const accounts = await getAccounts({ userId: loggedIn.$id })

	return (
		<>
			<Navbar type="sub" pageTitle="Account and Card" />
			<section className="flex bg-white">
				<div className="my-banks">
					<div>
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
		</>
	)
}

export default MyBanks
