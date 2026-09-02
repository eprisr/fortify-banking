'use client'

import { ChevronLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

const HeaderBox = ({
	type = 'title',
	title,
	subtext,
  user,
}: HeaderBoxProps) => {
  	const router = useRouter()
  
  return (
		<>
			{type === 'greeting' ? (
				<div className="header-box">
					<h1
						className={cn(
							'header-box-title',
							type === 'greeting' && 'text-xxs text-ink/70',
						)}>
						{title} <br />
						{type === 'greeting' && user !== 'Guest' && (
							<span className="font-serif text-base text-ink">{user}!</span>
						)}
					</h1>
					<p className="header-box-subtext">{subtext}</p>
				</div>
			) : (
				<header className="flex flex-col gap-5 mb-8">
					<button aria-label="Go back" onClick={() => router.back()}>
						<div className="flex flex-center h-8 w-8 bg-cloud rounded-full cursor-pointer">
							<ChevronLeft size={12} />
						</div>
					</button>
					<div className="flex flex-col gap-1 md:gap-3">
						<h1 className="text-xl font-bold">{title}</h1>
					</div>
				</header>
			)}
		</>
	)
}

export default HeaderBox
