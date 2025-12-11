'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Poll } from '@/types'

export default function VotePage() {
  const params = useParams()
  const eventId = params.id as string
  const router = useRouter()
  const [polls, setPolls] = useState<Poll[]>([])
  const [votes, setVotes] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPolls() {
      const { data, error } = await supabase
        .from('polls')
        .select('*')
        .eq('event_id', eventId)
      
      if (error) {
        console.error('Error fetching polls:', error)
      } else if (data) {
        setPolls(data)
      }
      setLoading(false)
    }
    if (eventId) fetchPolls()
  }, [eventId])

  const handleVoteChange = (pollId: string, value: any) => {
    setVotes({ ...votes, [pollId]: value })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validation: Check for duplicate rankings
    for (const poll of polls) {
      if (poll.type === 'ranking') {
        const pollVotes = votes[poll.id] || {}
        const ranks = Object.values(pollVotes)
        const uniqueRanks = new Set(ranks)
        
        if (ranks.length !== uniqueRanks.size) {
          alert(`Please ensure all options have a unique ranking for: "${poll.question}"`)
          return
        }
        
        // Also ensure all options are ranked (though 'required' attribute helps, this is safer)
        if (ranks.length !== poll.options.length) {
           alert(`Please rank all options for: "${poll.question}"`)
           return
        }
      }
    }

    // Save votes to local storage to be picked up by registration
    localStorage.setItem(`pending_votes_${eventId}`, JSON.stringify(votes))
    router.push(`/register?eventId=${eventId}`)
  }

  if (loading) return <div className="p-24">Loading polls...</div>

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <h1 className="text-4xl font-bold mb-8">Vote for Event {eventId}</h1>
      
      <form onSubmit={handleSubmit} className="w-full max-w-2xl">
        {polls.map((poll) => (
          <div key={poll.id} className="mb-8 border p-6 rounded shadow">
            <h3 className="text-xl font-bold mb-4">{poll.question}</h3>
            
            {poll.type === 'ranking' && (
              <div className="space-y-2">
                <p className="text-sm text-gray-500 mb-2">Rank the options (1 is best)</p>
                {poll.options.map((opt) => (
                  <div key={opt.id} className="flex items-center gap-2">
                    <label>{opt.text}</label>
                    <input
                      type="number"
                      min="1"
                      max={poll.options.length}
                      className="border rounded w-16 p-1"
                      onChange={(e) => handleVoteChange(poll.id, { ...votes[poll.id], [opt.id]: e.target.value })}
                      required
                    />
                  </div>
                ))}
              </div>
            )}

            {poll.type === 'rating' && (
              <div className="flex gap-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <label key={star} className="cursor-pointer">
                    <input
                      type="radio"
                      name={`poll-${poll.id}`}
                      value={star}
                      onChange={() => handleVoteChange(poll.id, star)}
                      className="mr-1"
                      required
                    />
                    {star} Stars
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}

        <div className="flex gap-4">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex-1"
            type="submit"
          >
            Submit Votes
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
          >
            Cancel
          </button>
        </div>
      </form>
    </main>
  )
}
