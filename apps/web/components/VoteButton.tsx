'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { useVote } from '../hooks/useVote'

export function VoteButton({ slug, onVoteOptimistic }: { slug: string, onVoteOptimistic?: (isDown: boolean) => void }) {
  const { vote, isVoting, success } = useVote(slug)

  const handleVote = async (isDown: boolean) => {
    if (isVoting) return
    onVoteOptimistic?.(isDown)
    await vote(isDown)
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 w-full">
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => handleVote(true)}
        disabled={isVoting || success}
        className="flex-1 bg-outage text-white font-disp font-bold text-xl py-6 px-4 rounded-none hover:bg-red-700 transition-colors disabled:opacity-50"
      >
        I have a problem
      </motion.button>
      
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => handleVote(false)}
        disabled={isVoting || success}
        className="flex-1 bg-ok text-white font-disp font-bold text-xl py-6 px-4 rounded-none hover:bg-green-700 transition-colors disabled:opacity-50"
      >
        Works fine for me
      </motion.button>
      
      {success && (
        <div className="absolute inset-0 bg-white/90 flex items-center justify-center font-disp font-bold text-xl text-ink z-10 animate-in fade-in">
          Vote recorded. Thanks!
        </div>
      )}
    </div>
  )
}
