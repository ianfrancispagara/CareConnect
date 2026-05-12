# Auth & Roles Quick Reference

## 🔑 Server-Side Auth (Server Components & Actions)

```typescript
import { getUser } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/server";

// Get current user with profile
const user = await getUser();

// Create server client
const supabase = await createClient();
```

## 🌐 Client-Side Auth (Client Components)

```typescript
"use client";

import { useAuth } from "@/hooks/useAuth";

function MyComponent() {
  const { user, profile, loading, isAuthenticated } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please login</div>;

  return <div>Hello {profile?.full_name}</div>;
}
```

## 🔐 Server Actions

```typescript
import { login, register, logout } from "@/lib/actions/auth";

// Login
const result = await login({ email, password });

// Register
const result = await register({
  email,
  password,
  confirmPassword,
  fullName,
  schoolId,
  role,
});

// Logout
await logout();
```

## ✅ Form Validation

```typescript
import { loginSchema, registerSchema } from "@/lib/validations/auth";

// Validate login data
const result = loginSchema.safeParse(data);
if (!result.success) {
  console.error(result.error.issues);
}

// Validate registration data
const result = registerSchema.safeParse(data);
```

## 🎭 Role Checking

```typescript
import {
  isStudent,
  isPSGMember,
  isAdmin,
  hasRole,
  formatRole,
} from "@/lib/utils/auth";

// Check specific role
if (isStudent(user.role)) {
  // Student-specific logic
}

// Check multiple roles
if (hasRole(user.role, ["psg_member", "admin"])) {
  // PSG or Admin logic
}

// Format role for display
const displayName = formatRole(user.role); // "PSG Member"
```

## 🛡️ Protected Routes

Routes are automatically protected by middleware:

- `/dashboard` - Requires authentication
- `/appointments` - Requires authentication
- `/referrals` - Requires authentication
- `/messages` - Requires authentication
- `/login` - Redirects to dashboard if authenticated
- `/register` - Redirects to dashboard if authenticated

## 📊 Database Queries (with RLS)

```typescript
import { createClient } from "@/lib/supabase/server";

const supabase = await createClient();

// Query respects RLS policies
const { data, error } = await supabase
  .from("profiles")
  .select("*")
  .eq("id", userId);
```

## 🔔 Real-time Subscriptions

```typescript
"use client";

import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

const channel = supabase
  .channel("messages")
  .on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "messages",
    },
    (payload) => {
      console.log("New message:", payload.new);
    }
  )
  .subscribe();

// Cleanup
return () => {
  supabase.removeChannel(channel);
};
```

## 🔍 Type Definitions

```typescript
import type {
  Profile,
  UserRole,
  ReferralStatus,
  AppointmentStatus,
  SeverityColor,
} from "@/lib/utils/auth";

// Use in component props
interface Props {
  profile: Profile;
  role: UserRole;
}
```

## 🎨 UI Components

```typescript
import { LogoutButton } from "@/components/LogoutButton";

// Use in any client component
<LogoutButton />;
```

## 🚨 Error Handling

```typescript
"use server";

export async function myAction(data: MyInput) {
  try {
    const result = await someOperation();

    if (result.error) {
      return { error: result.error.message };
    }

    return { success: true, data: result.data };
  } catch (error) {
    return { error: "An unexpected error occurred" };
  }
}
```

## 📝 Common Patterns

### Check if user is logged in (Server Component)

```typescript
const user = await getUser();
if (!user) {
  redirect("/login");
}
```

### Check user role (Server Component)

```typescript
const user = await getUser();
if (user?.role !== "admin") {
  redirect("/dashboard");
}
```

### Client-side auth check

```typescript
"use client";

const { profile, loading } = useAuth();

if (loading) return <Loader />;
if (!profile) return <LoginPrompt />;

return <ProtectedContent user={profile} />;
```

## 🗄️ Database Types

All database types are in `src/lib/supabase/types.ts`:

```typescript
import type { Database } from "@/lib/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Referral = Database["public"]["Tables"]["referrals"]["Row"];
type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
```

## ⚡ Performance Tips

1. Use Server Components by default (better performance)
2. Only use `'use client'` when you need:

   - React hooks (useState, useEffect)
   - Browser APIs
   - Event listeners
   - Real-time subscriptions

3. Cache expensive operations:

```typescript
import { unstable_cache } from "next/cache";

const getCachedUser = unstable_cache(
  async (userId: string) => {
    // Expensive operation
  },
  ["user"],
  { revalidate: 3600 }
);
```

## 🔄 Revalidation

```typescript
import { revalidatePath } from "next/cache";

// After data mutation
revalidatePath("/dashboard");
revalidatePath("/", "layout"); // Revalidate entire app
```

## 🎯 Next Steps

1. Run database migrations in Supabase
2. Test login/register flow
3. Verify RLS policies work
4. Move to Priority 2: Mental Health Screening
