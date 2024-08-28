import AuthForm from '@/components/AuthForm'
import Navbar from '@/components/Navbar'
import React from 'react'

const SignIn = () => {
	return (
		<>
			<Navbar type="sub" pageTitle="Sign in" background />
			<section className="flex-center size-full max-sm:px-6 bg-white rounded-t-3xl">
				<AuthForm type="signin" />
			</section>
		</>
	)
}

export default SignIn
