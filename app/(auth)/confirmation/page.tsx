import Navbar from '@/components/Navbar'
import Confirmation from '@/components/Confirmation'
import { connection } from 'next/server'

const Conf = async () => {
	await connection()
	return (
		<>
			<Navbar type="sub" pageTitle="Welcome" />
			<section className="flex-center w-full h-[calc(100vh-72px)] px-6 bg-white">
				<Confirmation />
			</section>
		</>
	)
}

export default Conf
