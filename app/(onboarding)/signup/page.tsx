import { connection } from 'next/server'
import SignUpForm from '@/components/SignUp/SignUpForm'

const SignUp = async () => {
	await connection()
	return (
		<section className="flex justify-center size-full bg-white">
			<SignUpForm />
		</section>
	)
}

export default SignUp
