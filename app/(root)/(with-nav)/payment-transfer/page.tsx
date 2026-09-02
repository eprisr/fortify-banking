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
			<Navbar type="sub" pageTitle="Transfer" />
			<section className="payment-transfer size-full">
				<Suspense>
					<PaymentTransferForm
						accounts={accountsData}
						isDemo={isDemoUserId(loggedIn?.$id)}
					/>
				</Suspense>
			</section>
		</>
	)
}

export default Transfer
