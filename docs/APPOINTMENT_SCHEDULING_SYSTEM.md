# Appointment Scheduling System

## Overview

The Appointment Scheduling System enables students to book counseling sessions with PSG (Peer Support Group) members based on their availability. The system includes real-time availability tracking, automated conflict detection, and a complete appointment lifecycle management from booking to completion.

## Features

### For Students

- 🔍 Search available time slots by date range
- 📅 Book appointments with PSG members
- 📝 Add optional notes to appointments
- 👀 View all appointments (upcoming, past, all)
- ✅ View appointment details
- ❌ Cancel appointments with reason

### For PSG Members

- 🕐 Set weekly availability schedules
- 📊 View all scheduled appointments
- ✔️ Confirm pending appointments
- 👥 View student information
- ❌ Cancel appointments when needed
- 📋 Filter appointments (pending, upcoming, past, all)

### System Features

- ⚡ Real-time availability checking
- 🚫 Automated conflict detection
- 🔒 Row-level security policies
- 🎨 Dark/Light mode support
- 📱 Responsive design
- ♿ Accessibility compliant

## Architecture

### Database Schema

#### `psg_availability` Table

```sql
- id: UUID (Primary Key)
- psg_member_id: UUID (Foreign Key → profiles.id)
- day_of_week: INTEGER (0-6, 0=Sunday)
- start_time: TIME
- end_time: TIME
- is_active: BOOLEAN
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

**Constraints:**

- `valid_time_range`: end_time > start_time
- `unique_psg_schedule`: Unique combination of psg_member_id, day_of_week, start_time, end_time

#### Enhanced `appointments` Table

**New Columns:**

```sql
- duration_minutes: INTEGER (Default: 60)
- location_type: TEXT ('online' | 'in_person')
- meeting_link: TEXT (Optional)
- cancellation_reason: TEXT (Optional)
- cancelled_by: UUID (Foreign Key → profiles.id)
- cancelled_at: TIMESTAMP (Optional)
```

### Server Actions

#### Appointment Actions (`/actions/appointments.ts`)

**1. createAppointment(input: CreateAppointmentInput)**

- Creates a new appointment
- Validates PSG availability using `is_psg_available()` function
- Checks for scheduling conflicts
- Returns: `{ success: boolean, data?: Appointment, error?: string }`

**2. getStudentAppointments(studentId: string)**

- Fetches all appointments for a student
- Includes PSG member profile data
- Ordered by appointment_date (ascending)
- Returns: `{ success: boolean, data?: AppointmentWithProfiles[], error?: string }`

**3. getPSGAppointments(psgMemberId: string)**

- Fetches all appointments for a PSG member
- Includes student profile data
- Ordered by appointment_date (ascending)
- Returns: `{ success: boolean, data?: AppointmentWithProfiles[], error?: string }`

**4. getAppointmentById(id: string)**

- Fetches single appointment details
- Includes both student and PSG member profiles
- Returns: `{ success: boolean, data?: AppointmentWithProfiles, error?: string }`

**5. cancelAppointment(id: string, reason: string)**

- Cancels an appointment
- Records cancellation reason and timestamp
- Sets status to 'cancelled'
- Returns: `{ success: boolean, data?: Appointment, error?: string }`

**6. confirmAppointment(id: string)**

- Confirms a scheduled appointment
- Changes status from 'scheduled' to 'confirmed'
- Only PSG members can confirm
- Returns: `{ success: boolean, data?: Appointment, error?: string }`

#### PSG Availability Actions (`/actions/psg-availability.ts`)

**1. createPSGAvailability(input: CreatePSGAvailabilityInput)**

- Creates new availability slot
- Validates time range
- Returns: `{ success: boolean, data?: PSGAvailability, error?: string }`

**2. getPSGAvailability(psgMemberId: string)**

- Fetches all availability slots for PSG member
- Ordered by day_of_week, start_time
- Returns: `{ success: boolean, data?: PSGAvailability[], error?: string }`

**3. updatePSGAvailability(id: string, updates: UpdatePSGAvailabilityInput)**

- Updates existing availability slot
- Can update day, time range, or active status
- Returns: `{ success: boolean, data?: PSGAvailability, error?: string }`

**4. deletePSGAvailability(id: string)**

- Permanently deletes availability slot
- Returns: `{ success: boolean, error?: string }`

**5. getAvailableTimeSlots(startDate: string, endDate: string, durationMinutes: number)**

- Searches for available time slots within date range
- Returns PSG member info with each slot
- Checks for conflicts automatically
- Returns: `{ success: boolean, data?: AvailableTimeSlot[], error?: string }`

### Database Functions

#### `is_psg_available(p_psg_member_id, p_appointment_date, p_duration_minutes)`

**Purpose:** Check if PSG member is available for appointment

**Logic:**

1. Extracts day of week and time from appointment_date
2. Checks if PSG has availability slot for that day/time
3. Checks for conflicting appointments
4. Returns: BOOLEAN

**Usage:**

```sql
SELECT is_psg_available(
  'psg-member-uuid',
  '2025-11-15 10:00:00',
  60
);
```

## Pages & Routes

### Student Routes

#### `/dashboard/appointments`

**Purpose:** View all student appointments

**Features:**

- List all appointments with PSG member info
- Filter by: All / Upcoming / Past
- Status badges (scheduled, confirmed, completed, cancelled)
- Quick view: Date, time, duration, location
- Link to book new appointment
- View details button for each appointment

**Components Used:**

- DashboardNavbar
- Loader
- Link (Next.js)

#### `/dashboard/appointments/book`

**Purpose:** Search and book appointments

**Features:**

- Date range selector (start date → end date)
- Search available time slots
- Display slots grouped by date
- PSG member name for each slot
- Selected slot highlighting
- Optional notes field
- Booking summary sidebar
- Instant booking confirmation

**Flow:**

1. Student selects date range
2. System searches available slots
3. Student selects slot and adds notes
4. System validates availability
5. Appointment created with 'scheduled' status
6. Student redirected to appointments list

#### `/dashboard/appointments/[id]`

**Purpose:** View appointment details

**Features:**

- Full appointment information
- PSG member profile
- Date, time, duration, location
- Meeting link (if online)
- Student notes
- Cancel button (if future & not completed)
- Cancellation details (if cancelled)

### PSG Member Routes

#### `/dashboard/psg/availability`

**Purpose:** Manage weekly availability

**Features:**

- View all availability slots
- Add new availability (day, start time, end time)
- Edit existing slots
- Delete slots
- Toggle active/inactive status
- Day name display (Monday-Sunday)
- Time validation

**Form Fields:**

- Day of Week (dropdown)
- Start Time (time picker)
- End Time (time picker)

**Validations:**

- End time must be after start time
- No duplicate time slots

#### `/dashboard/psg/appointments`

**Purpose:** View and manage assigned appointments

**Features:**

- List all appointments with student info
- Filter by: Pending / Upcoming / Past / All
- Pending count badge
- Status badges (color-coded)
- Student name and ID
- Date, time, duration, location
- Student notes visible
- Confirm button (for scheduled appointments)
- View details button
- Link to manage availability

**Filter Behavior:**

- **Pending**: status = 'scheduled' (awaiting confirmation)
- **Upcoming**: Future dates + (confirmed OR scheduled)
- **Past**: Past dates OR completed OR cancelled
- **All**: No filter

#### `/dashboard/psg/appointments/[id]`

**Purpose:** View appointment details and manage

**Features:**

- Student information display
- Full appointment details
- Student notes section
- Confirm appointment button (if scheduled)
- Cancel appointment button (if not completed)
- Cancellation dialog with reason field
- Back to appointments link

**Actions Available:**

- Confirm (changes status: scheduled → confirmed)
- Cancel (with required reason)

### Dashboard Cards

#### Student Dashboard

**"Book Appointment"** card → `/dashboard/appointments/book`

#### PSG Dashboard

1. **"My Appointments"** card → `/dashboard/psg/appointments`
   - View and confirm scheduled sessions
   - Active status (blue/info theme)
2. **"Manage Availability"** card → `/dashboard/psg/availability`
   - Set weekly schedule
   - Active status

## TypeScript Types

### Core Types (`/types/appointments.ts`)

```typescript
// Day of Week: 0 = Sunday, 6 = Saturday
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

