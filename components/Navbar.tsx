'use client'

import Link from 'next/link'
import React, { Fragment } from 'react'
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
import PlaidLink from './PlaidLink'
import { cn } from '@/lib/utils'
import { useMobileContainer } from './mobile-container'
import { ChevronRight } from 'lucide-react'
import { Button } from './ui/button'

const Navbar = ({
	user,
	type,
	pageTitle = '',
	background = false,
}: NavbarProps) => {
	const container = useMobileContainer()
	let path

	switch (pageTitle) {
		case 'Reset Password':
			path = '/forgot-password'
			break

		case 'Sign up':
		case 'Forgot password':
			path = '/signin'
			break

		default:
			path = '/'
			break
	}

	const links = Object.groupBy(navLinks, ({ category }) => category)

	return (
		<section
			className={cn('pt-4 pb-0', { 'bg-primary pb-5 -mb-5': background })}>
			{type === 'main' && user ? (
				<nav className="flex w-full items-center gap-4 p-4">
					<Sheet modal={false}>
						<SheetTrigger>
							<div className="profile">
								<div className="profile-img">
									<span className="text-xl font-bold text-primary">
										{user?.firstName[0]}
									</span>
								</div>
							</div>
						</SheetTrigger>
						<SheetContent
							side="left"
							container={container}
							className="flex flex-col p-6 w-4/5!">
							<SheetHeader className="px-0 mb-4">
								<SheetTitle className="sr-only">
									Welcome, {user?.firstName}
								</SheetTitle>
								<SheetDescription className="sr-only">
									Navigate the Fortify application by using the menu below.
								</SheetDescription>
								<div className="profile">
									<div className="profile-img">
										<span className="text-xl font-bold text-primary">
											{user?.firstName[0]}
										</span>
									</div>
									<div className="profile-details">
										<h1 className="text-16 truncate font-semibold text-primary">
											{`${user?.firstName} ${user.lastName}`}
										</h1>
										<p className="text-10 text-gray-400">{user.email}</p>
									</div>
									<Button variant="outline" className="px-4 py-2">
										Edit
									</Button>
								</div>
							</SheetHeader>
							{Object.entries(links).map(([key, value], i) => {
								return (
									<Fragment key={i}>
										<h3 className="text-10 text-gray-400">
											{key.toUpperCase()}
										</h3>
										{value?.map((item) => {
											const { Icon, route, label, subText } = item
											return (
												<SheetClose asChild key={label}>
													<Link
														href={route}
														key={label}
														className="flex items-center justify-between my-2">
														<div className="flex items-center gap-2">
															<Icon size={12} />
															<div>
																<p>{label}</p>
																<p className="text-10 text-gray-400">
																	{subText}
																</p>
															</div>
														</div>
														<ChevronRight size={16} color="#e0e0e0" />
													</Link>
												</SheetClose>
											)
										})}
										<div className="border-b border-gray-200 mb-4" />
									</Fragment>
								)
							})}

							{/* <PlaidLink user={user} /> */}
							<Footer user={user} type="mobile" />
						</SheetContent>
					</Sheet>

					<header className="home-header">
						<HeaderBox
							type="greeting"
							title="Good Morning,"
							user={`${user?.firstName + ' ' + user?.lastName}` || 'Guest'}
							subtext=""
						/>
					</header>

					<BiBell className="w-5 h-5 text-white justify-self-end ml-auto" />
				</nav>
			) : (
				<nav
					className={cn('px-6 py-4 gap-4 font-semibold', {
						'text-white': background,
					})}>
					<Link href={path} className="flex w-full items-center gap-2">
						{pageTitle !== 'Sign in' && <BiChevronLeft className="size-6" />}
						<p>{pageTitle}</p>
					</Link>
				</nav>
			)}
		</section>
	)
}

export default Navbar
