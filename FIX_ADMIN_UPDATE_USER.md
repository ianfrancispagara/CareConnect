# Fix Admin User Update Error

## Problem

The "Failed to update user" error occurs because the Row Level Security (RLS) policy on the `profiles` table doesn't allow admins to update other users' profiles.

## Solution

Run the following SQL in your Supabase SQL Editor:

### Option 1: Quick Fix (Copy and paste this entire block)

```sql
-- Add policy for admins to update any profile
CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  USING (
    get_user_role(auth.uid()) = 'admin'
  );

-- Add policy for admins to delete any profile
CREATE POLICY "Admins can delete any profile"
  ON profiles FOR DELETE
  USING (
    get_user_role(auth.uid()) = 'admin'
  );
```

### Option 2: Run the migration file

Navigate to your Supabase project → SQL Editor → New Query, then paste the contents of:
`database/migrations/018_fix_admin_profile_update.sql`

## Steps to Apply

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your CareConnect project
3. Click "SQL Editor" in the left sidebar
4. Click "New Query"
5. Paste the SQL from Option 1 above
6. Click "Run" or press Ctrl+Enter
7. You should see "Success. No rows returned"

## Verify the Fix

After running the SQL, try updating a user again in the User Management page. The error should be resolved.

## What This Does

- Adds an RLS policy that allows users with the `admin` role to UPDATE any profile in the database
- Adds an RLS policy that allows users with the `admin` role to DELETE any profile in the database
- Uses the existing `get_user_role()` function to check if the current user is an admin

## Current RLS Policies (Before Fix)

The original RLS policies only allowed:

- Users to update their own profile
- PSG members and admins to VIEW all profiles
- But NO policy for admins to UPDATE other profiles ❌

## After Fix

Admins can now:

- View all profiles ✅
- Update any profile ✅
- Delete any profile ✅
