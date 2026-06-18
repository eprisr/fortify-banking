import BankCard from '@/components/BankCard'
import Navbar from '@/components/Navbar'
import { getAccounts } from '@/lib/actions/bank.actions'
import { getLoggedInUser } from '@/lib/actions/user.actions'
import React from 'react'

const MyBanks = async () => {
	let loggedIn = null
	let accounts = null

	try {
		loggedIn = await getLoggedInUser()

		if (loggedIn) {
			accounts = await getAccounts({ userId: loggedIn.$id })
		}
	} catch (error) {
		console.error('Failed to fetch user or accounts:', error)
	}

	if (!loggedIn) {
		// TODO: render temporary unauthenticated screen
		return null
	}

	return (
		<>
			<Navbar type="sub" pageTitle="Account and Card" />
			<section className="flex bg-white">
				<div className="my-banks">
					<div>
						<div className="flex flex-wrap justify-center gap-6">
							{accounts &&
								accounts.data.map((account: Account) => (
									<BankCard
										key={account.id}
										account={account}
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
