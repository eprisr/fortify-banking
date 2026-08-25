import { connection } from 'next/server'
import SignUpForm from '@/components/SignUp/SignUpForm'
import Navbar from '@/components/Navbar'

const SignUp = async () => {
	await connection()
	return (
		<section className="flex-center size-full bg-white">
			<SignUpForm />
		</section>
	)
}

export default SignUp
