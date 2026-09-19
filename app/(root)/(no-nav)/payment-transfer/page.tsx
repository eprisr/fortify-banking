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
			<Suspense>
				<PaymentTransferForm
					accounts={accountsData}
					currentUser={loggedIn}
					needsBankLink={!!accounts?.isSampleData}
					isDemo={isDemoUserId(loggedIn?.$id)}
				/>
			</Suspense>
		</section>
	)
}

export default Transfer
