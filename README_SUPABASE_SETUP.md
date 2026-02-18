# Supabase Setup Guide

## Database Schema Setup

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Wait for the project to be fully provisioned

2. **Run the Database Schema**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Copy and paste the contents of `supabase/schema.sql`
   - Execute the SQL script

3. **Set Up Storage for Avatars**
   - In the SQL Editor, copy and paste the contents of `supabase/storage.sql`
   - Execute the SQL script to create the avatars bucket and policies
   - This will create a public storage bucket for user avatars with proper security policies

4. **Configure Environment Variables**
   - Copy `.env.example` to `.env.local`
   - Fill in your Supabase credentials:
     - `NEXT_PUBLIC_SUPABASE_URL`: Found in Project Settings > API
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Found in Project Settings > API

5. **Enable Email Authentication**
   - Go to Authentication > Settings in Supabase dashboard
   - Enable Email provider
   - Configure email templates if needed

## User Roles

The platform supports three main user roles:

1. **Requester** - Users who request data collection
2. **Collector** - Users who collect data and earn money
3. **Agent** - Users who validate and verify collected data

## Database Tables

The schema includes:
- `profiles` - User profile information (includes avatar_url field)
- `requests` - Data collection requests
- `submissions` - Collected data submissions
- `data_items` - Individual files/media
- `transactions` - Payment records
- `validations` - Quality validation records

All tables have Row Level Security (RLS) enabled for security.

## Storage Buckets

The storage setup includes:
- `avatars` - Public bucket for user profile pictures with RLS policies ensuring users can only manage their own avatars
