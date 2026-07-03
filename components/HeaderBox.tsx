import { getLoggedInUser } from '@/lib/actions/user.actions'
import React from 'react'

const HeaderBox = ({
	type = 'title',
	title,
	subtext,
	user,
}: HeaderBoxProps) => {
	return (
		<div className="header-box">
			<h1 className="header-box-title">
				{title} <br />
				{type === 'greeting' && user !== 'Guest' && (
					<span className="text-18 text-white font-semibold">{user}!</span>
				)}
			</h1>
			<p className="header-box-subtext">{subtext}</p>
		</div>
	)
}

export default HeaderBox
