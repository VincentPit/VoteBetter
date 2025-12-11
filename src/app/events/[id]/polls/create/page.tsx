'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { PollType } from '@/types'

export default function CreatePoll() {
  const params = useParams()
  const eventId = params.id as string
  const router = useRouter()
  
  const [question, setQuestion] = useState('')
  const [type, setType] = useState<PollType>('ranking')
  const [options, setOptions] = useState<string[]>(['', ''])
  const [bulkText, setBulkText] = useState('')

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const addOption = () => {
    setOptions([...options, ''])
  }

  const handleBulkParse = () => {
    if (!bulkText.trim()) return
    const newOptions = bulkText.split('\n').map(s => s.trim()).filter(s => s !== '')
    if (newOptions.length > 0) {
      setOptions(newOptions)
      setBulkText('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const formattedOptions = type === 'ranking' 
      ? options.filter(o => o.trim() !== '').map((text, idx) => ({ id: idx.toString(), text }))
      : []

    const { error } = await supabase
      .from('polls')
      .insert([{
        event_id: eventId,
        question,
        type,
        options: formattedOptions
      }])

    if (error) {
      console.error('Error creating poll:', error)
      alert('Error creating poll')
    } else {
      router.push(`/events/${eventId}`)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <h1 className="text-4xl font-bold mb-8">Create Poll</h1>
      
      <form onSubmit={handleSubmit} className="w-full max-w-md">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Question</label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Type</label>
          <select
            className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={type}
            onChange={(e) => setType(e.target.value as PollType)}
          >
            <option value="ranking">Ranking</option>
            <option value="rating">Rating</option>
          </select>
        </div>

        {type === 'ranking' && (
          <div className="mb-4">
            <div className="mb-6 p-4 bg-gray-50 rounded border">
              <label className="block text-gray-700 text-sm font-bold mb-2">Bulk Add Options</label>
              <p className="text-xs text-gray-500 mb-2">Paste options separated by new lines to auto-fill.</p>
              <textarea
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-2"
                rows={4}
                placeholder="Option 1&#10;Option 2&#10;Option 3"
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
              />
              <button
                type="button"
                onClick={handleBulkParse}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-1 px-3 rounded text-sm"
              >
                Parse & Fill
              </button>
            </div>

            <label className="block text-gray-700 text-sm font-bold mb-2">Options</label>
            {options.map((opt, idx) => (
              <div key={idx} className="mb-2">
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  type="text"
                  placeholder={`Option ${idx + 1}`}
                  value={opt}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                  required
                />
              </div>
            ))}
            <button
              type="button"
              onClick={addOption}
              className="text-blue-500 hover:text-blue-700 text-sm"
            >
              + Add Option
            </button>
          </div>
        )}

        <div className="flex gap-4 mt-4">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex-1"
            type="submit"
          >
            Create Poll
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
    </main>
  )
}
