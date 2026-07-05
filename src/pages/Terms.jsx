import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, FileText } from 'lucide-react'

export default function Terms() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] pt-24 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-purple-600/20 flex items-center justify-center">
            <FileText className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Terms of Service</h1>
            <p className="text-gray-500 text-sm">Last updated: July 5, 2026</p>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-white font-bold text-xl mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Planam.io ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-xl mb-3">2. Description of Service</h2>
            <p>
              Planam.io is an event discovery and ticketing platform that allows users to browse events, purchase tickets, RSVP to free events, create and manage events, and check in attendees via QR codes. The Platform serves the African event market and is operated from Nigeria.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-xl mb-3">3. User Accounts</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li>You must provide accurate and complete information when creating an account.</li>
              <li>You are responsible for maintaining the security of your account credentials.</li>
              <li>You must be at least 16 years old to create an account.</li>
              <li>One person may not maintain more than one account.</li>
              <li>You are responsible for all activities that occur under your account.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-xl mb-3">4. Event Organizers</h2>
            <p className="mb-3">If you create events on the Platform, you agree to:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li>Provide accurate event information including date, time, location, and pricing.</li>
              <li>Honor all tickets sold through the Platform.</li>
              <li>Comply with all applicable laws and regulations for hosting events.</li>
              <li>Not create fraudulent, misleading, or deceptive events.</li>
              <li>Be responsible for the safety and experience of your attendees.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-xl mb-3">5. Ticket Purchases</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li>All ticket sales are between the event organizer and the ticket purchaser. Planam.io acts as a facilitator.</li>
              <li>Ticket prices are set by event organizers and displayed in Nigerian Naira (₦).</li>
              <li>Each ticket includes a unique QR code and check-in code for event entry.</li>
              <li>When purchasing tickets for others, you must provide the attendee's name for each ticket.</li>
              <li>Refund policies are determined by individual event organizers.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-xl mb-3">6. Referral & Reshare Program</h2>
            <p className="mb-3">The Platform offers a referral program for eligible events:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li>Event organizers can enable resharing with a commission percentage.</li>
              <li>Promoters earn commissions on ticket sales made through their referral links.</li>
              <li>Commission rates are set by event organizers and clearly displayed.</li>
              <li>Planam.io reserves the right to void commissions earned through fraudulent activity.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-xl mb-3">7. Prohibited Conduct</h2>
            <p className="mb-3">You agree not to:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li>Use the Platform for any illegal purpose or in violation of any laws.</li>
              <li>Post false, misleading, or defamatory content.</li>
              <li>Attempt to gain unauthorized access to other users' accounts.</li>
              <li>Interfere with or disrupt the Platform's infrastructure.</li>
              <li>Scrape, crawl, or use automated means to access the Platform without permission.</li>
              <li>Resell tickets at inflated prices (scalping) unless authorized by the organizer.</li>
              <li>Create events with the intent to defraud attendees.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-xl mb-3">8. Intellectual Property</h2>
            <p>
              The Planam.io name, logo, design, and all Platform content are the property of Planam.io. Event organizers retain ownership of their event content (descriptions, images, etc.) but grant Planam.io a license to display it on the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-xl mb-3">9. Limitation of Liability</h2>
            <p>
              Planam.io is provided "as is" without warranties of any kind. We are not liable for any damages arising from the use of the Platform, including but not limited to event cancellations, disputes between organizers and attendees, or technical issues. Our total liability is limited to the amount you paid to us (if any) in the 12 months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-xl mb-3">10. Termination</h2>
            <p>
              We may suspend or terminate your account at any time for violations of these Terms. You may delete your account at any time by contacting us. Upon termination, your right to use the Platform ceases immediately, but provisions that by their nature should survive (such as limitations of liability) will remain in effect.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-xl mb-3">11. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will notify users of material changes by posting an update on the Platform. Continued use of the Platform after changes constitutes acceptance of the modified Terms.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-xl mb-3">12. Governing Law</h2>
            <p>
              These Terms are governed by the laws of the Federal Republic of Nigeria. Any disputes arising from these Terms shall be resolved in the courts of Lagos, Nigeria.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-xl mb-3">13. Contact Us</h2>
            <p>
              For questions about these Terms of Service, please contact us at{' '}
              <a href="mailto:support@planam.io" className="text-purple-400 hover:text-purple-300 transition-colors">support@planam.io</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
