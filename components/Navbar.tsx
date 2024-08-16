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
import { BiBell, BiMenu } from 'react-icons/bi'
import { navLinks } from '@/constants'

const Navbar = ({ user }: NavbarProps) => {
	return (
		<section>
			<nav className="flex w-full items-center justify-between p-4">
				<Sheet>
					<SheetTrigger>
						<BiMenu className="w-8 h-8" />
					</SheetTrigger>
					<SheetContent side="left" className="flex flex-col bg-white">
						<SheetHeader>USER</SheetHeader>
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
						FOOTER?
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
					<h1 className="sidebar-logo">Fortify</h1>
				</Link>

				<BiBell className="w-5 h-5" />
			</nav>
		</section>
	)
}

export default Navbar
