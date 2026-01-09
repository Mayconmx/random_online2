-- Create a table to track online users waiting for a chat
create table if not exists rooms (
  id uuid default gen_random_uuid() primary key,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users not null,
  peer_id text not null,
  status text default 'waiting' check (status in ('waiting', 'chatting')),
  constraint unique_active_user unique(user_id)
);

-- Set up Row Level Security (RLS)
alter table rooms enable row level security;

-- Allow anyone to read waiting users
create policy "Anyone can read waiting rooms"
  on rooms for select
  using (status = 'waiting');

-- Allow authenticated users to insert their own room
create policy "Users can insert their own room"
  on rooms for insert
  with check (auth.uid() = user_id);

-- Allow users to update their own room
create policy "Users can update their own room"
  on rooms for update
  using (auth.uid() = user_id);

-- Allow users to delete their own room
create policy "Users can delete their own room"
  on rooms for delete
  using (auth.uid() = user_id);

-- Realtime subscription
alter publication supabase_realtime add table rooms;
