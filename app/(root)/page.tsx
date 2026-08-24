import AccountBox from '@/components/AccountBox'
import MonthSpend from '@/components/MonthSpend'
import Navbar from '@/components/Navbar'
import PlaidLink from '@/components/PlaidLink'
import QuickLinks from '@/components/QuickLinks'
import { RecentTransactions } from '@/components/RecentTransactions'
import { getAccount, getAccounts } from '@/lib/actions/bank.actions'
import { getLoggedInUser } from '@/lib/actions/user.actions'
import { MdInfoOutline } from 'react-icons/md'

const Home = async ({ searchParams }: SearchParamProps) => {
	const { id } = await searchParams
	const loggedIn = await getLoggedInUser()
	if (!loggedIn) return null

	const accounts = await getAccounts({ userId: loggedIn?.$id })

	const accountsData = accounts?.data
	const emptyAccount = accounts === 'UPDATE_MODE' || accounts?.totalBanks === 0
	const demoAccount = accountsData?.[0]?.id?.includes('demo') ?? false
	const appwriteItemId = (id as string) || accountsData?.[0]?.appwriteItemId

	// No bank to look up (e.g. every linked bank needs re-authing at Plaid) —
	// skip the fetch instead of letting it round-trip to Appwrite/Plaid just
	// to fail predictably. The relink prompt below already covers this state.
	const account = appwriteItemId
		? await getAccount({ appwriteItemId })
		: undefined

	return (
		<>
			<Navbar user={loggedIn} type="main" background />
			<section className="home bg-white rounded-t-3xl min-h-[calc(100vh-152px)] mb-24">
				<div className="home-content">
					{(emptyAccount || demoAccount) && (
						<div className={`${emptyAccount && 'account-update'} mt-10`}>
							<PlaidLink user={loggedIn} variant="reconnect" update />
						</div>
					)}
					<AccountBox
						user={loggedIn}
						accounts={accountsData}
						banks={accountsData?.slice(0, 2)}
						totalBanks={accounts?.totalBanks}
						totalBalance={accounts?.totalBalance}
					/>
					<QuickLinks />
					<MonthSpend transactions={account?.transactions} />
					<RecentTransactions transactions={account?.transactions} />
					{emptyAccount && (
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
					{demoAccount && <PlaidLink user={loggedIn} variant="primary" />}
				</div>
			</section>
		</>
	)
}

export default Home
