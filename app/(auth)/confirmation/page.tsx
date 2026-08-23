import Navbar from '@/components/Navbar'
import Confirmation from '@/components/Confirmation'
import { connection } from 'next/server'

const Conf = async ({ searchParams }: SearchParamProps) => {
	await connection()
	const { connected } = await searchParams

	return (
		<>
			<Navbar type="sub" pageTitle="Welcome" />
			<section className="flex-center w-full h-[calc(100vh-72px)] px-6 bg-white">
				<Confirmation connected={connected === 'true'} />
			</section>
		</>
	)
}

export default Conf
