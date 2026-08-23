import { connection } from 'next/server'
import SignUpForm from '@/components/SignUp/SignUpForm'
import Navbar from '@/components/Navbar'

const SignUp = async () => {
	await connection()
	return (
		<section className="flex-center size-full px-6 bg-white rounded-t-3xl">
			<SignUpForm />
		</section>
	)
}

export default SignUp
