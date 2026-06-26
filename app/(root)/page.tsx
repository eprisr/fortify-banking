import AccountBox from '@/components/AccountBox'
import Navbar from '@/components/Navbar'
import PlaidLink from '@/components/PlaidLink'
import { quickLinks } from '@/constants'
import { getAccount, getAccounts } from '@/lib/actions/bank.actions'
import { getLoggedInUser } from '@/lib/actions/user.actions'
import Link from 'next/link'
import React from 'react'
import { MdInfoOutline, MdLockOutline } from 'react-icons/md'

const Home = async ({ searchParams }: SearchParamProps) => {
	const { id } = await searchParams
	const loggedIn = await getLoggedInUser()
	const accounts = await getAccounts({ userId: loggedIn?.$id })

	const accountsData = accounts?.data
	const emptyAccounts = accounts === 'UPDATE_MODE' || accounts.totalBanks === 0
	// const appwriteItemId = (id as string) || accountsData[0]?.appwriteItemId

	return (
		<>
			<Navbar user={loggedIn} type="main" background />
			<section className="home bg-white rounded-t-3xl min-h-[calc(100vh-152px)]">
				<div className="home-content">
					{emptyAccounts ? (
						<div className={`${emptyAccounts && 'account-update'}`}>
							<PlaidLink user={loggedIn} variant="reconnect" update />
						</div>
					) : (
						<AccountBox
							user={loggedIn}
							accounts={accountsData}
							banks={accountsData?.slice(0, 2)}
							totalBanks={accounts?.totalBanks}
							totalBalance={accounts?.totalBalance}
						/>
					)}
					<div>
						<div className="grid grid-cols-4 gap-2 justify-items-center">
							{quickLinks.map((link) => {
								const { Icon, route, label, color } = link
								const disabled = route === '#'
								return (
									<div
										key={label}
										className="h-fit w-18 rounded-2xl shadow-card">
										<Link
											href={route}
											className={`grid grid-rows-2 gap-3 items-center justify-items-center text-center p-2 ${
												disabled ? 'cursor-default' : 'cursor-pointer'
											}`}>
											<Icon
												className="text-[16px]"
												style={{ color: `${disabled ? '#898989' : color}` }}
											/>
											<p className="text-10 text-gray-400">{label}</p>
										</Link>
									</div>
								)
							})}
						</div>
					</div>
					{emptyAccounts && (
						<div>
							<div className="flex flex-center border-2 border-primary-100 bg-white p-5 rounded-lg w-full mb-3connect-box">
								<MdInfoOutline className="text-16 mr-2" />
								<div className="text-left mx-2 shrink-5">
									<h3 className="font-extrabold text-12">
										Your session expired
									</h3>
									<p className="font-extralight text-10 text-wrap">
										Re-link your bank to restore access. Takes under 30 seconds.
									</p>
								</div>
								<PlaidLink user={loggedIn} variant="relink" update />
							</div>
						</div>
					)}
				</div>
			</section>
		</>
	)
}

export default Home
