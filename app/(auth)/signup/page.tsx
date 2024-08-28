import AuthForm from '@/components/AuthForm'
import Navbar from '@/components/Navbar'
import React from 'react'

const SignUp = async () => {
	return (
		<>
			<Navbar type="sub" pageTitle="Sign up" background />
			<section className="flex-center size-full max-sm:px-6 bg-white rounded-t-3xl">
				<AuthForm type="signup" />
			</section>
		</>
	)
}

export default SignUp
