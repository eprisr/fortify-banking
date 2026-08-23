'use client'

import CustomInput from '@/components/CustomInput'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { WaitlistValues } from '@/lib/auth-form-config'
import { waitlistSchema } from '@/lib/utils'
import logo from '@/public/icons/logo.svg'
import mockup from '@/public/mockup.png'
import { zodResolver } from '@hookform/resolvers/zod'
import {
	features,
	marqueeItems,
	primaryShadeMap,
	security,
	works,
} from '@/lib/landing-data'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import './styles.css'
import { Badge } from '@/components/ui/badge'
import Marquee from '@/components/Marquee'
import Link from 'next/link'

const Landing = () => {
	const form = useForm<WaitlistValues>({
		resolver: zodResolver(waitlistSchema),
		mode: 'onSubmit',
		defaultValues: {
			email: '',
		},
	})

	return (
		<div className="text-gray-500 text-16 font-dm-sans font-light">
			<nav className="flex items-center justify-between px-10 py-4 fixed top-0 left-0 w-full bg-white z-10">
				<div className="flex items-center gap-2">
					<Image src={logo} alt="Fortify Banking Logo" width={32} height={32} />
					<p className="text-16 font-bold">Fortify</p>
				</div>
				<ul className="flex items-center gap-7">
					<Link href={'#features'}>Features</Link>
					<Link href={'#works'}>How it works</Link>
					<Link href={'#security'}>Security</Link>
				</ul>
				<div>
					<Button variant="ghost" className="mr-4">
						Sign in
					</Button>
					<Button variant="default">Get early access</Button>
				</div>
			</nav>
			<div className="flex items-center justify-between h-fit px-70 pt-10 bg-radial-[at_25%_50%] from-white via-primary-100 to-primary-500">
				<div>
					<h1>
						Your money, <br />
						<span className="text-primary-700">finally clear.</span>
					</h1>
					<p className="text-black-1 leading-7 my-4 w-[32ch]">
						Fortify connects to your bank and turns raw transactions into a
						clear picture of where your money goes — and where it should go
						next.
					</p>
					<div className="flex gap-4">
						<Button variant="default" size="lg" className="px-7">
							Get early access
						</Button>
						<Button variant="outline" size="lg" className="px-7">
							See how it works
						</Button>
					</div>
					<div className="flex gap-3 mt-7">
						<div className="flex items-center">
							{['A', 'S', 'D', 'F', 'J'].map((u, i) => (
								<div
									key={i}
									className={`flex items-center justify-center h-7 w-7 rounded-full ${primaryShadeMap[i]} border border-white -ml-1.5`}>
									<p className="text-white text-center text-10 font-semibold font-sora">
										{u}
									</p>
								</div>
							))}
						</div>
						<div className="text-14">
							<p className="font-bold text-black-2">
								240+ people on the waitlist
							</p>
							<p>Join them — it's free</p>
						</div>
					</div>
				</div>
				<div>
					<Image
						src={mockup}
						alt="Fortify Sign In Screen"
						className="w-auto h-full rounded-lg"
					/>
				</div>
			</div>
			<Marquee items={marqueeItems} />
			<div
				id="features"
				className="flex flex-col items-center justify-center gap-10 px-40 py-20">
				<div className="text-center">
					<p>Features</p>
					<h3>Everything your finances need</h3>
					<p className="mt-2">
						Built for people who want clarity, not complexity.
					</p>
				</div>
				<div className="grid grid-cols-3 gap-4">
					{features.map((feat, i) => (
						<div key={i} className="border border-gray-200 rounded-xl p-6">
							<h5>{feat.title}</h5>
							<p className="mt-2">{feat.content}</p>
						</div>
					))}
				</div>
			</div>
			<div
				id="works"
				className="flex flex-col items-center justify-center gap-10 px-40 py-30 bg-gray-100 border border-gray-200">
				<div className="text-center">
					<p>How It Works</p>
					<h3>Up and running in three steps</h3>
				</div>
				<div className="grid grid-flow-col grid-cols-3 text-center gap-16 relative">
					<hr className="absolute top-1/8 left-1/8 z-0 w-3/4 border-t-2 border-primary-400" />
					{works.map((w, i) => (
						<div className="relative">
							<div className="flex items-center justify-center w-10 h-10 p-2 bg-primary-700 text-white rounded-xl m-auto">
								<span className="font-sora font-semibold">{i + 1}</span>
							</div>
							<p className="font-sora font-bold text-18 text-black-1 my-4">
								{w.title}
							</p>
							<p className="w-[28ch] text-14 leading-6 m-auto">{w.content}</p>
						</div>
					))}
				</div>
			</div>
			<div
				id="security"
				className="flex items-center justify-between px-50 py-20">
				<div className="w-1/2">
					<p>Security</p>
					<h3 className="w-[12ch] text-4xl my-4">
						Built with your safety first.
					</h3>
					<p className="w-[40ch]">
						Handing over access to your finances requires real trust. Every
						technical decision — from Plaid's read-only OAuth to Dwolla's ACH
						infrastructure — was made with that in mind.
					</p>
					<div className="flex gap-4 mt-6">
						{['Powered by Plaid', 'Dwolla ACH'].map((b, i) => (
							<Badge
								key={i}
								className="text-14! font-bold rounded-2xl bg-primary-300 text-primary-700 p-4">
								{b}
							</Badge>
						))}
					</div>
				</div>
				<div className="grid grid-cols-2 grid-rows-3 gap-4 max-w-xl p-6">
					{security.map((s, i) => (
						<div key={i} className="border border-gray-200 rounded-xl p-4">
							<p className="text-14 text-black-1 font-semibold mb-1">
								{s.title}
							</p>
							<p className="text-12 font-light leading-5">{s.content}</p>
						</div>
					))}
				</div>
			</div>
			<div className="flex items-center justify-center text-center bg-primary-600 text-white px-30 py-20">
				<div className="flex flex-col items-center w-8/17">
					<Image src={logo} alt="Fortify Banking" width={64} height={64} />
					<h3 className="text-white text-4xl leading-12 w-[18ch] my-4">
						Ready to see where your money really goes?
					</h3>
					<p className="text-15 leading-7 text-gray-200 w-[44ch]">
						Join the early access list. We're onboarding users in small batches
						— no spam, just a heads-up when your spot is ready.
					</p>
					<div className="w-full">
						<Form {...form}>
							<form className="flex justify-center gap-4 mt-8 mb-4">
								<CustomInput
									control={form.control}
									name="email"
									label="Email"
									placeholder="your@email.com"
								/>
								<Button className="bg-white text-primary-700 font-semibold px-4">
									Join waitlist
								</Button>
							</form>
						</Form>
					</div>
					<p className="text-12 text-primary-400">
						No credit card · No commitments · Unsubscribe anytime
					</p>
				</div>
			</div>
			<div className="flex flex-col justify-between px-30 py-10">
				<div className="flex justify-between">
					<div>
						<div className="flex items-center gap-2">
							<Image
								src={logo}
								alt="Fortify Banking Logo"
								width={32}
								height={32}
							/>
							<p className="text-16 font-bold text-black">Fortify</p>
						</div>
						<p className="text-14 w-[24ch] mt-4">
							Your money, finally clear. Built with Next.js, Plaid, and Dwolla.
						</p>
					</div>
					<div className="grid grid-cols-2 gap-18 text-14">
						<div>
							<p className="font-semibold uppercase tracking-widest text-12 mb-3">
								Product
							</p>
							<ul className="leading-8">
								<li>Features</li>
								<li>Security</li>
								<li>How it works</li>
								<li>Changelog</li>
							</ul>
						</div>
						<div>
							<p className="font-semibold uppercase tracking-widest text-12 mb-3">
								Company
							</p>
							<ul className="leading-8">
								<li>About</li>
								<li>Blog</li>
								<li>Privacy</li>
								<li>Terms</li>
							</ul>
						</div>
					</div>
				</div>
				<hr className="border border-top my-6" />
				<div className="flex justify-between text-14">
					<p>&copy; 2026 Fortify Built by Epris Richardson</p>
					<p>Powered by Plaid &#8901; Dwolla &#8901; Appwrite</p>
				</div>
			</div>
		</div>
	)
}

export default Landing
