# CareConnect - Auth & Roles Setup Guide

## ✅ Completed: Priority 1 - Auth & Roles

### What's Been Implemented

1. **Supabase Configuration**

   - Client-side and server-side Supabase clients
   - Middleware for route protection
   - Environment variables setup

2. **Authentication Pages**

   - Login page with form validation
   - Registration page with role selection (Student/PSG Member)
   - Password strength indicators
   - Institutional email validation (@carsu.edu.ph)

3. **Type Safety**

   - TypeScript types for all database tables
   - Zod schemas for form validation
   - Strict type checking enabled

4. **Database Schema**

   - Complete database schema with all tables
   - Row Level Security (RLS) policies
   - Audit logging system
   - Automatic timestamp updates

5. **Security Features**
   - Role-based access control
   - Protected routes via middleware
   - Email domain validation
   - Encrypted authentication

## 🚀 Setup Instructions

### 1. Database Setup

Go to your Supabase project SQL Editor and run these migrations in order:

1. **First:** Run `supabase/migrations/001_initial_schema.sql`

   - Creates all tables and indexes
   - Sets up triggers for updated_at fields

2. **Second:** Run `supabase/migrations/002_rls_policies.sql`
   - Enables RLS on all tables
   - Creates security policies for role-based access
   - Sets up audit logging triggers

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Your `.env.local` file has been created with:

```
NEXT_PUBLIC_SUPABASE_URL=https://irrvfgyqhgwgtsqeuflc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## 📁 File Structure

```
src/
├── app/
│   ├── login/page.tsx          # Login page with form
│   ├── register/page.tsx       # Registration with role selection
│   ├── dashboard/page.tsx      # Protected dashboard
│   └── layout.tsx              # Root layout
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # Browser client
│   │   ├── server.ts           # Server client
│   │   ├── middleware.ts       # Auth middleware
│   │   └── types.ts            # Database types
│   ├── actions/
│   │   └── auth.ts             # Server actions for auth
│   └── validations/
│       └── auth.ts             # Zod schemas
└── middleware.ts               # Next.js middleware

supabase/
└── migrations/
    ├── 001_initial_schema.sql  # Database schema
    └── 002_rls_policies.sql    # Security policies
```

## 🔐 User Roles

### Student

- Can self-refer
- Book appointments
- View own screening results
- Message PSG members
- View own referrals and sessions

### PSG Member

- View assigned referrals
- Manage appointments
- Create session notes
- Message students
- Update referral status

### Admin (Future)

- Full system access
- User management
- View all audit logs
- Generate reports

## 🧪 Testing the Auth System

### Test Registration

1. Go to `/register`
2. Fill in the form with:
   - Full Name: Test User
   - Email: test.user@carsu.edu.ph
   - School ID: 2024-1234
   - Role: Student or PSG Member
   - Password: Must meet requirements (8+ chars, uppercase, lowercase, number)
3. Submit and you'll be redirected to dashboard

### Test Login

1. Go to `/login`
2. Enter registered credentials
3. Should redirect to `/dashboard`

### Test Protected Routes

- Try accessing `/dashboard` without logging in → redirects to `/login`
- Try accessing `/login` while logged in → redirects to `/dashboard`

## 📊 Database Tables Created

- **profiles** - User profiles with roles
- **referrals** - Mental health referrals
- **appointments** - Scheduled appointments
- **screening_results** - Mental health screening data
- **messages** - Real-time messaging
- **sessions** - Session notes and feedback
- **audit_logs** - System audit trail

## 🔒 Security Features

### RLS Policies

- Students can only see their own data
- PSG members see assigned cases
- Admins have full access
- All queries filtered by authentication

### Email Validation

- Must use @carsu.edu.ph domain
- Prevents unauthorized registrations
- Complies with institutional requirements

### Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

## 🎯 Next Steps (Priority 2)

After confirming auth works, proceed to:

1. **Database Setup in Supabase**

   - Run the migration SQL files
   - Test RLS policies
   - Create test users

2. **Mental Health Screening**

   - Create screening questionnaire
   - Color-coded severity (green/yellow/red)
   - Calculate risk scores

3. **Referral System**
   - Self-referral form
   - Status tracking
   - Assignment to PSG members

## ⚠️ Important Notes

- Never commit `.env.local` to version control (already in .gitignore)
- Run migrations in order (001 before 002)
- Test RLS policies after database setup
- Verify email domain validation is working

## 🐛 Troubleshooting

### "Invalid login credentials"

- Ensure user is registered in database
- Check Supabase Auth dashboard for user
- Verify email confirmation (if enabled)

### "Failed to create user profile"

- Check if profiles table exists
- Verify RLS policies allow INSERT
- Check Supabase logs for errors

### Middleware not redirecting

- Clear browser cookies
- Check middleware.ts matcher patterns
- Verify Supabase URL and key in .env.local

## 📝 Migration Commands

If you need to regenerate types from your database:

```bash
npx supabase gen types typescript --project-id irrvfgyqhgwgtsqeuflc > src/lib/supabase/types.ts
```

## 🎨 UI Components

Current pages use:

- Tailwind CSS for styling
- Lucide React for icons
- React Hook Form for forms
- Zod for validation

## 📞 Support

For issues or questions:

1. Check Supabase logs in dashboard
2. Review browser console for errors
3. Verify database tables are created
4. Test RLS policies in SQL editor
