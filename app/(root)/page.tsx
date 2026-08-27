import AccountBox from '@/components/AccountBox'
import MonthSpend from '@/components/MonthSpend'
import Navbar from '@/components/Navbar'
import PlaidLink from '@/components/PlaidLink'
import QuickLinks from '@/components/QuickLinks'
import { RecentTransactions } from '@/components/RecentTransactions'
import { getAccount, getAccounts } from '@/lib/actions/bank.actions'
import { getLoggedInUser } from '@/lib/actions/user.actions'
import { CreditCard, TriangleAlert } from 'lucide-react'

const Home = async ({ searchParams }: SearchParamProps) => {
	const { id } = await searchParams
	const loggedIn = await getLoggedInUser()
	if (!loggedIn) return null

	const accounts = await getAccounts({ userId: loggedIn?.$id })

	const accountsData = accounts?.data
	const emptyAccount = accounts === 'UPDATE_MODE' || accounts?.totalBanks === 0
	const demoAccount = accountsData?.[0]?.id?.includes('demo') ?? false
	const appwriteItemId = (id as string) || accountsData?.[0]?.appwriteItemId
	const reconnectItemId = accounts?.needsReconnect?.[0]

	// No bank to look up (e.g. every linked bank needs re-authing at Plaid) —
	// skip the fetch instead of letting it round-trip to Appwrite/Plaid just
	// to fail predictably. The relink prompt below already covers this state.
	const account = appwriteItemId
		? await getAccount({ appwriteItemId })
		: undefined

	return (
		<>
			<Navbar user={loggedIn} type="main" />
			<section>
				<div className="home-content">
					{(emptyAccount || demoAccount) && (
						<div
							className={`connect-box ${demoAccount ? 'bg-gold-decorative/20' : 'bg-semantic-error/20'}`}>
							<div
								className={`flex-center shrink-0 h-10 w-10 rounded-sm ${demoAccount ? 'bg-gold/20' : 'bg-semantic-error/20'}`}>
								{demoAccount ? (
									<CreditCard size={16} className="text-gold" />
								) : (
									<TriangleAlert size={16} className="text-semantic-error" />
								)}
							</div>
							<div className="">
								<p className="text-sm font-semibold">
									{demoAccount
										? "You're viewing sample data"
										: 'Bank connection needs attention'}
								</p>
								<p className="text-xs text-ink/70">
									{demoAccount
										? 'Connect your bank to see your real accounts'
										: 'Reconnect your bank to keep your data current.'}
								</p>
							</div>
							<PlaidLink
								user={loggedIn}
								variant="reconnect"
								update={!!reconnectItemId}
								appwriteItemId={reconnectItemId}
								className="font-bold px-4"
							/>
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
				</div>
			</section>
		</>
	)
}

export default Home
