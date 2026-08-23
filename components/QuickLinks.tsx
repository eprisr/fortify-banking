'use client'

import { quickLinks } from '@/constants'
import Link from 'next/link'
import React from 'react'

const QuickLinks = () => {
	return (
		<div>
			<div className="grid grid-cols-4 gap-2 justify-items-center">
				{quickLinks.map((link) => {
					const { Icon, route, label, color } = link
					const disabled = route === '#'
					return (
						<div key={label} className="h-fit w-18 rounded-2xl shadow-card">
							<Link
								href={route}
								className={`grid grid-rows-2 gap-3 items-center justify-items-center text-center p-2 ${
									disabled ? 'cursor-default' : 'cursor-pointer'
								}`}>
								<Icon
									className="text-[16px]"
									style={{ color: `${disabled ? '#898989' : color}` }}
								/>
								<p className="text-xxs text-gray-400">{label}</p>
							</Link>
						</div>
					)
				})}
			</div>
		</div>
	)
}

export default QuickLinks
