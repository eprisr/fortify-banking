import { getLoggedInUser } from '@/lib/actions/user.actions'
import React from 'react'
import { cn } from '@/lib/utils'

const HeaderBox = ({
	type = 'title',
	title,
	subtext,
	user,
}: HeaderBoxProps) => {
	return (
		<div className="header-box">
			<h1
				className={cn(
					'header-box-title',
					type === 'greeting' && 'font-ibmPlexSerif italic font-normal',
				)}>
				{title} <br />
				{type === 'greeting' && user !== 'Guest' && (
					<span className="text-lg text-primary-foreground font-bold">
						{user}!
					</span>
				)}
			</h1>
			<p className="header-box-subtext">{subtext}</p>
		</div>
	)
}

export default HeaderBox
