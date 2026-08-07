import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Sparkles, Search, LayoutDashboard, ShieldCheck, TrendingUp, ListChecks, Rocket } from 'lucide-react'

const gradientText = {
  background: 'linear-gradient(135deg, #E91E8C, #8B5CF6, #22D3EE)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
}

function IconBadge({ Icon }) {
  return (
    <div
      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ background: 'linear-gradient(135deg, #E91E8C, #8B5CF6, #22D3EE)' }}
    >
      <Icon className="w-6 h-6 text-white" />
    </div>
  )
}

const whyChoose = [
  'Event ticketing marketplace for event discovery',
  'Easy event creation and management',
  'Secure online ticket sales',
  'QR code ticket verification',
  'Real-time sales monitoring',
  'Team access for event operations',
  'Attendee analytics and reporting',
  'Fast and reliable ticket delivery',
  'Built for events of all sizes',
]

const managementTools = [
  'Create and publish events quickly',
  'Sell tickets online with secure payment processing',
  'Monitor ticket sales in real time',
  'Manage attendee registrations',
  'Access event performance analytics',
  'Download attendee data for future engagement and marketing',
  'Verify tickets using unique QR codes',
  'Assign team members to manage event access and check-ins',
]

export default function About() {
  return (
    <div className="min-h-screen bg-[#050510] pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        {/* Hero */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <IconBadge Icon={Sparkles} />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">About Tixo</h1>
              <p className="text-gray-500 text-sm">Connecting event organizers and attendees through seamless ticketing</p>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 text-gray-300 leading-relaxed space-y-4">
            <p>
              Tixo is an event ticketing marketplace and management platform designed to help event organizers create, manage, promote, and sell tickets for events while making it easy for attendees to discover and purchase tickets online.
            </p>
            <p>
              Whether you're organizing a concert, comedy show, conference, workshop, festival, campus event, church program, networking event, or private gathering, Tixo provides the tools needed to manage your event from start to finish.
            </p>
            <p>
              Our goal is to simplify event ticketing, streamline event operations, and help organizers reach more people while delivering a smooth experience for attendees.
            </p>
          </div>
        </div>

        {/* Marketplace */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <IconBadge Icon={Search} />
            <h2 className="text-2xl font-bold text-white">An Event Marketplace Built for Discovery</h2>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 text-gray-300 leading-relaxed space-y-4">
            <p>
              Finding great events shouldn't be difficult. Tixo serves as a marketplace where attendees can discover upcoming events, explore experiences that match their interests, and purchase tickets securely in just a few clicks.
            </p>
            <p>
              By bringing organizers and attendees together on one platform, Tixo helps events gain visibility while giving audiences a trusted place to find and book tickets.
            </p>
          </div>
        </section>

        {/* Management tools */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <IconBadge Icon={LayoutDashboard} />
            <h2 className="text-2xl font-bold text-white">Powerful Event Management Tools</h2>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 text-gray-300 leading-relaxed space-y-4">
            <p>Beyond ticket sales, Tixo equips organizers with the tools needed to run successful events efficiently.</p>
            <p className="text-white font-semibold">With Tixo, event organizers can:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              {managementTools.map(item => (
                <li key={item}><span className="text-gray-300">{item}</span></li>
              ))}
            </ul>
            <p>Our platform is built to reduce administrative workload and help organizers focus on creating exceptional event experiences.</p>
          </div>
        </section>

        {/* Secure ticketing */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <IconBadge Icon={ShieldCheck} />
            <h2 className="text-2xl font-bold text-white">Secure and Reliable Ticketing</h2>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 text-gray-300 leading-relaxed space-y-4">
            <p>
              Every ticket generated on Tixo includes a unique QR code that enables fast and secure event entry. This helps reduce ticket fraud, prevents duplicate usage, and ensures a smoother check-in process for attendees.
            </p>
            <p>
              We prioritize reliability, security, and transparency to give both organizers and attendees confidence in every transaction.
            </p>
          </div>
        </section>

        {/* Growth */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <IconBadge Icon={TrendingUp} />
            <h2 className="text-2xl font-bold text-white">Helping Events Grow</h2>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 text-gray-300 leading-relaxed space-y-4">
            <p>
              Successful events are driven by data and audience engagement. Tixo provides organizers with insights into ticket sales, attendee behavior, and event performance, making it easier to understand what works and improve future events.
            </p>
            <p>
              Whether you're hosting a small community gathering or a large-scale event, Tixo provides the tools and visibility needed to grow your audience and maximize attendance.
            </p>
          </div>
        </section>

        {/* Why choose */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <IconBadge Icon={ListChecks} />
            <h2 className="text-2xl font-bold text-white">Why Choose Tixo?</h2>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8">
            <ul className="grid sm:grid-cols-2 gap-3">
              {whyChoose.map(item => (
                <li key={item} className="flex items-start gap-2 text-gray-300">
                  <span style={gradientText} className="font-bold mt-0.5">✓</span> {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Vision */}
        <section className="mb-4">
          <div className="flex items-center gap-3 mb-4">
            <IconBadge Icon={Rocket} />
            <h2 className="text-2xl font-bold text-white">Our Vision</h2>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 text-gray-300 leading-relaxed space-y-4">
            <p>
              We envision a future where event organizers have access to powerful yet simple technology that helps them reach larger audiences, sell more tickets, and deliver outstanding event experiences.
            </p>
            <p>
              Tixo exists to bridge the gap between event organizers and attendees by creating a trusted marketplace where great events can thrive and memorable experiences can begin.
            </p>
            <p className="text-lg font-semibold" style={gradientText}>
              At Tixo, we do more than sell tickets — we help people discover experiences, connect with communities, and create moments worth remembering.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
