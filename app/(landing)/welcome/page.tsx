'use client'

import CustomInput from '@/components/CustomInput'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import {
	Sheet,
	SheetContent,
	SheetClose,
	SheetTitle,
	SheetTrigger,
} from '@/components/ui/sheet'
import { WaitlistValues } from '@/lib/auth-form-config'
import { waitlistSchema } from '@/lib/utils'
import logo from '@/public/icons/logo.svg'
import logoLight from '@/public/icons/logo-light.svg'
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
import { useState } from 'react'
import { Menu } from 'lucide-react'
import './styles.css'
import { Badge } from '@/components/ui/badge'
import Marquee from '@/components/Marquee'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import StatusBadge from '@/components/StatusBadge'

const navLinks = [
	{ href: '#features', label: 'Features' },
	{ href: '#security', label: 'Security' },
	{ href: '#works', label: 'How it works' },
]

const productLinks = [
	{ href: '#features', label: 'Features' },
	{ href: '#security', label: 'Security' },
	{ href: '#works', label: 'How it works' },
	{ href: '#', label: 'Changelog' },
]

const companyLinks = [
	{ href: '#', label: 'About' },
	{ href: '#', label: 'Blog' },
	{ href: '#', label: 'Privacy' },
	{ href: '/terms', label: 'Terms' },
]

