'use client'

import { mobileLinks } from '@/constants'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

const MobileMenu = () => {
	const pathname = usePathname()

	return (
		<div className="w-full flex flex-nowrap items-center justify-between px-10 py-5 bg-white fixed bottom-0 shadow-cardSmall">
			{mobileLinks.map((link) => {
				const { Icon, route, label } = link
				const active = pathname === route
				const disabled = route === '#'

				return (
					<div
						key={label}
						className={cn({
							'px-4 py-2 rounded-full bg-primary-700 text-white': active,
						})}>
						<Link
							href={route}
							className={cn('flex gap-2 items-center justify-center', {
								'cursor-default': disabled,
							})}>
							<Icon
								className={cn('text-20 text-gray-500', {
									'text-white': active,
								})}
							/>
							<p className={cn({ 'hidden': !active })}>{label}</p>
						</Link>
					</div>
				)
			})}
		</div>
	)
}

export default MobileMenu
