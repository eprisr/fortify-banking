import HeaderBox from '@/components/shared/HeaderBox'
import {
	Item,
	ItemContent,
	ItemDescription,
	ItemMedia,
} from '@/components/ui/item'
import { AlertTriangle, Copy, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Field } from '@/components/ui/field'
import { Label } from '@radix-ui/react-label'
import Link from 'next/link'
import {
	generateRecoveryCodes,
	getLoggedInUser,
} from '@/lib/actions/user.actions'
import VerifyEmail from '@/components/auth/VerifyEmail'
import { obscureEmail } from '@/lib/utils'

const Settings = async () => {
	const user = await getLoggedInUser()
	const codes = await generateRecoveryCodes()
	const { verifiedEmail } = user
	const email = obscureEmail(user.email)

	return (
		<>
			{verifiedEmail ? (
				<section>
					<HeaderBox
						title="Save your recovery codes"
						subtext="Your backup if you ever lose access."
					/>
					<Item className="bg-semantic-danger/10 p-4 rounded-md my-6">
						<ItemMedia
							variant="icon"
							className="[&_svg:not([class*='size-'])]:size-5">
							<AlertTriangle className="text-semantic-danger" size={16} />
						</ItemMedia>
						<ItemContent>
							<ItemDescription className="text-xs line-clamp-none">
								<span className="text-semantic-danger font-bold">
									These codes are shown once.{' '}
								</span>
								{codes.success &&
									"Each one works a single time. Store them somewhere safe — we can't show them to you again."}
								{codes.error && codes.error}
							</ItemDescription>
						</ItemContent>
					</Item>
					{codes.success && (
						<div className="flex flex-col gap-4">
							<div className="flex-center font-mono bg-cloud p-4 rounded-sm">
								<div className="grid grid-cols-2 gap-3 w-full">
									{codes.data.recoveryCodes.map((c, i) => (
										<div
											key={i}
											className="text-center w-full text-sm uppercase bg-paper py-2 rounded-md">
											<p>{c}</p>
										</div>
									))}
								</div>
							</div>
							<div className="flex gap-4 font-semibold">
								<Button variant="secondary" className="flex-1">
									<Copy /> Copy all
								</Button>
								<Button variant="secondary" className="flex-1">
									<Download /> Download
								</Button>
							</div>
							<Field orientation="horizontal">
								<Checkbox id="recovery-codes" name="recovery-codes" />
								<Label htmlFor="recovery-codes" className="text-xs text-ink/70">
									I've saved these recovery codes in a safe place
								</Label>
							</Field>
						</div>
					)}
					<Link
						href="#"
						className="font-semibold w-full inline-flex items-center justify-center  rounded-xl px-4 py-4 bg-primary text-white shadow-xl mt-2">
						Continue
					</Link>
				</section>
			) : (
				<VerifyEmail email={email} />
			)}
		</>
	)
}

export default Settings