const Landing = () => {
	const router = useRouter()
	const [menuOpen, setMenuOpen] = useState(false)

	const form = useForm<WaitlistValues>({
		resolver: zodResolver(waitlistSchema),
		mode: 'onSubmit',
		defaultValues: {
			email: '',
		},
	})

	return (
		<div className="text-gray-500 text-base font-dm-sans font-light">
			<header className="fixed top-0 left-0 w-full z-10 bg-white">
				<nav className="flex items-center justify-between px-5 sm:px-8 lg:px-10 py-4">
					<div className="flex items-center gap-2">
						<Image
							src={logo}
							alt="Fortify Banking Logo"
							width={32}
							height={32}
						/>
						<p className="text-base text-ink font-bold font-heading">Fortify</p>
					</div>
					<ul className="hidden md:flex items-center gap-7">
						{navLinks.map((link) => (
							<li key={link.href}>
								<Link href={link.href}>{link.label}</Link>
							</li>
						))}
					</ul>
					<div className="hidden md:flex items-center">
						<Button
							onClick={() => router.push('/signin')}
							variant="ghost"
							className="text-sm font-semibold mr-4">
							Sign in
						</Button>
						<Button
							onClick={() => router.push('/demo')}
							variant="default"
							className="text-sm font-semibold px-4 py-3">
							Explore as Guest
						</Button>
					</div>
					<Sheet open={menuOpen} onOpenChange={setMenuOpen}>
						<SheetTrigger asChild>
							<Button
								variant="ghost"
								size="icon-sm"
								className="md:hidden"
								aria-label="Open menu">
								<Menu />
							</Button>
						</SheetTrigger>
						<SheetContent side="right" className="w-3/4 sm:max-w-xs px-6 py-6">
							<SheetTitle className="sr-only">Navigation menu</SheetTitle>
							<ul className="flex flex-col gap-5 mt-10">
								{navLinks.map((link) => (
									<li key={link.href}>
										<SheetClose asChild>
											<Link
												href={link.href}
												className="text-base text-ink font-medium">
												{link.label}
											</Link>
										</SheetClose>
									</li>
								))}
							</ul>
							<div className="flex flex-col gap-3 mt-8">
								<SheetClose asChild>
									<Button variant="outline" className="w-full" asChild>
										<Link href="/signin">Sign in</Link>
									</Button>
								</SheetClose>
								<SheetClose asChild>
									<Button
										onClick={() => router.push('/demo')}
										variant="default"
										className="w-full">
										Explore as Guest
									</Button>
								</SheetClose>
							</div>
						</SheetContent>
					</Sheet>
				</nav>
			</header>
			<main>
				<section className="flex flex-col lg:flex-row items-center justify-center gap-10 lg:gap-6 bg-paper px-5 sm:px-10 lg:px-20 xl:px-32 pt-28 lg:pt-32">
					<div className="text-center lg:text-left">
						<h1>
							Know before <br />
							<span className="text-primary-700">payday.</span>
						</h1>
						<p className="text-black-1 leading-7 my-4 max-w-[32ch] mx-auto lg:mx-0">
							Fortify connects to your bank and turns raw transactions into a
							clear picture of where your money goes — and where it should go
							next.
						</p>
						<div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
							<Button
								onClick={() => router.push('/demo')}
								variant="default"
								size="lg"
								className="font-semibold px-7">
								Explore as Guest
							</Button>
							<Button
								onClick={() => router.push('#works')}
								variant="outline"
								size="lg"
								className="font-semibold px-7 text-ink">
								See how it works
							</Button>
						</div>
						<div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mt-7">
							<div className="flex items-center">
								{['A', 'S', 'D', 'F', 'J'].map((u, i) => (
									<div
										key={i}
										className={`flex items-center justify-center h-7 w-7 rounded-full ${primaryShadeMap[i]} border border-white -ml-1.5`}>
										<p className="text-white text-center text-xxs font-semibold font-sora">
											{u}
										</p>
									</div>
								))}
							</div>
							<div className="text-sm text-left">
								<p className="font-bold text-black-2">
									240+ people on the waitlist
								</p>
								<p>Join them — it's free</p>
							</div>
						</div>
					</div>
					<div className="w-full max-w-md lg:max-w-120">
						<Image
							src={mockup}
							alt="Fortify Sign In Screen"
							sizes="(min-width: 1024px) 480px, 90vw"
							className="w-full h-auto max-w-120 lg:h-full rounded-lg"
						/>
					</div>
				</section>
				<Marquee items={marqueeItems} />
				<section
					id="features"
					aria-labelledby="features-heading"
					className="flex flex-col items-center justify-center gap-10 px-5 sm:px-10 lg:px-20 xl:px-40 py-16 lg:py-20">
					<div className="text-center">
						<p className="text-primary font-semibold">Features</p>
						<h2 id="features-heading">Everything your finances need</h2>
						<p className="mt-2">
							Built for people who want clarity, not complexity.
						</p>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 auto-rows-[minmax(200px,240px)_auto_auto] gap-4 w-full">
						{features.map((feat, i) => (
							<div key={i} className="grid grid-rows-subgrid row-span-3">
								<img
									src={feat.image}
									alt={feat.imgAlt ?? ''}
									className="w-full h-full object-contain rounded-lg"
								/>
								<h3>
									{feat.title}{' '}
									{feat.status && <StatusBadge status={feat.status} />}
								</h3>
								<p className="mt-2">{feat.content}</p>
							</div>
						))}
					</div>
				</section>
				<section
					id="security"
					aria-labelledby="security-heading"
					className="flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-6 bg-plum-tint px-5 sm:px-10 lg:px-20 xl:px-50 py-16 lg:py-20">
					<div className="w-full lg:w-1/2 text-center lg:text-left">
						<p className="text-primary font-semibold">Security</p>
						<h2 className="lg:max-w-[12ch] text-3xl lg:text-4xl my-4">
							Built with your safety first.
						</h2>
						<p className="max-w-[40ch] mx-auto lg:mx-0">
							Handing over access to your finances requires real trust. Every
							technical decision — from Plaid's read-only OAuth to Dwolla's ACH
							infrastructure — was made with that in mind.
						</p>
						<div className="flex flex-wrap justify-center lg:justify-start gap-4 mt-6">
							{['Powered by Plaid', 'Dwolla ACH'].map((b, i) => (
								<Badge
									key={i}
									className="text-sm! font-bold rounded-2xl bg-primary-300 text-primary-700 p-4">
									{b}
								</Badge>
							))}
						</div>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl sm:p-6">
						{security.map((s, i) => (
							<div key={i} className="border border-gray-200 rounded-xl p-4">
								<p className="text-sm text-black-1 font-semibold mb-1">
									{s.title}
								</p>
								<p className="text-xs font-light leading-5">{s.content}</p>
							</div>
						))}
					</div>
				</section>
				<section
					id="works"
					aria-labelledby="works-heading"
					className="flex flex-col items-center justify-center gap-10 px-5 sm:px-10 lg:px-20 xl:px-40 py-16 lg:py-24 border border-gray-200">
					<div className="text-center">
						<p className="text-primary font-semibold">How It Works</p>
						<h2 id="works-heading">Up and running in three steps</h2>
					</div>
					<img
						src="/landing/fortify-how-it-works.png"
						alt="How it works feature image"
						className="max-w-200 w-[90%] h-auto"
					/>
					<div className="grid grid-cols-1 sm:grid-cols-3 text-center gap-10 sm:gap-16 relative w-full max-w-4xl">
						<hr className="hidden sm:block absolute top-1/8 left-1/8 z-0 w-3/4 border-t-2 border-primary-400" />
						{works.map((w, i) => (
							<div key={i} className="relative">
								<div className="flex items-center justify-center w-10 h-10 p-2 bg-primary-700 text-white rounded-xl m-auto">
									<span className="font-sora font-semibold">{i + 1}</span>
								</div>
								<h3 className="font-sora font-bold text-lg text-black-1 my-4">
									{w.title}
								</h3>
								<p className="max-w-[28ch] text-sm text-ink leading-6 mx-auto">
									{w.content}
								</p>
							</div>
						))}
					</div>
				</section>
				<section
					aria-labelledby="cta-heading"
					className="flex items-center justify-center text-center bg-primary-700 text-white px-5 sm:px-10 lg:px-20 xl:px-30 py-16 lg:py-20">
					<div className="flex flex-col items-center w-full sm:w-3/4 lg:w-8/17">
						<Image
							src={logoLight}
							alt="Fortify Banking"
							width={64}
							height={64}
						/>
						<h2
							id="cta-heading"
							className="text-white text-3xl lg:text-4xl leading-tight lg:leading-12 max-w-[18ch] my-4">
							Ready to see where your money really goes?
						</h2>
						<p className="text-15 leading-7 text-gray-200 max-w-[44ch]">
							Join the early access list. We're onboarding users in small
							batches — no spam, just a heads-up when your spot is ready.
						</p>
						<div className="w-full">
							<Form {...form}>
								<form className="flex flex-col sm:flex-row justify-center gap-4 mt-8 mb-4">
									<CustomInput
										control={form.control}
										name="email"
										label="Email"
										placeholder="your@email.com"
									/>
									<Button className="bg-white text-primary-700 text-sm font-semibold px-4 pt-3">
										Join waitlist
									</Button>
								</form>
							</Form>
						</div>
						<p className="text-xs text-primary-400">
							No credit card · No commitments · Unsubscribe anytime
						</p>
					</div>
				</section>
			</main>
			<footer className="flex flex-col justify-between px-5 sm:px-10 lg:px-20 xl:px-30 py-10">
				<div className="flex flex-col md:flex-row md:justify-between gap-10">
					<div className="text-center md:text-left">
						<div className="flex items-center justify-center md:justify-start gap-2">
							<Image
								src={logo}
								alt="Fortify Banking Logo"
								width={32}
								height={32}
							/>
							<p className="text-base font-bold text-ink font-heading">
								Fortify
							</p>
						</div>
						<p className="text-sm max-w-[24ch] mx-auto md:mx-0 mt-4">
							Know before payday. Built with Next.js, Plaid, and Dwolla.
						</p>
					</div>
					<div className="grid grid-cols-2 gap-8 sm:gap-12 lg:gap-18 text-sm text-center md:text-left">
						<div>
							<p className="font-semibold uppercase tracking-widest text-xs mb-3">
								Product
							</p>
							<ul className="leading-8">
								{productLinks.map((link) => (
									<li key={link.label}>
										<Link href={link.href}>{link.label}</Link>
									</li>
								))}
							</ul>
						</div>
						<div>
							<p className="font-semibold uppercase tracking-widest text-xs mb-3">
								Company
							</p>
							<ul className="leading-8">
								{companyLinks.map((link) => (
									<li key={link.label}>
										<Link href={link.href}>{link.label}</Link>
									</li>
								))}
							</ul>
						</div>
					</div>
				</div>
				<hr className="border border-top my-6" />
				<div className="flex flex-col sm:flex-row sm:justify-between gap-2 text-center sm:text-left text-sm">
					<p>&copy; 2026 Fortify Built by Epris Richardson</p>
					<p>Powered by Plaid &#8901; Dwolla &#8901; Appwrite</p>
				</div>
			</footer>
		</div>
	)
}

export default Landing
