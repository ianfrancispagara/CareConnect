# Fix Admin Referrals Access - RLS Policy Update

## Problem

Admin users cannot see referrals because the RLS (Row Level Security) policies only allow `psg_member` role to view referrals, but not `admin` role.

## Solution

Run the SQL migration to update RLS policies to include admin access.

## Steps to Fix

1. Open your Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to your project: **CareConnect**
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy and paste the contents of: `database/migrations/019_add_admin_referrals_rls.sql`
6. Click **Run** button
7. Refresh your application page

## What This Does

The migration will:

- Drop the old RLS policies that only allowed `psg_member`
- Create new RLS policies that allow both `psg_member` AND `admin` roles to:
  - View all referrals
  - Update referrals
  - View and create referral assessments
  - View and create referral updates

## Verification

After running the migration:

1. Refresh the referrals page in your app
2. You should now see all 7 referrals from the database
3. Check the console - you should see `Referrals data: Array(7)` instead of `Array(0)`

## File Location

`/home/jetrossneri/Projects/CareConnect/frontend/database/migrations/019_add_admin_referrals_rls.sql`
