import React from 'react'
import { connection } from 'next/server'
import AuthForm from '@/components/AuthForm'
import Navbar from '@/components/Navbar'

const ForgotPassword = async () => {
	await connection()
	return (
		<section className="flex-center size-full px-6 bg-white">
			<AuthForm type="forgot-pw" />
		</section>
	)
}

export default ForgotPassword
