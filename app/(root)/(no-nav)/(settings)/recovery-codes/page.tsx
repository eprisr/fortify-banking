import HeaderBox from '@/components/shared/HeaderBox'
import {
	Item,
	ItemContent,
	ItemDescription,
	ItemMedia,
} from '@/components/ui/item'
import { AlertTriangle, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Field } from '@/components/ui/field'
import { Label } from '@radix-ui/react-label'
import {
	enableMFA,
	generateRecoveryCodes,
	getLoggedInUser,
} from '@/lib/actions/user.actions'
import VerifyEmail from '@/components/auth/VerifyEmail'
import { obscureEmail } from '@/lib/utils'
import Copy from '@/components/Copy'
import { redirect } from 'next/navigation'

const Settings = async () => {
	const user = await getLoggedInUser()
	const { verifiedEmail } = user
	const email = obscureEmail(user.email)

	if (!verifiedEmail) {
		return <VerifyEmail email={email} />
	}

	// Only ever call this once we know the user can actually see/use the
	// result — Appwrite's recovery codes are precious (one-time create,
	// otherwise a regenerate), so don't burn a call on a user who's about to
	// be shown the verify-email prompt instead.
	const codes = await generateRecoveryCodes()

	const codesAsText = codes.data?.recoveryCodes.join('\n') || ''
	const codesDownloadHref = `data:text/plain;charset=utf-8,${encodeURIComponent(codesAsText)}`

	return (
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
				<>
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
							<Copy text={codesAsText} classNames="flex-1 gap-1.5 mt-0" />
							<Button variant="secondary" className="flex-1" asChild>
								<a
									href={codesDownloadHref}
									download="fortify-bank-recovery-codes.txt">
									Download <Download />
								</a>
							</Button>
						</div>
					</div>
					<form
						action={async () => {
							'use server'
							const result = await enableMFA(user.userId)
							if (result.success) redirect('/')
						}}
						className="w-full group/mfa">
						<Field orientation="horizontal" className="my-3">
							<Checkbox id="recovery-codes" name="recovery-codes" required />
							<Label htmlFor="recovery-codes" className="text-xs text-ink/70">
								I've saved these recovery codes in a safe place
							</Label>
						</Field>
						<button
							type="submit"
							className="font-semibold w-full inline-flex items-center justify-center rounded-xl px-4 py-4 bg-primary text-white shadow-xl mt-2 opacity-50 cursor-not-allowed transition-opacity group-has-data-[state=checked]/mfa:opacity-100 group-has-data-[state=checked]/mfa:cursor-pointer focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40">
							Continue
						</button>
					</form>
				</>
			)}
		</section>
	)
}

export default Settings
