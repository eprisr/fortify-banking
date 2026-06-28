import Navbar from '@/components/Navbar'
import Confirmation from '@/components/Confirmation'
import { connection } from 'next/server'

const Conf = async () => {
	await connection()
	return (
		<>
			<Navbar type="sub" pageTitle="Welcome" />
			<section className="flex-center size-full max-sm:px-6 bg-white">
				<Confirmation />
			</section>
		</>
	)
}

export default Conf
