import AccountBox from '@/components/AccountBox'
import { homeLinks } from '@/constants'
import { getAccount, getAccounts } from '@/lib/actions/bank.actions'
import { getLoggedInUser } from '@/lib/actions/user.actions'
import Link from 'next/link'
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
				<AccountBox
					user={loggedIn}
					accounts={accountsData}
					banks={accountsData?.slice(0, 2)}
					totalBanks={accounts?.totalBanks}
					totalBalance={accounts?.totalBalance}
				/>
				<div className="grid grid-cols-3 gap-4 justify-items-center">
					{homeLinks.map((link) => {
						const { Icon, route, label, color } = link
						return (
							<div key={label} className="h-24 w-24 rounded-2xl shadow-2xl">
								<Link
									href={route}
									className="grid grid-rows-2 gap-3 items-center justify-items-center text-center p-3">
									<Icon className="text-[28px]" style={{ color: `${color}` }} />
									<p className="text-12 text-[#979797]">{label}</p>
								</Link>
							</div>
						)
					})}
				</div>
			</div>
		</section>
	)
}

export default Home
