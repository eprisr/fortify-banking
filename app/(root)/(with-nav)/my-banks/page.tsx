import { AccountsSummary } from '@/components/accounts/AccountsSummary'
import { LinkedAccountsList } from '@/components/accounts/LinkedAccountsList'
import HeaderBox from '@/components/shared/HeaderBox'
import { getAccounts } from '@/lib/actions/bank.actions'
import { getLoggedInUser } from '@/lib/actions/user.actions'

const MyBanks = async () => {
	const loggedIn = await getLoggedInUser()
	const accounts = await getAccounts({ userId: loggedIn?.$id })
	const accountsData: Account[] = accounts?.data ?? []

	return (
		<div className="flex flex-col gap-6">
			<HeaderBox title="Accounts" subtext="" />
			<AccountsSummary accounts={accountsData} />
			<LinkedAccountsList accounts={accountsData} />
		</div>
	)
}

export default MyBanks
