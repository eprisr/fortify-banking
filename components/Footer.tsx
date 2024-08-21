'use client'

import { logoutAccount } from '@/lib/actions/user.actions'
import { useRouter } from 'next/navigation'
import React from 'react'
import { BiLogOut } from 'react-icons/bi'

const Footer = ({ user, type = 'desktop' }: FooterProps) => {
	const router = useRouter()

	const handleLogout = async () => {
		const loggedOut = await logoutAccount()

		if (loggedOut) router.push('/signin')
	}

	return (
		<footer className="footer">
			<div className={type === 'mobile' ? 'footer_name-mobile' : 'footer_name'}>
				<p className="text-xl font-bold text-gray-700">{user?.firstName[0]}</p>
			</div>

			<div
				className={type === 'mobile' ? 'footer_email-mobile' : 'footer_email'}>
				<h1 className="text-13 truncate font-semibold text-gray-700">
					{`${user?.firstName} ${user.lastName}`}
				</h1>
				<p className="text-14 truncate font-normal text-gray-600">
					{user?.email}
				</p>
			</div>

			<div className="footer_image" onClick={handleLogout}>
				<BiLogOut style={{ transform: 'scaleX(-1)' }} />
			</div>
		</footer>
	)
}

export default Footer
