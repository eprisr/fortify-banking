'use client'

import { logoutAccount } from '@/lib/actions/user.actions'
import { useRouter } from 'next/navigation'
import React from 'react'
import { BiLogOut } from 'react-icons/bi'
import { Button } from './ui/button'
import { LogOut } from 'lucide-react'

const Footer = ({ user, type = 'desktop' }: FooterProps) => {
	const router = useRouter()

	const handleLogout = async () => {
		const loggedOut = await logoutAccount()

		if (loggedOut) router.push('/signin')
	}

	return (
		<footer className="footer grow">
			<Button className="w-full self-end" onClick={handleLogout}>
				<LogOut /> Sign Out
			</Button>
		</footer>
	)
}

export default Footer
