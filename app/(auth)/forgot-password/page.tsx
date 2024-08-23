import AuthForm from '@/components/AuthForm'
import Navbar from '@/components/Navbar'
import React from 'react'

const ForgotPassword = () => {
	return (
		<>
			<Navbar type="sub " pageTitle="Forgot Password" background />
			<section className="flex-center size-full max-sm:px-6 bg-white rounded-t-3xl">
				<AuthForm type="forgot-pw" />
			</section>
		</>
	)
}

export default ForgotPassword
