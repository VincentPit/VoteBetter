'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { Poll, Vote } from '@/types'

type PollResult = {
  id: string
  question: string
  type: string
  summary: string
  chartData?: { label: string; value: number; total: number }[]
  unit?: string
}

export default function ResultsPage() {
  const params = useParams()
  const id = params.id as string
  const [results, setResults] = useState<PollResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchResults() {
      // 1. Fetch polls
      const { data: polls, error: pollError } = await supabase
        .from('polls')
        .select('*')
        .eq('event_id', id)
      
      if (pollError || !polls) {
        console.error('Error fetching polls:', pollError)
        setLoading(false)
        return
      }

      // 2. Fetch votes for these polls
      const pollIds = polls.map(p => p.id)
      const { data: votes, error: voteError } = await supabase
        .from('votes')
        .select('*')
        .in('poll_id', pollIds)
      
      if (voteError) {
        console.error('Error fetching votes:', voteError)
        setLoading(false)
        return
      }

      // 3. Aggregate
      const computedResults: PollResult[] = (polls as unknown as Poll[]).map(poll => {
        const pollVotes = votes?.filter(v => v.poll_id === poll.id) || []
        let summary = 'No votes yet'
        let chartData: { label: string; value: number; total: number }[] = []

        if (pollVotes.length > 0) {
          if (poll.type === 'rating') {
            const sum = pollVotes.reduce((acc, v) => acc + (Number(v.value) || 0), 0)
            const avg = (sum / pollVotes.length).toFixed(1)
            summary = `Average: ${avg} / 5`
            
            // Distribution for chart
            const distribution = [0, 0, 0, 0, 0]
            pollVotes.forEach(v => {
              const val = Number(v.value)
              if (val >= 1 && val <= 5) distribution[val - 1]++
            })
            chartData = distribution.map((count, idx) => ({
              label: `${idx + 1} Stars`,
              value: count,
              total: pollVotes.length
            }))

          } else if (poll.type === 'ranking') {
            // Borda Count Aggregation
            const numOptions = poll.options.length
            const optionScores: Record<string, number> = {}
            
            // Initialize scores
            poll.options.forEach(opt => optionScores[opt.id] = 0)

            pollVotes.forEach(v => {
              const rankMap = v.value
              Object.entries(rankMap).forEach(([optId, rank]) => {
                const r = Number(rank)
                if (r > 0 && r <= numOptions) {
                   // Rank 1 = N points, Rank N = 1 point
                   optionScores[optId] = (optionScores[optId] || 0) + (numOptions - r + 1)
                }
              })
            })

            const sortedOptions = poll.options.sort((a, b) => {
              return (optionScores[b.id] || 0) - (optionScores[a.id] || 0)
            })

            // Max possible score for an option is if everyone ranked it #1
            const maxPoints = pollVotes.length * numOptions

            chartData = sortedOptions.map(opt => ({
              label: opt.text,
              value: optionScores[opt.id] || 0,
              total: maxPoints
            }))
            
            summary = `Rankings based on Borda Count (Rank 1 = ${numOptions} pts)`
          }
        }

        return {
          id: poll.id,
          question: poll.question,
          type: poll.type,
          summary,
          chartData,
          unit: poll.type === 'ranking' ? 'pts' : 'votes'
        }
      })

      setResults(computedResults)
      setLoading(false)
    }

    if (id) fetchResults()
  }, [id])

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <div className="w-full max-w-5xl mb-4">
        <Link href="/" className="text-blue-500 hover:underline">
          &larr; Back to Dashboard
        </Link>
      </div>
      <h1 className="text-4xl font-bold mb-8">Event Results (ID: {id})</h1>
      
      <div className="w-full max-w-4xl">
        {loading ? (
          <p>Loading results...</p>
        ) : results.length === 0 ? (
          <p>No polls found for this event.</p>
        ) : (
          results.map((res) => (
            <div key={res.id} id={res.id} className="mb-6 border p-6 rounded shadow bg-white">
              <h3 className="text-xl font-bold mb-2">{res.question}</h3>
              <p className="text-gray-600 mb-4 text-sm uppercase tracking-wide">{res.type} - {res.summary}</p>
              
              <div className="space-y-3">
                {res.chartData?.map((item, i) => {
                  const percentage = item.total > 0 ? Math.round((item.value / item.total) * 100) : 0
                  return (
                    <div key={i} className="relative">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{item.label}</span>
                        <span className="text-gray-500">{item.value} {res.unit || 'votes'} ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  )
}
