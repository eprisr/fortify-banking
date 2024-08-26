'use client'

import { mobileLinks } from '@/constants'
import { cn } from '@/lib/utils'
import { usePathname } from 'next/navigation'
import React from 'react'

const MobileMenu = () => {
	const pathname = usePathname()

	return (
		<div className="w-full flex flex-nowrap items-center justify-between px-10 py-5 bg-white fixed bottom-0 shadow-[0_-5px_30px_0_rgba(0,0,0,0.07)]">
			{mobileLinks.map((link) => {
				const { Icon, route, label } = link
				const active = pathname === route
				return (
					<div
						key={label}
						className={cn('flex gap-2 items-center justify-center', {
							'px-4 py-2 rounded-full bg-[#3629B7] text-white': active,
						})}>
						<Icon
							className={cn('text-20 text-[#898989]', { 'text-white': active })}
						/>
						<p className={cn({ 'hidden': !active })}>{label}</p>
					</div>
				)
			})}
		</div>
	)
}

export default MobileMenu
