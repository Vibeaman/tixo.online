import { Helmet } from 'react-helmet-async'
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
  'A marketplace made for discovery, not just listings',
  'Effortless event creation, launched in minutes',
  'Secure, encrypted ticket sales you can trust',
  'QR verification for smooth, fraud-free entry',
  'Live sales insight, the moment it happens',
  'Shared team access for seamless event-day operations',
  'Attendee analytics that tell a real story',
  'Swift, dependable ticket delivery, every time',
  'Thoughtfully built for events of every size',
]

const managementTools = [
  'Bring an event to life and publish it in minutes',
  'Accept payments securely, with nothing left to chance',
  'Watch sales unfold in real time, as they happen',
  'Keep attendee registrations organized and within reach',
  'Understand performance through clear, honest analytics',
  'Hold on to attendee data for the relationships that follow',
  'Verify every ticket with a unique, secure QR code',
  'Bring your team in, with access shaped around each role',
]

export default function About() {
  return (
    <>
      <Helmet>
        <title>About Tixo, The Event Ticketing Platform</title>
        <meta name="description" content="Learn about Tixo, the modern event ticketing platform built for creators and attendees." />
      </Helmet>
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
              <p className="text-gray-500 text-sm">Where events find their people, and people find their moments</p>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 text-gray-300 leading-relaxed space-y-4">
            <p>
              Tixo was built on a simple belief: buying a ticket should feel as good as the event itself. We're a ticketing marketplace where organizers craft experiences with ease, and attendees discover them without friction, every detail considered, nothing left clunky.
            </p>
            <p>
              A concert, a comedy night, a conference, a quiet campus gathering, a Sunday church program, a room full of strangers becoming a network, whatever the occasion, Tixo carries it from first idea to final applause.
            </p>
            <p>
              We're here to make ticketing feel effortless, so organizers can pour their energy into the moment, and attendees can simply show up and belong.
            </p>
          </div>
        </div>

        {/* Marketplace */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <IconBadge Icon={Search} />
            <h2 className="text-2xl font-bold text-white">A Marketplace Built for Discovery</h2>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 text-gray-300 leading-relaxed space-y-4">
            <p>
              The best events are often the ones you almost missed. Tixo exists to close that gap, a quiet, well-lit space where attendees can wander through what's happening nearby, find what speaks to them, and secure a seat in a few unhurried clicks.
            </p>
            <p>
              By holding organizers and attendees in the same place, Tixo lets great events be seen, and gives audiences somewhere trustworthy to return to, again and again.
            </p>
          </div>
        </section>

        {/* Management tools */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <IconBadge Icon={LayoutDashboard} />
            <h2 className="text-2xl font-bold text-white">Thoughtful Tools for Event Management</h2>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 text-gray-300 leading-relaxed space-y-4">
            <p>Ticket sales are only the beginning. Behind every well-run event is a quieter kind of work, and that's where Tixo steadies the hand of every organizer.</p>
            <p className="text-white font-semibold">With Tixo, you can:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              {managementTools.map(item => (
                <li key={item}><span className="text-gray-300">{item}</span></li>
              ))}
            </ul>
            <p>We handle the details so organizers can stay focused on what truly matters: the experience itself.</p>
          </div>
        </section>

        {/* Secure ticketing */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <IconBadge Icon={ShieldCheck} />
            <h2 className="text-2xl font-bold text-white">Ticketing You Can Trust</h2>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 text-gray-300 leading-relaxed space-y-4">
            <p>
              Every ticket carries its own unique QR code, a small detail with a quiet purpose: swift, secure entry, no duplicates slipping through, no fraud finding a way in. Just a smooth walk through the door.
            </p>
            <p>
              Trust isn't an afterthought here. It's woven into every transaction, so organizers and attendees alike can move forward with confidence.
            </p>
          </div>
        </section>

        {/* Growth */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <IconBadge Icon={TrendingUp} />
            <h2 className="text-2xl font-bold text-white">Growing With Every Event</h2>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 text-gray-300 leading-relaxed space-y-4">
            <p>
              Every great event leaves a trail worth reading. Tixo turns ticket sales, attendee behavior, and turnout into insight organizers can actually use, a clearer picture of what resonated, and what to carry into the next one.
            </p>
            <p>
              From an intimate gathering of friends to a stage full of strangers, Tixo gives organizers the visibility to grow an audience, one event at a time.
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
              We imagine a future where technology quietly does its job, simple enough to trust, powerful enough to help organizers reach further, sell with ease, and hand every attendee a night to remember.
            </p>
            <p>
              Tixo exists in the space between organizers and attendees, holding a trusted marketplace where great events are given room to thrive, and memorable moments are given room to begin.
            </p>
            <p className="text-lg font-semibold" style={gradientText}>
              At Tixo, we do more than sell tickets. We help people discover experiences, find their communities, and hold onto moments worth remembering.
            </p>
          </div>
        </section>
      </div>
    </div>
    </>

  )
}
