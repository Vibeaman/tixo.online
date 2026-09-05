import React, { useState, useEffect, useCallback } from 'react'
import { Helmet } from 'react-helmet-async'
import { Trophy, Medal, Crown } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import TxpService from '../services/TxpService'

const PODIUM_STYLE = {
  1: {
    ring: 'border-yellow-400/70 shadow-[0_0_30px_rgba(255,215,0,0.35)]',
    text: 'text-yellow-300',
    bg: 'bg-gradient-to-b from-yellow-500/15 to-transparent',
    medal: '#FFD700',
  },
  2: {
    ring: 'border-gray-300/60 shadow-[0_0_25px_rgba(192,192,192,0.3)]',
    text: 'text-gray-200',
    bg: 'bg-gradient-to-b from-gray-400/10 to-transparent',
    medal: '#C0C0C0',
  },
  3: {
    ring: 'border-orange-400/60 shadow-[0_0_25px_rgba(205,127,50,0.3)]',
    text: 'text-orange-300',
    bg: 'bg-gradient-to-b from-orange-600/10 to-transparent',
    medal: '#CD7F32',
  },
}

function initialsFor(name) {
  return (name || '?').trim().charAt(0).toUpperCase()
}

function Avatar({ url, name, size = 'w-10 h-10', textSize = 'text-sm' }) {
  return (
    <div className={`${size} rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center bg-gradient-to-br from-pink-500/30 to-purple-500/30 border border-white/10`}>
      {url ? (
        <img src={url} alt="" className="w-full h-full object-cover" />
      ) : (
        <span className={`${textSize} font-bold text-white`}>{initialsFor(name)}</span>
      )}
    </div>
  )
}

function PodiumCard({ entry, isYou }) {
  const style = PODIUM_STYLE[entry.rank]
  const size = entry.rank === 1 ? 'w-20 h-20' : 'w-16 h-16'
  return (
    <div
      className={`relative flex flex-col items-center rounded-2xl border-2 p-5 pt-8 ${style.ring} ${style.bg} ${entry.rank === 1 ? 'sm:-mt-6' : ''}`}
    >
      <div className="absolute -top-4 flex items-center justify-center w-8 h-8 rounded-full bg-gray-900 border border-gray-700">
        <Medal className="w-4 h-4" style={{ color: style.medal }} />
      </div>
      <Avatar url={entry.avatarUrl} name={entry.fullName} size={size} textSize="text-xl" />
      <p className={`mt-3 font-bold ${style.text} text-center truncate max-w-[140px]`}>{entry.fullName}</p>
      {isYou && (
        <span className="mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-white">
          You
        </span>
      )}
      <p className="mt-2 text-white font-bold text-lg">{entry.points.toLocaleString()} TXP</p>
      <p className="text-xs text-gray-400 mt-1">{entry.tier.emoji} {entry.tier.name}</p>
      <p className={`mt-2 text-xs font-semibold ${style.text}`}>#{entry.rank}</p>
    </div>
  )
}

function ListRow({ entry, isYou }) {
  return (
    <div
      className={`flex items-center gap-4 rounded-xl p-4 transition-colors ${
        isYou
          ? 'bg-gray-900/70 border-l-4 border-transparent bg-clip-padding'
          : 'bg-gray-900/30 hover:bg-gray-800/50'
      }`}
      style={isYou ? {
        borderImage: 'linear-gradient(180deg, #ec4899, #a855f7, #22d3ee) 1',
      } : undefined}
    >
      <span className="w-8 text-center text-gray-400 font-bold flex-shrink-0">#{entry.rank}</span>
      <Avatar url={entry.avatarUrl} name={entry.fullName} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-white text-sm font-medium truncate">{entry.fullName}</p>
          {isYou && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-white flex-shrink-0">
              You
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500">{entry.tier.emoji} {entry.tier.name}</p>
      </div>
      <span className="text-white font-bold text-sm flex-shrink-0">{entry.points.toLocaleString()} TXP</span>
    </div>
  )
}

export default function Leaderboard() {
  const { user } = useAuth()
  const [period, setPeriod] = useState('monthly')
  const [loading, setLoading] = useState(true)
  const [board, setBoard] = useState([])
  const [myRank, setMyRank] = useState(null)

  const load = useCallback(async (p) => {
    setLoading(true)
    try {
      const [boardData, rankData] = await Promise.all([
        TxpService.getLeaderboard(p, 50),
        user ? TxpService.getUserRank(user.id, p) : Promise.resolve(null),
      ])
      setBoard(boardData || [])
      setMyRank(rankData)
    } catch (err) {
      console.error('Failed to load leaderboard:', err)
      toast.error('Failed to load leaderboard')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    load(period)
  }, [period, load])

  const resetDate = TxpService.getLeaderboardResetDate()
  const resetLabel = resetDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  const top3 = board.slice(0, 3)
  const rest = board.slice(3)

  return (
    <div className="min-h-screen bg-[#050510] pt-24 pb-16 px-4">
      <Helmet>
        <title>TXP Leaderboard | Tixo</title>
      </Helmet>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <Trophy className="w-7 h-7 text-yellow-400" />
            <h1 className="text-2xl md:text-3xl font-bold text-white">TXP Leaderboard</h1>
          </div>
          <p className="text-gray-500 text-sm">See who's earning the most Tixo Points</p>
        </div>

        {/* Period toggle */}
        <div className="inline-flex bg-gray-900/50 border border-gray-800 rounded-full p-1 mb-6">
          {[
            { id: 'monthly', label: 'This Month' },
            { id: 'all_time', label: 'All Time' },
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setPeriod(opt.id)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                period === opt.id
                  ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Your rank card */}
        {user && myRank && (
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-3">
              <Crown className="w-5 h-5 text-purple-400 flex-shrink-0" />
              <p className="text-white font-bold">
                Your Rank: {myRank.rank ? `#${myRank.rank}` : 'Unranked'}
              </p>
            </div>
            <p className="text-gray-400 text-sm">
              {myRank.rank == null
                ? 'Start earning TXP to appear on the leaderboard!'
                : myRank.gapToNext > 0
                ? `${myRank.gapToNext.toLocaleString()} TXP behind #${myRank.nextRankUser?.rank}`
                : 'You are #1! 🎉'}
            </p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : board.length === 0 ? (
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-10 text-center">
            <Trophy className="w-8 h-8 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500">No leaderboard data yet for this period</p>
          </div>
        ) : (
          <>
            {/* Podium */}
            {top3.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 items-end">
                {/* Order: 2nd, 1st, 3rd for classic podium visual on larger screens */}
                {[top3[1], top3[0], top3[2]].map((entry, i) =>
                  entry ? (
                    <div key={entry.userId} className={i === 1 ? 'sm:order-2' : i === 0 ? 'sm:order-1' : 'sm:order-3'}>
                      <PodiumCard entry={entry} isYou={user?.id === entry.userId} />
                    </div>
                  ) : (
                    <div key={`empty-${i}`} />
                  )
                )}
              </div>
            )}

            {/* Rest of the list */}
            {rest.length > 0 && (
              <div className="space-y-2 mb-8">
                {rest.map(entry => (
                  <ListRow key={entry.userId} entry={entry} isYou={user?.id === entry.userId} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Reset note */}
        {period === 'monthly' && (
          <p className="text-center text-gray-600 text-xs mt-6">
            Leaderboard resets on {resetLabel}
          </p>
        )}
      </div>
    </div>
  )
}
