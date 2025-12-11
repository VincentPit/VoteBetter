'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const eventId = searchParams.get('eventId')

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 1. Create user
    const { error: userError } = await supabase
      .from('users')
      .upsert([{ 
        email: formData.email, 
        name: formData.name, 
        phone: formData.phone, 
        password_hash: formData.password // In production, hash this!
      }])
    
    if (userError) {
      console.error('Error creating user:', userError)
      alert('Error creating user')
      return
    }

        // 2. Save pending votes
    if (eventId) {
      const pendingVotes = localStorage.getItem(`pending_votes_${eventId}`)
      if (pendingVotes) {
        const votesMap = JSON.parse(pendingVotes)
        const pollIds = Object.keys(votesMap)

        // Check for existing votes
        const { data: existingVotes } = await supabase
          .from('votes')
          .select('id')
          .in('poll_id', pollIds)
          .eq('user_email', formData.email)

        if (existingVotes && existingVotes.length > 0) {
          alert('You have already voted for this event.')
          localStorage.removeItem(`pending_votes_${eventId}`)
          router.push(`/events/${eventId}/results`)
          return
        }

        const votesToInsert = Object.entries(votesMap).map(([pollId, value]) => ({
          poll_id: pollId,
          user_email: formData.email,
          value: value
        }))

        const { error: voteError } = await supabase
          .from('votes')
          .insert(votesToInsert)
        
        if (voteError) {
          console.error('Error saving votes:', voteError)
          alert('Error saving votes')
        } else {
          localStorage.removeItem(`pending_votes_${eventId}`)
        }
      }
    }
    
    // Set user session
    localStorage.setItem('user_email', formData.email)

    alert('Thank you for voting!')
    router.push(eventId ? `/events/${eventId}/results` : '/')
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md">
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">Name</label>
        <input
          name="name"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          type="text"
          required
          onChange={handleChange}
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
        <input
          name="email"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          type="email"
          required
          onChange={handleChange}
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">Phone</label>
        <input
          name="phone"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          type="tel"
          required
          onChange={handleChange}
        />
      </div>
      <div className="mb-6">
        <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
        <input
          name="password"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
          type="password"
          required
          onChange={handleChange}
        />
      </div>
      <div className="flex items-center justify-between gap-4">
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex-1"
          type="submit"
        >
          Complete Registration & Vote
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

export default function Register() {
  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <h1 className="text-4xl font-bold mb-8">Complete Registration to Submit Vote</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <RegisterForm />
      </Suspense>
    </main>
  )
}
