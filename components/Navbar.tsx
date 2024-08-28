import Link from 'next/link'
import React from 'react'
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from '@/components/ui/sheet'
import { BiBell, BiChevronLeft } from 'react-icons/bi'
import { navLinks } from '@/constants'
import Footer from './Footer'
import HeaderBox from './HeaderBox'
import { getLoggedInUser } from '@/lib/actions/user.actions'
import PlaidLink from './PlaidLink'

const Navbar = async ({ user, type, pageTitle }: NavbarProps) => {
	const loggedIn = await getLoggedInUser()
	const path = pageTitle === 'Reset Password' ? '/forgot-password' : '/signin'

	return (
		<section>
			{type === 'main' && user ? (
				<nav className="flex w-full items-center gap-4 p-4">
					<Sheet modal={false}>
						<SheetTrigger>
							<div className="profile">
								<div className="profile-img">
									<span className="text-1xl font-bold text-primary-700">
										{user?.firstName[0]}
									</span>
								</div>
							</div>
						</SheetTrigger>
						<SheetContent side="left" className="flex flex-col bg-white">
							<SheetHeader>
								<SheetTitle className="sr-only">
									Welcome, {user?.firstName}
								</SheetTitle>
								<SheetDescription className="sr-only">
									Navigate the Fortify application by using the menu below.
								</SheetDescription>
								<div className="profile">
									<div className="profile-img">
										<span className="text-1xl font-bold text-blue-500">
											{user?.firstName[0]}
										</span>
									</div>
								</div>
							</SheetHeader>
							{navLinks.map((item) => {
								const { Icon, route, label } = item
								return (
									<>
										<SheetClose asChild key={item.route}>
											<Link
												href={route}
												key={label}
												className="flex items-center gap-2 my-2">
												<div className="p-2 bg-neutral-800 rounded-full">
													<Icon className="w-4 h-4 text-white" />
												</div>
												<p className="font-semibold">{label}</p>
											</Link>
										</SheetClose>
										<div className="border-b-2 border-black" />
									</>
								)
							})}

							<PlaidLink user={user} />
							<Footer user={user} type="mobile" />
						</SheetContent>
					</Sheet>

					<header className="home-header">
						<HeaderBox
							type="greeting"
							title="Good Morning,"
							user={loggedIn?.firstName || 'Guest'}
							subtext=""
						/>
					</header>

					<BiBell className="w-5 h-5 text-white justify-self-end ml-auto" />
				</nav>
			) : (
				<nav className="p-4 gap-4 font-semibold text-white">
					<Link href={path} className="flex w-full items-center gap-4">
						{pageTitle !== 'Sign in' && <BiChevronLeft className="size-6" />}
						<p>{pageTitle}</p>
					</Link>
				</nav>
			)}
		</section>
	)
}

export default Navbar
