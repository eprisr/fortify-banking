import { connection } from 'next/server'
import SignUpForm from '@/components/SignUp/SignUpForm'
import Navbar from '@/components/Navbar'

const SignUp = async () => {
	await connection()
	return (
		<>
			<Navbar type="sub" pageTitle="Sign up" background />
			<section className="flex-center size-full max-sm:px-6 bg-white rounded-t-3xl">
				<SignUpForm />
			</section>
		</>
	)
}

export default SignUp
