# 🚀 CareConnect Auth Setup Checklist

Complete these steps in order to get your authentication system running.

## ✅ Step 1: Environment Setup (DONE)

- [x] `.env.local` file created with Supabase credentials
- [x] Dependencies installed (`@supabase/ssr`, `react-hook-form`, `zod`, etc.)
- [x] TypeScript configured
- [x] Build successful

## 📋 Step 2: Database Setup (YOUR TURN)

### 2.1 Access Supabase Dashboard

- [ ] Go to https://irrvfgyqhgwgtsqeuflc.supabase.co
- [ ] Login to your Supabase account
- [ ] Navigate to SQL Editor

### 2.2 Run Migrations

- [ ] Open `supabase/migrations/001_initial_schema.sql`
- [ ] Copy entire contents
- [ ] Paste into Supabase SQL Editor
- [ ] Click "Run" to execute
- [ ] Verify success (should create 7 tables)

- [ ] Open `supabase/migrations/002_rls_policies.sql`
- [ ] Copy entire contents
- [ ] Paste into Supabase SQL Editor
- [ ] Click "Run" to execute
- [ ] Verify success (RLS policies enabled)

### 2.3 Verify Database Structure

- [ ] Go to Database → Tables
- [ ] Confirm these tables exist:
  - profiles
  - referrals
  - appointments
  - screening_results
  - messages
  - sessions
  - audit_logs

### 2.4 Check RLS Policies

- [ ] Go to Database → Tables → profiles
- [ ] Click "Policies" tab
- [ ] Should see 4 policies
- [ ] Repeat for other tables

## 🧪 Step 3: Test Authentication (YOUR TURN)

### 3.1 Start Development Server

```bash
cd /home/jetrossneri/Projects/CareConnect/frontend
npm run dev
```

### 3.2 Test Registration

- [ ] Open http://localhost:3000
- [ ] Should redirect to `/login`
- [ ] Click "Register here"
- [ ] Fill out form:
  - Full Name: Test Student
  - Email: test.student@carsu.edu.ph
  - School ID: 2024-1234
  - Role: Student
  - Password: Test1234 (meets requirements)
  - Confirm Password: Test1234
- [ ] Click "Create Account"
- [ ] Should redirect to `/dashboard`
- [ ] Verify profile info displayed

### 3.3 Test Logout

- [ ] Click "Logout" button in dashboard
- [ ] Should redirect to `/login`
- [ ] Try accessing `/dashboard` directly
- [ ] Should redirect back to `/login`

### 3.4 Test Login

- [ ] Go to `/login`
- [ ] Enter email: test.student@carsu.edu.ph
- [ ] Enter password: Test1234
- [ ] Click "Sign In"
- [ ] Should redirect to `/dashboard`

### 3.5 Register PSG Member

- [ ] Logout if logged in
- [ ] Go to `/register`
- [ ] Fill form with:
  - Full Name: Test PSG
  - Email: test.psg@carsu.edu.ph
  - School ID: 2024-5678
  - Role: PSG Member
  - Password: Test1234
- [ ] Should see different dashboard features

### 3.6 Test Email Validation

- [ ] Try registering with: test@gmail.com
- [ ] Should show error: "Must use a Caraga State University email"

### 3.7 Test Password Requirements

- [ ] Try password: "test" (too short)
- [ ] Should show validation errors
- [ ] Try password: "testtest" (no uppercase/number)
- [ ] Should show validation errors

## 🔍 Step 4: Verify Supabase Integration (YOUR TURN)

### 4.1 Check Auth Users

- [ ] Go to Supabase Dashboard → Authentication → Users
- [ ] Should see 2 users (student + PSG member)
- [ ] Verify emails are correct

### 4.2 Check Profiles Table

- [ ] Go to Database → Table Editor → profiles
- [ ] Should see 2 rows
- [ ] Verify roles are correct (student, psg_member)
- [ ] Check school IDs are present

### 4.3 Test RLS Policies

- [ ] Go to SQL Editor
- [ ] Run this query:

```sql
-- Login as student
SELECT auth.uid(); -- Note the ID

-- Try to see all profiles (should fail)
SELECT * FROM profiles;

-- Should only see own profile
SELECT * FROM profiles WHERE id = auth.uid();
```

## 🐛 Step 5: Troubleshooting (IF NEEDED)

### Database Not Working?

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';

-- Check RLS status
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

### Login Not Working?

- [ ] Check Supabase logs (Dashboard → Logs)
- [ ] Verify user exists in Auth → Users
- [ ] Check browser console for errors
- [ ] Verify `.env.local` values are correct

### Build Errors?

```bash
# Clear and rebuild
rm -rf .next
npm run build
```

### RLS Blocking Everything?

```sql
-- Temporarily disable RLS for debugging (NOT FOR PRODUCTION!)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Re-enable when done testing
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

## ✅ Step 6: Confirm Everything Works

- [ ] Can register new users
- [ ] Can login with credentials
- [ ] Can logout
- [ ] Dashboard loads correctly
- [ ] Protected routes redirect properly
- [ ] Email validation works
- [ ] Password validation works
- [ ] Roles save correctly
- [ ] RLS policies working
- [ ] No console errors

## 🎉 Step 7: Move to Priority 2

Once all checkboxes are complete:

- [ ] Read `PRIORITY_1_COMPLETE.md`
- [ ] Review `QUICK_REFERENCE.md` for code patterns
- [ ] Start implementing Mental Health Screening
- [ ] Reference `SETUP_AUTH.md` as needed

## 📝 Notes Space

Use this space for any issues or observations:

```
Issue: ___________________________
Solution: _________________________

Issue: ___________________________
Solution: _________________________
```

## 🆘 Need Help?

1. Check `SETUP_AUTH.md` for detailed explanations
2. Review `QUICK_REFERENCE.md` for code examples
3. Look at Supabase logs for error messages
4. Check browser console for client errors
5. Verify environment variables are loaded

---

**Current Status**: [ ] Not Started / [ ] In Progress / [ ] Complete

**Last Updated**: ****\_\_\_****  
**Tested By**: ****\_\_\_****
