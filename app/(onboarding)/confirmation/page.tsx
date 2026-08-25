import Navbar from '@/components/Navbar'
import Confirmation from '@/components/Confirmation'
import { connection } from 'next/server'
import { getLoggedInUser } from '@/lib/actions/user.actions'

const Conf = async ({ searchParams }: SearchParamProps) => {
	await connection()
	const { connected } = await searchParams

	const loggedIn = await getLoggedInUser()
	if (!loggedIn) return null

	return (
		<section className="flex-center w-full h-[calc(100vh-72px)] bg-white">
			<Confirmation connected={connected === 'true'} user={loggedIn} />
		</section>
	)
}

export default Conf
