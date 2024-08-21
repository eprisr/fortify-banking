import AccountBox from '@/components/AccountBox'
import HeaderBox from '@/components/HeaderBox'
import { getAccount, getAccounts } from '@/lib/actions/bank.actions'
import { getLoggedInUser } from '@/lib/actions/user.actions'
import React from 'react'

const Home = async ({ searchParams: { id, page } }: SearchParamProps) => {
	const loggedIn = await getLoggedInUser()
	const accounts = await getAccounts({ userId: loggedIn.$id })

	if (!accounts) return

	const accountsData = accounts?.data
	const appwriteItemId = (id as string) || accountsData[0]?.appwriteItemId

	const account = await getAccount({ appwriteItemId })

	return (
		<section className="home bg-white rounded-t-3xl">
			<div className="home-content">
				<header className="home-header">
					<HeaderBox
						type="greeting"
						title="Good Morning,"
						user={loggedIn?.firstName || 'Guest'}
						subtext=""
					/>
				</header>
				<AccountBox
					user={loggedIn}
					accounts={accountsData}
					banks={accountsData?.slice(0, 2)}
					totalBanks={accounts?.totalBanks}
					totalBalance={accounts?.totalBalance}
				/>
			</div>
		</section>
	)
}

export default Home
