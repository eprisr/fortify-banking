import AccountBox from '@/components/AccountBox'
import Navbar from '@/components/Navbar'
import { homeLinks } from '@/constants'
import { getAccount, getAccounts } from '@/lib/actions/bank.actions'
import { getLoggedInUser } from '@/lib/actions/user.actions'
import Link from 'next/link'
import React from 'react'

const Home = async ({ searchParams: { id } }: SearchParamProps) => {
	const loggedIn = await getLoggedInUser()
	const accounts = await getAccounts({ userId: loggedIn?.$id })

	if (!accounts) return

	const accountsData = accounts?.data
	const appwriteItemId = (id as string) || accountsData[0]?.appwriteItemId

	return (
		<>
			<Navbar user={loggedIn} type="main" background />
			<section className="home bg-white rounded-t-3xl min-h-[calc(100vh_-_152px)]">
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
							const disabled = route === '#'
							return (
								<div key={label} className="h-24 w-24 rounded-2xl shadow-card">
									<Link
										href={route}
										className={`grid grid-rows-2 gap-3 items-center justify-items-center text-center p-3 ${
											disabled ? 'cursor-default' : 'cursor-pointer'
										}`}>
										<Icon
											className="text-[28px]"
											style={{ color: `${disabled ? '#898989' : color}` }}
										/>
										<p className="text-12 text-gray-400">{label}</p>
									</Link>
								</div>
							)
						})}
					</div>
				</div>
			</section>
		</>
	)
}

export default Home
