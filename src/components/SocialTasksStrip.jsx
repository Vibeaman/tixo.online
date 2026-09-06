import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Share2, ExternalLink, ArrowRight, Loader as LoaderIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import TxpService from '../services/TxpService'
import { triggerTxpCelebration } from './TxpCelebration'

const PLATFORM_LABEL = {
  instagram: 'Instagram',
  x: 'X',
  tiktok: 'TikTok',
  facebook: 'Facebook',
  youtube: 'YouTube',
  whatsapp: 'WhatsApp',
  other: 'Task',
}

// Compact version of the Ways to Earn social task card, sized for the home page.
// Signed-out visitors still see the tasks (they're a signup hook) but get sent
// to the login page when they try to claim.
function TaskTile({ task, onClaim, claiming, isAuthed }) {
  const [opened, setOpened] = useState(false)

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 flex flex-col gap-4 hover:border-gray-700 transition-colors">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
          <Share2 className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-white font-bold text-sm leading-snug">{task.title}</h3>
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-purple-500/20 text-purple-300">
              {PLATFORM_LABEL[task.platform] || 'Task'}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-white">
              +{task.reward_amount} TXP
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-auto">
        <a
          href={task.link_url}
          target="_blank"
          rel="noreferrer"
          onClick={() => setOpened(true)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-white bg-gray-800 border border-gray-700 rounded-full px-3 py-2 hover:bg-gray-700 transition-colors"
        >
          Open <ExternalLink className="w-3 h-3" />
        </a>
        <button
          onClick={() => {
            if (!isAuthed) return onClaim(task)
            if (!opened) return toast.error('Tap "Open" and finish the task first')
            onClaim(task)
          }}
          disabled={claiming}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-white rounded-full px-3 py-2 transition-transform disabled:opacity-60 ${
            !isAuthed || opened
              ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 hover:-translate-y-0.5'
              : 'bg-gray-800/50 border border-gray-700/50 opacity-50 cursor-not-allowed'
          }`}
        >
          {claiming ? <LoaderIcon className="w-3.5 h-3.5 animate-spin" /> : !isAuthed ? 'Sign in to earn' : opened ? "I've Done This" : '🔒 Do Task'}
        </button>
      </div>
    </div>
  )
}

export default function SocialTasksStrip() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [claimingId, setClaimingId] = useState(null)

  useEffect(() => {
    let cancelled = false
    TxpService.getAvailableSocialTasks(user?.id)
      .then(data => { if (!cancelled) setTasks((data || []).slice(0, 3)) })
      .catch(() => { if (!cancelled) setTasks([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [user?.id])

  async function handleClaim(task) {
    if (!user) {
      navigate('/login')
      return
    }
    setClaimingId(task.id)
    try {
      const result = await TxpService.completeSocialTask(user.id, task.id)
      if (result?.success) {
        triggerTxpCelebration(task.reward_amount, 'social_task')
        setTasks(prev => prev.filter(t => t.id !== task.id))
      } else if (result?.alreadyCompleted) {
        toast('You already claimed this one')
        setTasks(prev => prev.filter(t => t.id !== task.id))
      } else {
        toast.error(result?.error || 'Could not claim this task')
      }
    } catch (err) {
      console.error('Social task claim failed:', err)
      toast.error('Could not claim this task')
    } finally {
      setClaimingId(null)
    }
  }

  if (loading || tasks.length === 0) return null

  return (
    <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              🎁 Quick Ways to Earn
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              Free Tixo Points for a few seconds of your time
            </p>
          </div>
          <Link
            to="/ways-to-earn"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-purple-300 hover:text-white transition-colors flex-shrink-0"
          >
            See all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map(task => (
            <TaskTile
              key={task.id}
              task={task}
              isAuthed={Boolean(user)}
              claiming={claimingId === task.id}
              onClaim={handleClaim}
            />
          ))}
        </div>

        <Link
          to="/ways-to-earn"
          className="sm:hidden mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-purple-300"
        >
          See all ways to earn <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  )
}
