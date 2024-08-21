import Image from 'next/image'
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
import { BiBell, BiChevronLeft, BiMenu } from 'react-icons/bi'
import { navLinks } from '@/constants'
import Footer from './Footer'

const Navbar = ({ user, type, pageTitle }: NavbarProps) => {
	return (
		<section>
			{type === 'main' ? (
				<nav className="flex w-full items-center justify-between p-4">
					<Sheet>
						<SheetTrigger>
							<div className="profile">
								<div className="profile-img">
									<span className="text-1xl font-bold text-blue-500">
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
												<div className="p-2 bg-black-1 rounded-full">
													<Icon className="w-4 h-4 text-white" />
												</div>
												<p className="font-semibold">{label}</p>
											</Link>
										</SheetClose>
										<div className="border-b-2 border-black" />
									</>
								)
							})}
							<Footer user={user} type="mobile" />
						</SheetContent>
					</Sheet>

					<Link href="/" className="flex cursor-pointer items-center gap-2">
						<Image
							src="/icons/logo.svg"
							width={24}
							height={24}
							alt="Fortify Logo"
							className="size-[24px] max-xl:size-10"
						/>
						<h1 className="sidebar-logo text-white">Fortify</h1>
					</Link>

					<BiBell className="w-5 h-5 text-white" />
				</nav>
			) : (
				<nav className="flex w-full items-center p-4 gap-4 font-semibold text-white">
					<BiChevronLeft className="size-6" />
					<p>{pageTitle}</p>
				</nav>
			)}
		</section>
	)
}

export default Navbar
