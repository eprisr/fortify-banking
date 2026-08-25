'use client'

import { mobileLinks } from '@/constants'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

const MobileMenu = () => {
	const pathname = usePathname()

	return (
		<div className="w-full max-w-107.5 flex flex-nowrap items-center justify-between px-10 py-5 bg-white border border-t-ink/10 fixed bottom-0 left-0">
			{mobileLinks.map((link) => {
				const { Icon, route, label } = link
				const active = pathname === route
				const disabled = route === '#'

				return (
					<div
						key={label}
						className={cn('text-gray-500', {
							'text-white': active,
							'bg-primary': active,
							'rounded-full': active,
							'py-2': active,
							'px-4': active,
						})}>
						<Link
							href={route}
							className={cn('flex gap-2 items-center justify-center', {
								'cursor-default': disabled,
							})}>
							<Icon
								className={cn('text-xl text-gray-500', {
									'text-white': active,
								})}
							/>
							{active && (
								<p className={cn('text-xs font-semibold font-sans')}>{label}</p>
							)}
						</Link>
					</div>
				)
			})}
		</div>
	)
}

export default MobileMenu
