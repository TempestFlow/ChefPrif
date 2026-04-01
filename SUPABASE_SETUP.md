# Supabase Setup Guide

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be fully initialized

## 2. Database Setup

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the SQL script from `database/schema.sql` to create the `saved_recipes` table

## 3. Environment Variables

Add these environment variables to your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

You can find these values in your Supabase project settings under "API".

## 4. Install Dependencies

```bash
npm install @supabase/supabase-js
```

## 5. Authentication (Future Enhancement)

Currently, the system uses a demo user ID. For production, implement proper authentication:

1. Set up Supabase Auth
2. Update the API route to use `auth.uid()` instead of the demo user ID
3. Update the RLS policies to use proper user authentication

## Database Schema

The `saved_recipes` table includes:
- `id`: Primary key
- `user_id`: User identifier (currently demo-user)
- `title`: Recipe title
- `ingredients`: JSONB array of ingredients
- `steps`: JSONB array of cooking steps
- `calories`: Estimated calories per serving
- `servings`: Number of servings
- `missing_ingredients`: JSONB array of missing ingredients
- `created_at`: Timestamp

Unique constraint on `(user_id, title)` prevents duplicates.