import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Shield } from 'lucide-react'

export default function Privacy() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] pt-24 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-purple-600/20 flex items-center justify-center">
            <Shield className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
            <p className="text-gray-500 text-sm">Last updated: July 5, 2026</p>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-white font-bold text-xl mb-3">1. Introduction</h2>
            <p>
              Planam.io ("we", "us", "our") is an event discovery and ticketing platform. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services at <span className="text-purple-400">planam.io</span>.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-xl mb-3">2. Information We Collect</h2>
            <p className="mb-3">We collect information you provide directly to us, including:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li><span className="text-gray-300">Account Information:</span> Name, email address, and profile picture when you create an account or sign in with Google.</li>
              <li><span className="text-gray-300">Event Information:</span> Details you provide when creating events, including event title, description, location, dates, and images.</li>
              <li><span className="text-gray-300">Ticket Information:</span> Purchase details, attendee names, check-in codes, and transaction records.</li>
              <li><span className="text-gray-300">Communications:</span> Comments you post on events and any messages you send to us.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-xl mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li>Provide, maintain, and improve our services</li>
              <li>Process ticket purchases and manage event check-ins</li>
              <li>Send you event-related notifications and confirmations</li>
              <li>Enable event organizers to manage their events and attendees</li>
              <li>Generate analytics and insights for event organizers</li>
              <li>Prevent fraud and ensure platform security</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-xl mb-3">4. Information Sharing</h2>
            <p className="mb-3">We may share your information in the following circumstances:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li><span className="text-gray-300">Event Organizers:</span> When you purchase a ticket or RSVP, the organizer receives your name and check-in status to manage their event.</li>
              <li><span className="text-gray-300">Service Providers:</span> We use third-party services such as Supabase (database & authentication) and Vercel (hosting) to operate our platform.</li>
              <li><span className="text-gray-300">Legal Requirements:</span> We may disclose information if required by law, regulation, or legal process.</li>
            </ul>
            <p className="mt-3">We do <span className="text-white font-semibold">not</span> sell your personal information to third parties.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-xl mb-3">5. Google OAuth</h2>
            <p>
              When you sign in with Google, we receive your name, email address, and profile picture from your Google account. We use this information solely to create and manage your Planam account. We do not access your Google contacts, calendar, or other Google services.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-xl mb-3">6. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal information. Your data is stored securely using Supabase's infrastructure with row-level security policies. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-xl mb-3">7. Data Retention</h2>
            <p>
              We retain your personal information for as long as your account is active or as needed to provide our services. You can request deletion of your account and associated data by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-xl mb-3">8. Your Rights</h2>
            <p className="mb-3">You have the right to:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li>Access and receive a copy of your personal data</li>
              <li>Correct inaccurate personal data</li>
              <li>Request deletion of your personal data</li>
              <li>Object to or restrict processing of your personal data</li>
              <li>Withdraw consent at any time where processing is based on consent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-xl mb-3">9. Cookies</h2>
            <p>
              We use essential cookies and local storage to maintain your authentication session and preferences. We do not use tracking or advertising cookies.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-xl mb-3">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-xl mb-3">11. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us at{' '}
              <a href="mailto:support@planam.io" className="text-purple-400 hover:text-purple-300 transition-colors">support@planam.io</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