// Appointment Status
export type AppointmentStatus =
  | "scheduled" // Created, awaiting PSG confirmation
  | "confirmed" // PSG confirmed the appointment
  | "completed" // Session completed
  | "cancelled" // Cancelled by student or PSG
  | "no_show"; // Student didn't attend

// Location Type
export type LocationType = "online" | "in_person";

// PSG Availability
export interface PSGAvailability {
  id: string;
  psg_member_id: string;
  day_of_week: DayOfWeek;
  start_time: string; // Format: "HH:MM:SS"
  end_time: string; // Format: "HH:MM:SS"
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Appointment
export interface Appointment {
  id: string;
  student_id: string;
  psg_member_id: string;
  appointment_date: string; // ISO 8601 timestamp
  status: AppointmentStatus;
  duration_minutes: number;
  location_type: LocationType;
  meeting_link?: string;
  notes?: string;
  cancellation_reason?: string;
  cancelled_by?: string;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
}

// With Profile Data (for display)
export interface AppointmentWithProfiles extends Appointment {
  student: {
    id: string;
    full_name: string;
    school_id?: string;
    avatar_url?: string;
  };
  psg_member: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

// Available Time Slot (for booking)
export interface AvailableTimeSlot {
  psg_member_id: string;
  psg_member_name: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  duration_minutes: number;
}
```

## Security (RLS Policies)

### PSG Availability Policies

**Students:**

- ✅ SELECT: View active availability only
- ❌ INSERT/UPDATE/DELETE: Not allowed

**PSG Members:**

- ✅ SELECT: View own availability
- ✅ INSERT: Create own availability (verified by role check)
- ✅ UPDATE: Update own availability
- ✅ DELETE: Delete own availability

**Admins:**

- ✅ ALL: Full access to all availability

### Appointment Policies

**Students:**

- ✅ SELECT: View own appointments
- ✅ INSERT: Create appointments for themselves only
- ✅ UPDATE: Update own appointments (for cancellation)
- ❌ DELETE: Not allowed

**PSG Members:**

- ✅ SELECT: View assigned appointments
- ✅ UPDATE: Update assigned appointments (for confirmation)
- ❌ INSERT: Cannot create appointments
- ❌ DELETE: Not allowed

**Admins:**

- ✅ ALL: Full access to all appointments

## Status Flow

### Appointment Lifecycle

```
┌─────────────┐
│   STUDENT   │
│ Books Appt  │
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│ SCHEDULED   │────▶│  CONFIRMED   │────▶│  COMPLETED  │
└─────────────┘     └──────────────┘     └─────────────┘
       │                    │
       │                    │
       ▼                    ▼
┌─────────────┐     ┌──────────────┐
│  CANCELLED  │     │   NO_SHOW    │
└─────────────┘     └──────────────┘
```

**Status Descriptions:**

- **scheduled**: Default status when student books
- **confirmed**: PSG member confirms the appointment
- **completed**: Session finished successfully
- **cancelled**: Either party cancels (with reason)
- **no_show**: Student didn't attend (PSG marks)

## UI Components

### Loader Component (`/components/Loader.tsx`)

**Purpose:** Consistent loading states across all pages

**Props:**

```typescript
{
  size?: number;        // Icon size (default: 48)
  text?: string;        // Loading message (default: "Loading...")
  fullScreen?: boolean; // Full-screen mode (default: false)
}
```

**Usage:**

```tsx
// Full-screen loader
<Loader fullScreen text="Loading appointments..." />

// Inline loader
<div className="py-8">
  <Loader text="Loading slots..." />
</div>
```

### Status Badges

**Color Coding:**

- **Scheduled** (Yellow/Warning): Awaiting confirmation
- **Confirmed** (Blue/Info): PSG confirmed
- **Completed** (Green/Success): Session done
- **Cancelled** (Red/Error): Appointment cancelled
- **No Show** (Red/Error): Student didn't attend

## CSS Variables

### Theme Variables (`globals.css`)

**Dark Theme:**

```css
--success-bg: hsl(146 17% 20%);
--error-bg: hsl(9 26% 20%);
--warning-bg: hsl(52 19% 20%);
--info-bg: hsl(217 28% 20%);
--bg-secondary: hsl(300 0% 14%);
--primary-20: hsl(111 33% 20%);
```

**Light Theme:**

```css
--success-bg: hsl(146 50% 90%);
--error-bg: hsl(9 70% 90%);
--warning-bg: hsl(52 90% 90%);
--info-bg: hsl(217 70% 90%);
--bg-secondary: hsl(0 0% 95%);
--primary-20: hsl(111 33% 90%);
```

## Performance

### Optimization Strategies

1. **Database Indexes:**

   - `idx_psg_availability_member` on psg_member_id
   - `idx_psg_availability_day` on day_of_week
   - `idx_appointments_student` on student_id
   - `idx_appointments_psg` on psg_member_id
   - `idx_appointments_date` on appointment_date
   - `idx_appointments_status` on status

2. **Query Optimization:**

   - Profile data joined in single query
   - Results ordered at database level
   - Filtered by user ID using RLS

3. **Real-time Validation:**
   - `is_psg_available()` function runs in database
   - Single query checks both availability and conflicts
   - Returns boolean immediately

### Performance Targets

- ✅ Dashboard load: < 3 seconds
- ✅ Appointment booking: < 5 seconds
- ✅ Availability search: < 5 seconds
- ✅ Confirmation action: < 2 seconds

## Testing Checklist

### Student Flow

- [ ] Book appointment with available PSG member
- [ ] Search slots by date range
- [ ] View appointment details
- [ ] Cancel appointment with reason
- [ ] Filter appointments (all/upcoming/past)
- [ ] Verify cannot book conflicting slots
- [ ] Verify cannot book outside PSG availability

### PSG Member Flow

- [ ] Create weekly availability schedule
- [ ] Edit existing availability
- [ ] Delete availability slot
- [ ] View all assigned appointments
- [ ] Confirm scheduled appointment
- [ ] Cancel appointment with reason
- [ ] Filter appointments (pending/upcoming/past/all)
- [ ] Verify pending count badge updates

### System Validation

- [ ] RLS policies prevent unauthorized access
- [ ] Conflict detection works correctly
- [ ] Status transitions follow lifecycle
- [ ] Dark/light mode switches properly
- [ ] Mobile responsive on all pages
- [ ] Loading states display correctly
- [ ] Error messages are user-friendly

## Common Issues & Solutions

### Issue: "Time slot not available"

**Cause:** Either PSG has no availability or there's a conflict
**Solution:**

- Check PSG availability schedule
- Verify no overlapping appointments exist
- Try different time slot

### Issue: "Failed to check availability"

**Cause:** Database function error
**Solution:**

- Verify `is_psg_available()` function exists
- Check database connection
- Review server logs

### Issue: Appointments not showing

**Cause:** RLS policy or incorrect user ID
**Solution:**

- Verify user is authenticated
- Check user role matches route (student vs PSG)
- Confirm RLS policies are enabled

### Issue: Cannot confirm appointment

**Cause:** User not PSG member or wrong status
**Solution:**

- Verify logged-in user is PSG member
- Check appointment status is 'scheduled'
- Verify appointment is assigned to this PSG member

## Future Enhancements

### Priority 2 (Planned)

- [ ] Email/push notifications for new appointments
- [ ] Automatic meeting link generation
- [ ] Appointment reminder system (24h, 1h before)
- [ ] Session completion workflow with notes
- [ ] Reschedule appointment feature
- [ ] Recurring appointments
- [ ] PSG member calendar view
- [ ] Export appointments to calendar (iCal)

### Priority 3 (Nice to Have)

- [ ] Video call integration
- [ ] Session feedback forms
- [ ] Appointment analytics dashboard
- [ ] Student appointment history
- [ ] PSG member availability templates
- [ ] Bulk appointment operations
- [ ] SMS reminders
- [ ] Appointment waiting list

## Migration Files

### Database Migration

**File:** `/database/migrations/004_appointment_scheduling.sql`

**Contents:**

1. Create `psg_availability` table
2. Add columns to `appointments` table
3. Create indexes
4. Set up RLS policies
5. Create `is_psg_available()` function
6. Add update triggers

**To Apply:**

```bash
# Using Supabase CLI
supabase db push

# Or run SQL directly in Supabase Dashboard
```

## Dependencies

- **Next.js 14+**: App router, server actions
- **React 18+**: Client components
- **TypeScript**: Strict mode
- **Supabase**: Database, auth, RLS
- **Lucide React**: Icons (Calendar, Clock, User, etc.)
- **Tailwind CSS**: Styling utilities
- **React Hook Form**: Form handling (future)
- **Zod**: Schema validation (future)

## Support

For issues or questions:

1. Check this documentation
2. Review database logs in Supabase
3. Check browser console for client errors
4. Verify RLS policies are correct
5. Contact development team

## Changelog

### v1.0.0 (2025-11-10)

- ✅ Initial release
- ✅ Complete appointment lifecycle
- ✅ PSG availability management
- ✅ Student booking system
- ✅ Confirmation workflow
- ✅ Dark/light mode support
- ✅ Mobile responsive design
- ✅ Comprehensive documentation

---

**Last Updated:** November 10, 2025  
**Module Status:** ✅ Complete  
**Maintained By:** CareConnect Development Team
