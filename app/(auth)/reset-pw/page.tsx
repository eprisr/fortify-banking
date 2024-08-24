import AuthForm from '@/components/AuthForm'
import Navbar from '@/components/Navbar'
import React from 'react'

const ResetPassword = ({
	searchParams: { userId, secret },
}: SearchParamProps) => {
	return (
		<>
			<Navbar type="sub " pageTitle="Reset Password" background />
			<section className="flex-center size-full max-sm:px-6 bg-white rounded-t-3xl">
				<AuthForm type="reset-pw" />
			</section>
		</>
	)
}

export default ResetPassword
