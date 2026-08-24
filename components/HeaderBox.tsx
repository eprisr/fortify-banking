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
					type === 'greeting' && 'text-xxs text-ink/40',
				)}>
				{title} <br />
				{type === 'greeting' && user !== 'Guest' && (
					<span className="font-serif text-base text-ink">{user}!</span>
				)}
			</h1>
			<p className="header-box-subtext">{subtext}</p>
		</div>
	)
}

export default HeaderBox
