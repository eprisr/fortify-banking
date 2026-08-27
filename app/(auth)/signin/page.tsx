import { connection } from 'next/server'
import AuthForm from '@/components/AuthForm'
import React from 'react'

const SignIn = async () => {
	await connection()
	return (
		<section className="flex justify-center size-full bg-white">
			<AuthForm type="signin" />
		</section>
	)
}

export default SignIn
