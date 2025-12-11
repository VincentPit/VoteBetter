# Voting App

A Next.js application for creating events, building polls, and collecting votes.

## Features

- **Events**: Create and manage events.
- **Polls**: Create Ranking and Rating polls for each event.
- **Voting**: Public voting via shareable links.
- **Registration**: Users register after voting (Email as unique identifier).
- **Results**: Organizers can view poll summaries.
- **Supabase Integration**: Ready for Supabase backend.

## Getting Started

1.  Install dependencies:
    ```bash
    npm install
    ```

2.  Set up Supabase:
    - Create a Supabase project.
    - Create the following tables (SQL below).
    - Copy your Supabase URL and Anon Key.
    - Create a `.env.local` file:
        ```env
        NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
        NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
        ```

3.  Run the development server:
    ```bash
    npm run dev
    ```

4.  Open [http://localhost:3000](http://localhost:3000) with your browser.

## Database Schema (Supabase SQL)

```sql
-- Events Table
create table events (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  organizer_email text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Polls Table
create table polls (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references events(id) not null,
  question text not null,
  type text not null check (type in ('ranking', 'rating')),
  options jsonb default '[]'::jsonb, -- For ranking options
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Users Table
create table users (
  email text primary key,
  name text not null,
  phone text,
  password_hash text, -- Handle auth securely in production
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Votes Table
create table votes (
  id uuid default gen_random_uuid() primary key,
  poll_id uuid references polls(id) not null,
  user_email text references users(email),
  value jsonb not null, -- Stores rank order or rating value
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

## Project Structure

- `src/app`: Next.js App Router pages.
- `src/components`: React components.
- `src/lib`: Utility functions (Supabase client).
- `src/types`: TypeScript type definitions.
