import { connection } from 'next/server'
import { getLoggedInUser } from '@/lib/actions/user.actions'
import VerifyEmail from '@/components/auth/VerifyEmail'

const Verification = async () => {
	await connection()
	const loggedIn = await getLoggedInUser()
	if (!loggedIn) return null

	return (
		<section className="flex-center w-full h-[calc(100vh-72px)] bg-white">
			<VerifyEmail email={loggedIn.email} />
		</section>
	)
}

export default Verification
