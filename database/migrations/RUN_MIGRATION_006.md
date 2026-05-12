# Run Migration 006: Referral Management

## Error

```
Could not find a relationship between 'referrals' and 'profiles' in the schema cache
```

This error occurs because the `referrals` table doesn't exist yet in your Supabase database.

## Solution

### Option 1: Via Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**

   - Go to https://supabase.com/dashboard
   - Select your CareConnect project

2. **Navigate to SQL Editor**

   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the Migration**

   - Open the file: `database/migrations/006_create_referrals.sql`
   - Copy ALL the SQL code (from line 1 to the end)
   - Paste it into the SQL Editor
   - Click **Run** (or press `Ctrl + Enter`)

4. **Verify Success**

   - You should see: "Success. No rows returned"
   - Go to "Table Editor" in the left sidebar
   - You should now see 3 new tables:
     - ✅ `referrals`
     - ✅ `referral_assessments`
     - ✅ `referral_updates`

5. **Refresh Your App**
   - Go back to `localhost:3000/dashboard/psg/referrals`
   - Refresh the page
   - The error should be gone!

### Option 2: Via Supabase CLI (If installed)

```bash
cd /home/jetrossneri/Projects/CareConnect/frontend
supabase db push
```

## What This Migration Creates

### Tables

1. **referrals** - Main referral tracking table

   - Links students to PSG members
   - Tracks referral status (pending → reviewed → assigned → in_progress → completed/escalated)
   - Stores reason, notes, severity

2. **referral_assessments** - Structured risk assessments

   - PSG member assessments of student cases
   - Risk levels, intervention plans, safety concerns

3. **referral_updates** - Audit trail
   - All status changes, notes, and progress updates
   - Complete history of case management

### RLS Policies

- Students can only view/create their own referrals
- PSG members can view/manage all referrals
- All actions are tracked for compliance

### Indexes

- Performance optimization for queries by student, PSG member, status, and date

## Troubleshooting

### If you get "relation already exists" errors:

Run the rollback first:

```sql
-- Copy from database/migrations/006_rollback.sql
DROP TABLE IF EXISTS referral_updates CASCADE;
DROP TABLE IF EXISTS referral_assessments CASCADE;
DROP TABLE IF EXISTS referrals CASCADE;
DROP FUNCTION IF EXISTS update_referral_timestamp() CASCADE;
```

Then run the migration again.

### If you get foreign key errors:

Make sure these tables exist first:

- ✅ `profiles` (from migration 001)
- ✅ `screening_results` (from migration 002)

## After Migration

The PSG Referrals page will work correctly and show:

- Summary cards with counts
- Filter tabs for different statuses
- Empty state: "No referrals found"

Students can then submit referrals via:

- Self-referral form: `/dashboard/referrals/create`
- Automatic referral after high-severity screening
