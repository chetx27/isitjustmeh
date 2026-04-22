import { useState } from 'react'
import { submitVote } from '../lib/api'

export function useVote(slug: string) {
  const [isVoting, setIsVoting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const vote = async (isDown: boolean) => {
    setIsVoting(true)
    setError(null)
    setSuccess(false)
    try {
      await submitVote(slug, isDown)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to submit vote')
    } finally {
      setIsVoting(false)
    }
  }

  return { vote, isVoting, error, success }
}
