import { LinkedAccountsList } from '@/components/accounts/LinkedAccountsList'
import HeaderBox from '@/components/shared/HeaderBox'
import { getAccounts } from '@/lib/actions/bank.actions'
import { getLoggedInUser } from '@/lib/actions/user.actions'

const MyBanks = async () => {
	const loggedIn = await getLoggedInUser()
	const accounts = await getAccounts({ userId: loggedIn?.$id })
	const accountsData: Account[] = accounts?.data ?? []
	const userName =
		[loggedIn?.firstName, loggedIn?.lastName].filter(Boolean).join(' ') ||
		'Guest'

	return (
		<div className="flex flex-col gap-6">
			<HeaderBox title="Accounts" subtext="" />
			<LinkedAccountsList accounts={accountsData} userName={userName} />
		</div>
	)
}

export default MyBanks
