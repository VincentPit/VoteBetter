import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

export const alt = 'Vote Event'
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: polls } = await supabase
    .from('polls')
    .select('question')
    .eq('event_id', id)
    .limit(1)

  const { data: event } = await supabase
    .from('events')
    .select('title')
    .eq('id', id)
    .single()

  const question = polls?.[0]?.question
  const title = event?.title || 'Vote Event'

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(to bottom right, #e0e7ff, #ffffff)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'white',
            padding: '60px',
            borderRadius: '30px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb',
            maxWidth: '90%',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 32, color: '#6b7280', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '2px', fontFamily: 'sans-serif' }}>
            {title}
          </div>
          <div style={{ fontSize: 64, fontWeight: 'bold', color: '#111827', lineHeight: 1.2, fontFamily: 'sans-serif' }}>
            {question || 'Join the Vote!'}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
