'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { Poll } from '@/types'

export default function EventDetails() {
  const params = useParams()
  const id = params.id as string
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPolls() {
      const { data, error } = await supabase
        .from('polls')
        .select('*')
        .eq('event_id', id)
      
      if (error) {
        console.error('Error fetching polls:', error)
      } else if (data) {
        setPolls(data)
      }
      setLoading(false)
    }
    if (id) fetchPolls()
  }, [id])

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <h1 className="text-4xl font-bold mb-8">Event Management (ID: {id})</h1>
      
      <div className="w-full max-w-5xl mb-8 flex flex-wrap gap-4 justify-between items-center">
        <div className="flex gap-4">
          <Link href={`/events/${id}/polls/create`} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
            Add New Poll
          </Link>
          <Link href={`/events/${id}/vote`} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Vote
          </Link>
          <Link href={`/events/${id}/results`} className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded">
            Results
          </Link>
        </div>
        <Link href="/" className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
          Back to Dashboard
        </Link>
      </div>

      <div className="w-full max-w-5xl">
        <h2 className="text-2xl font-semibold mb-4">Polls</h2>
        {loading ? (
          <p>Loading polls...</p>
        ) : polls.length === 0 ? (
          <p>No polls created yet.</p>
        ) : (
          <ul className="space-y-4">
            {polls.map((poll) => (
              <Link href={`/events/${id}/results#${poll.id}`} key={poll.id} className="block">
                <li className="border p-4 rounded shadow hover:bg-gray-50 transition-colors cursor-pointer">
                  <h3 className="text-xl font-bold">{poll.question}</h3>
                  <p className="text-gray-600">Type: {poll.type}</p>
                  <p className="text-sm text-blue-500 mt-2">Click to view results</p>
                </li>
              </Link>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}
