export type Event = {
  id: string
  title: string
  description: string
  organizer_email: string
  created_at: string
}

export type PollType = 'ranking' | 'rating'

export type PollOption = {
  id: string
  text: string
}

export type Poll = {
  id: string
  event_id: string
  question: string
  type: PollType
  options: PollOption[]
  created_at: string
}

export type Vote = {
  id: string
  poll_id: string
  user_email?: string
  value: any // specific to poll type
  created_at: string
}

export type User = {
  email: string
  name: string
  phone: string
  password_hash: string // In a real app, handle auth securely
  created_at: string
}
