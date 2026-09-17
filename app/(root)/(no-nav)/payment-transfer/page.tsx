import HeaderBox from '@/components/shared/HeaderBox'
import PaymentTransferForm from '@/components/PaymentTransferForm'
import { getAccounts } from '@/lib/actions/bank.actions'
import { getLoggedInUser } from '@/lib/actions/user.actions'
import { isDemoUserId } from '@/lib/demo-data'
import { Suspense } from 'react'

const Transfer = async () => {
	const loggedIn = await getLoggedInUser()
	const accounts = await getAccounts({ userId: loggedIn?.$id })

	const accountsData = accounts?.data

	return (
		<section className="size-full">
			<HeaderBox title="Transfer" subtext="" />
			<Suspense>
				<PaymentTransferForm
					accounts={accountsData}
					currentUserEmail={loggedIn?.email}
					isDemo={isDemoUserId(loggedIn?.$id)}
				/>
			</Suspense>
		</section>
	)
}

export default Transfer
