import React from 'react'
import { connection } from 'next/server'
import AuthForm from '@/components/AuthForm'
import Navbar from '@/components/Navbar'

const ForgotPassword = async () => {
	await connection()
	return (
		<section className="flex-center size-full bg-white">
			<AuthForm type="forgot-pw" />
		</section>
	)
}

export default ForgotPassword
