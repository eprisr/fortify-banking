import AccountBox from '@/components/AccountBox'
import HeaderBox from '@/components/HeaderBox'
import React from 'react'

const Home = () => {
	const loggedIn = { firstName: 'Jane' }

	return (
		<section className="home">
			<div className="home-content">
				<header className="home-header">
					<HeaderBox
						type="greeting"
						title="Good Morning,"
						user={loggedIn?.firstName || 'Guest'}
						subtext=""
					/>
				</header>
				<AccountBox
					accounts={[]}
					banks={[]}
					totalBanks={1}
					totalBalance={3469.52}
				/>
			</div>
		</section>
	)
}

export default Home
