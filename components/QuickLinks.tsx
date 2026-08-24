'use client'

import { quickLinks } from '@/constants'
import Link from 'next/link'
import React from 'react'

const QuickLinks = () => {
	return (
		<div>
			<div className="grid grid-cols-4 gap-2 justify-items-center">
				{quickLinks.map((link) => {
					const { Icon, route, label } = link
					const disabled = route === '#'
					return (
						<div key={label}>
							<Link
								href={route}
								className={`grid grid-rows-[minmax(0,1fr)_auto] gap-3 items-center justify-items-center text-center p-2 ${
									disabled ? 'cursor-default' : 'cursor-pointer'
								}`}>
								<div className="flex-center h-14 w-14 bg-cloud rounded-2xl">
									<Icon
										className={`text-xl ${disabled ? 'text-primary/50' : 'text-primary'}`}
									/>
								</div>
								<p className="text-xs text-ink font-semibold">{label}</p>
							</Link>
						</div>
					)
				})}
			</div>
		</div>
	)
}

export default QuickLinks
