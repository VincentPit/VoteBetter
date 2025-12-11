'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Event } from '@/types'

export default function Home() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const storedEmail = localStorage.getItem('user_email')
    if (storedEmail) {
      setEmail(storedEmail)
      setIsLoggedIn(true)
      fetchEvents(storedEmail)
    }
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      localStorage.setItem('user_email', email)
      setIsLoggedIn(true)
      fetchEvents(email)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('user_email')
    setEmail('')
    setIsLoggedIn(false)
    setEvents([])
  }

  async function fetchEvents(userEmail: string) {
    setLoading(true)
    try {
      // 1. Fetch events organized by user
      const { data: organizedEvents, error: orgError } = await supabase
        .from('events')
        .select('*')
        .eq('organizer_email', userEmail)

      if (orgError) {
        console.error('Error fetching organized events:', orgError)
        throw orgError
      }

      // 2. Fetch events voted by user
      // Get votes -> poll_ids
      const { data: votes, error: voteError } = await supabase
        .from('votes')
        .select('poll_id')
        .eq('user_email', userEmail)
      
      if (voteError) {
        console.error('Error fetching votes:', voteError)
        throw voteError
      }

      let votedEvents: Event[] = []
      if (votes && votes.length > 0) {
        const pollIds = votes.map(v => v.poll_id)
        // Get polls -> event_ids
        const { data: polls, error: pollError } = await supabase
          .from('polls')
          .select('event_id')
          .in('id', pollIds)
        
        if (pollError) {
          console.error('Error fetching polls for votes:', pollError)
          throw pollError
        }

        if (polls && polls.length > 0) {
          const eventIds = polls.map(p => p.event_id)
          // Get events
          const { data: vEvents, error: vEventError } = await supabase
            .from('events')
            .select('*')
            .in('id', eventIds)
          
          if (vEventError) {
            console.error('Error fetching voted events:', vEventError)
            throw vEventError
          }
          if (vEvents) votedEvents = vEvents
        }
      }

      // Merge and deduplicate
      const allEvents = [...(organizedEvents || []), ...votedEvents]
      const uniqueEvents = Array.from(new Map(allEvents.map(item => [item.id, item])).values())
      
      setEvents(uniqueEvents)
    } catch (error) {
      console.error('Error fetching events:', error)
      if (typeof error === 'object' && error !== null) {
        console.error('Error details:', JSON.stringify(error, null, 2))
      }
    } finally {
      setLoading(false)
    }
  }

  if (!isLoggedIn) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <h1 className="text-4xl font-bold mb-8">Voting App</h1>
        <form onSubmit={handleLogin} className="w-full max-w-xs">
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Enter your email to continue
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              required
            />
          </div>
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full"
            type="submit"
          >
            Login
          </button>
        </form>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <div className="w-full max-w-5xl flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Your Events</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{email}</span>
          <button onClick={handleLogout} className="text-red-500 text-sm hover:underline">Logout</button>
        </div>
      </div>
      
      <div className="w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex mb-8">
        <Link href="/events/create" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Create New Event
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-5xl">
        {loading ? (
          <p>Loading events...</p>
        ) : events.length === 0 ? (
          <p>No events found. Create one or vote in one!</p>
        ) : (
          events.map((event) => (
            <div key={event.id} className="border p-4 rounded shadow hover:shadow-lg transition">
              <h2 className="text-xl font-semibold mb-2">{event.title}</h2>
              <p className="text-gray-600 mb-4">{event.description}</p>
              <div className="flex gap-2 flex-wrap">
                <Link href={`/events/${event.id}`} className="text-blue-500 hover:underline">
                  Manage
                </Link>
                <Link href={`/events/${event.id}/vote`} className="text-green-500 hover:underline">
                  Vote Link
                </Link>
                <Link href={`/events/${event.id}/results`} className="text-purple-500 hover:underline">
                  Results
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  )
}
