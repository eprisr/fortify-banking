import AccountBox from '@/components/AccountBox'
import MonthSpend from '@/components/MonthSpend'
import Navbar from '@/components/Navbar'
import PlaidLink from '@/components/PlaidLink'
import QuickLinks from '@/components/QuickLinks'
import { getAccount, getAccounts } from '@/lib/actions/bank.actions'
import { getLoggedInUser } from '@/lib/actions/user.actions'
import { MdInfoOutline } from 'react-icons/md'

const Home = async ({ searchParams }: SearchParamProps) => {
	const { id } = await searchParams
	const loggedIn = await getLoggedInUser()
	const accounts = await getAccounts({ userId: loggedIn?.$id })

	const accountsData = accounts?.data
	const emptyAccounts = accounts === 'UPDATE_MODE' || accounts.totalBanks === 0
	const appwriteItemId = (id as string) || accountsData[0]?.appwriteItemId

	const account = await getAccount({ appwriteItemId })

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
					<QuickLinks />
					<MonthSpend transactions={account?.transactions} />
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
