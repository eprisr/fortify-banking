import AuthForm from '@/components/AuthForm'
import Navbar from '@/components/Navbar'
import React from 'react'

const ForgotPassword = () => {
	return (
		<>
			<Navbar type="sub" pageTitle="Forgot password" />
			<section className="flex-center size-full max-sm:px-6 bg-white">
				<AuthForm type="forgot-pw" />
			</section>
		</>
	)
}

export default ForgotPassword
