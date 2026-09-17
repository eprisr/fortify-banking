import Navbar from '@/components/Navbar'
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
		<>
			<Navbar type="sub" pageTitle="Transfer" user={loggedIn} />
			<section className="size-full">
				<Suspense>
					<PaymentTransferForm
						accounts={accountsData}
						currentUserEmail={loggedIn?.email}
						isDemo={isDemoUserId(loggedIn?.$id)}
					/>
				</Suspense>
			</section>
		</>
	)
}

export default Transfer
