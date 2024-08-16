import AccountBox from '@/components/AccountBox'
import HeaderBox from '@/components/HeaderBox'
import React from 'react'

const Home = () => {
	const loggedIn = { firstName: 'Jane', lastName: 'Doe' }

	return (
		<section className="home bg-white rounded-t-3xl">
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
					user={loggedIn}
					accounts={[]}
					banks={[{ currentBalance: 123.5 }, { currentBalance: 500.0 }]}
					totalBanks={1}
					totalBalance={3469.52}
				/>
			</div>
		</section>
	)
}

export default Home
