import React from 'react'
import { RadioGroup, RadioGroupItem } from './ui/radio-group'
import { Label } from './ui/label'
import { BiSolidPlusCircle, BiSolidUserCircle } from 'react-icons/bi'

const contacts = [
	{
		'_links': {
			'self': {
				'href':
					'https://api-sandbox.dwolla.com/customers/25e541e0-6a18-48d5-b640-883f8c9c3170',
			},
		},
		'id': '25e541e0-6a18-48d5-b640-883f8c9c3170',
		'firstName': 'Jill',
		'lastName': 'Doe',
		'email': 'jilldoe@email.com',
		'type': 'unverified',
		'status': 'unverified',
		'created': '2015-09-03T23:56:10.023Z',
	},
	{
		'_links': {
			'self': {
				'href':
					'https://api-sandbox.dwolla.com/customers/6b254307-6c3b-4071-87fe-7c4569d1a216',
			},
		},
		'id': '6b254307-6c3b-4071-87fe-7c4569d1a216',
		'firstName': 'John',
		'lastName': 'Smith',
		'email': 'jsmith@email.com',
		'type': 'unverified',
		'status': 'unverified',
		'created': '2015-09-03T23:56:10.023Z',
	},
]

const Contacts = () => {
	return (
		<div className="space-y-3 mt-8 overflow-x-hidden">
			<p className="text-sm font-medium leading-none">Choose beneficiary</p>
			<div className="flex gap-4 pl-5 pb-10 overflow-x-auto">
				<div className="w-36 h-40 flex flex-col items-center justify-center rounded-xl shadow-card py-4 px-5 mt-4 text-center text-sm hover:bg-gray-300 peer-data-[state=checked]:bg-primary-700 [&:has([data-state=checked])]:bg-primary-700 peer-data-[state=checked]:text-white [&:has([data-state=checked])]:text-white">
					<BiSolidPlusCircle className="text-primary-100 text-8xl" />
				</div>
				<RadioGroup className="flex gap-4">
					{contacts.map((contact) => (
						<div key={contact.id}>
							<RadioGroupItem
								value={contact.email}
								id={contact.email}
								className="peer sr-only"
							/>
							<Label
								htmlFor={contact.email}
								className="w-36 h-40 flex flex-col items-center justify-center rounded-xl shadow-card py-4 px-5 mt-4 text-center text-sm hover:bg-gray-300 peer-data-[state=checked]:bg-primary-700 [&:has([data-state=checked])]:bg-primary-700 peer-data-[state=checked]:text-white [&:has([data-state=checked])]:text-white">
								<BiSolidUserCircle className="text-primary-400 text-8xl" />
								{contact.firstName}
							</Label>
						</div>
					))}
				</RadioGroup>
			</div>
		</div>
	)
}

export default Contacts
