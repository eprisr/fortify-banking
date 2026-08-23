import { ChevronLeft } from 'lucide-react'
import React from 'react'

const Terms = () => {
  return (
		<section className="size-full px-6 text-sm bg-white rounded-t-3xl">
			<header className="flex items-center gap-4">
				<div className="flex flex-center h-8 w-8 bg-cloud rounded-full">
					<ChevronLeft size={12} />
				</div>
				<div>
					<h1 className="text-xl font-bold">Terms & Conditions</h1>
				</div>
			</header>
			<hr className="border-[0.5] border-t-primary/20 mt-4 mb-8" />
			<p className="text-xs text-ink/50 mb-5">
				Last updated August 23, 2026 · For demonstration purposes only
			</p>
			<p className="font-serif italic text-ink/50">
				This agreement explains how Fortify works, what we ask of you as a
				member, and what you can expect from us in return. We've tried to write
				it plainly — but it's still a contract, so please read it.
			</p>
			<hr className="border-[0.5] border-t-primary/20 mt-4 mb-8" />
			<ol className="list-decimal list-inside leading-6 marker:text-base marker:font-heading marker:font-bold marker:text-primary">
				<li className="mb-4">
					<span className="text-base font-heading font-bold text-primary leading-10">
						Eligibility
					</span>{' '}
					<br />
					To open a Fortify account, you must be at least 18 years old, a
					resident of the United States, and able to form a legally binding
					contract. Fortify accounts are for personal use; business and joint
					accounts are not currently supported.
				</li>
				<li className="mb-4">
					<span className="text-base font-heading font-bold text-primary leading-10">
						Your Account
					</span>{' '}
					<br />
					You're responsible for keeping your login credentials, device, and
					biometric access secure. Notify us immediately if you suspect
					unauthorized access to your account. Fortify may suspend account
					access temporarily if we detect unusual or potentially fraudulent
					activity.
				</li>
				<li className="mb-4">
					<span className="text-base font-heading font-bold text-primary leading-10">
						Connecting External Accounts
					</span>{' '}
					<br />
					Fortify uses third-party providers, including Plaid and Dwolla, to
					securely link your external bank accounts and process transfers. By
					connecting an account, you authorize these providers to access account
					information — such as balances and transaction history — on your
					behalf, governed by their respective privacy policies in addition to
          this one.
          <div className="bg-plum/10 p-5 rounded-md mt-4">
            <p className="uppercase font-semibold text-plum text-xs mb-4">Good to know</p>
            <p>You can disconnect a linked bank account at any time from Settings. Disconnecting doesn't delete your Fortify account or transaction history.</p>
          </div>
				</li>
				<li className="mb-4">
					<span className="text-base font-heading font-bold text-primary leading-10">
						Fees
					</span>{' '}
					<br />
					Fortify does not charge monthly maintenance fees. Standard ACH
					transfers are free; expedited transfers may incur a fee, disclosed to
					you before you confirm the transaction. We'll never change your fee
					structure without notifying you at least 30 days in advance.
				</li>
				<li className="mb-4">
					<span className="text-base font-heading font-bold text-primary leading-10">
						Prohibited Uses
					</span>{' '}
					<br />
					<ul className="list-disc ps-5">
            <li>Using Fortify for illegal transactions, money laundering, or fraud</li>
            <li>Attempting to access another member's account without authorization</li>
            <li>Reverse engineering or interfering with Fortify's systems or security</li>
          </ul>
				</li>
				<li className="mb-4">
					<span className="text-base font-heading font-bold text-primary leading-10">
						Privacy
					</span>{' '}
					<br />
					We collect only the information necessary to operate your account and
					comply with financial regulations. We do not sell your personal data.
					Full details are available in our separate Privacy Policy.
				</li>
				<li className="mb-4">
					<span className="text-base font-heading font-bold text-primary leading-10">
						Limitation of Liability
					</span>{' '}
					<br />
					To the fullest extent permitted by law, Fortify is not liable for
					indirect, incidental, or consequential damages arising from your use
					of the service, including delays caused by third-party financial
					institutions outside our control.
				</li>
				<li className="mb-4">
					<span className="text-base font-heading font-bold text-primary leading-10">
						Changes to These Terms
					</span>{' '}
					<br />
					We may update these terms as Fortify evolves. Material changes will be
					communicated in-app or by email before they take effect. Continued use
					of Fortify after changes take effect constitutes acceptance.
				</li>
				<li className="mb-4">
					<span className="text-base font-heading font-bold text-primary leading-10">
						Termination
					</span>{' '}
					<br />
					You may close your account at any time from Settings. We reserve the
					right to suspend or terminate accounts that violate these terms,
					subject to applicable law.
				</li>
				<li className="mb-4">
					<span className="text-base font-heading font-bold text-primary leading-10">
						Contact
					</span>{' '}
					<br />
					Questions about these terms can be sent to support@fortifybanking.com
					(placeholder).
				</li>
			</ol>
		</section>
	)
}

export default Terms
