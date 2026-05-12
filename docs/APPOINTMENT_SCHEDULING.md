# Appointment Scheduling System - Module Documentation

## Overview

Complete appointment scheduling system for the CareConnect PSG Referral Platform. Enables students to book appointments with PSG members based on real-time availability tracking.

## Features Implemented

### 1. Database Schema (`/database/migrations/004_appointment_scheduling.sql`)

- **psg_availability table**: Stores PSG member availability schedules
  - Columns: id, psg_member_id, day_of_week (0-6), start_time, end_time, is_active
  - Constraints: Valid time ranges, unique schedules
  - Indexes for optimal query performance
- **Enhanced appointments table**:
  - Added: duration_minutes, location_type, meeting_link
  - Added: cancellation_reason, cancelled_by, cancelled_at
- **Helper function**: `is_psg_available()`
  - Checks if PSG member is available for specific time slot
  - Validates against schedule and existing appointments
  - Prevents double-booking conflicts

### 2. TypeScript Types (`/src/types/appointments.ts`)

- `PSGAvailability` - Availability schedule interface
- `Appointment` - Appointment details
- `AppointmentWithProfiles` - Joined data with student and PSG profiles
- `AvailableTimeSlot` - Available booking slots for display
- Status helpers: `APPOINTMENT_STATUS_LABELS`, `APPOINTMENT_STATUS_COLORS`
- Day name mapping: `DAY_NAMES`

### 3. Server Actions

#### `/src/actions/appointments.ts`

- `createAppointment()` - Book new appointment with availability checking
- `getStudentAppointments()` - Fetch student's appointments
- `getPSGAppointments()` - Fetch PSG member's appointments
- `getAppointmentById()` - Get detailed appointment info
- `updateAppointment()` - Generic update function
- `cancelAppointment()` - Cancel with reason tracking
- `confirmAppointment()` - PSG member confirms booking
- `completeAppointment()` - Mark as completed with notes
- `markNoShow()` - Mark student as no-show
- `checkPSGAvailability()` - Validate time slot availability

#### `/src/actions/psg-availability.ts`

- `createPSGAvailability()` - Add availability schedule
- `getPSGAvailability()` - Get PSG member's schedule
- `getAllActivePSGAvailability()` - List all active availabilities
- `updatePSGAvailability()` - Modify schedule
- `deletePSGAvailability()` - Remove schedule
- `togglePSGAvailability()` - Enable/disable schedule
- `getAvailableTimeSlots()` - Generate bookable slots for date range
- `getAvailablePSGMembers()` - Find available PSG for specific time

### 4. UI Pages

#### `/dashboard/psg/availability` (PSG Member)

**Purpose**: Manage availability schedule

**Features**:

- Add new availability slots (day of week + time range)
- Edit existing schedules
- Delete schedules
- Active/inactive status indicators
- Form validation (end time > start time)

**Access**: PSG members only

#### `/dashboard/appointments/book` (Student)

**Purpose**: Book appointments with PSG members

**Features**:

- Date range selection (default: today + 7 days)
- Available time slots grouped by date
- PSG member information displayed
- Visual slot selection
- Booking summary sidebar
- Optional notes field
- Real-time availability checking

**Flow**:

1. Select date range → Search slots
2. Browse available time slots by date
3. Select preferred slot + PSG member
4. Add optional notes
5. Confirm booking

**Access**: Students only

#### `/dashboard/appointments` (Student)

**Purpose**: View and manage appointments

**Features**:

- Filter tabs: All / Upcoming / Past
- Appointment cards with:
  - PSG member name
  - Date, time, duration
  - Location type (online/in-person)
  - Status badge
  - Notes display
  - Cancellation reason (if cancelled)
- "View Details" button
- "Book New Appointment" CTA

**Access**: Students only

#### `/dashboard/appointments/[id]` (Student)

**Purpose**: Detailed appointment view with actions

**Features**:

- Full appointment information:
  - PSG member profile with avatar
  - Date, time, duration
  - Location type
  - Meeting link (if online)
  - Notes
  - Cancellation details (if applicable)
- Status badge
- Cancel appointment action:
  - Modal dialog
  - Required cancellation reason
  - Confirmation flow
- "Back to Appointments" navigation

**Permissions**:

- Can cancel: Scheduled/Confirmed appointments before appointment date
- Cannot cancel: Past, completed, or already cancelled appointments

**Access**: Students only

## Database Security (RLS Policies)

### psg_availability

- ✅ PSG members: Full CRUD on their own schedules
- ✅ Students: View active availability only
- ✅ Admins: Full access to all

### appointments

- ✅ Students: Create appointments for themselves, view/update own appointments
- ✅ PSG members: View/update assigned appointments
- ✅ Admins: Full access

## Appointment Status Flow

```
scheduled → confirmed → completed
    ↓           ↓
cancelled   cancelled
    ↓           ↓
no_show     no_show
```

- **scheduled**: Initial booking status
- **confirmed**: PSG member confirms (future feature)
- **completed**: Session finished successfully
- **cancelled**: Cancelled by student or PSG (with reason)
- **no_show**: Student didn't attend

## Future Enhancements (Not Implemented)

### PSG Member Views

- [ ] `/dashboard/psg/appointments` - PSG appointment list
- [ ] `/dashboard/psg/appointments/[id]` - Confirm/complete/no-show actions
- [ ] Bulk availability setting (e.g., "Set Mon-Fri 9-5")

### Notifications

- [ ] Email confirmation on booking
- [ ] Reminder emails (24h, 1h before)
- [ ] Cancellation notifications
- [ ] SMS notifications (optional)

### Advanced Features

- [ ] Recurring appointments
- [ ] Appointment rescheduling
- [ ] Waiting list for fully booked slots
- [ ] Calendar integration (Google Calendar, Outlook)
- [ ] Video call integration (Zoom, Google Meet)
- [ ] Session feedback and ratings
- [ ] Appointment history export (PDF)

### Analytics

- [ ] PSG member utilization rates
- [ ] Peak booking times
- [ ] Cancellation rate tracking
- [ ] No-show statistics

## API Usage Examples

### Book an Appointment

```typescript
const result = await createAppointment({
  student_id: userId,
  psg_member_id: "psg-uuid",
  appointment_date: "2024-03-15T14:00:00Z",
  duration_minutes: 60,
  location_type: "online",
  notes: "Feeling anxious about exams",
});

if (result.success) {
  // Appointment booked!
}
```

### Create PSG Availability

```typescript
const result = await createPSGAvailability({
  psg_member_id: userId,
  day_of_week: 1, // Monday
  start_time: "09:00:00",
  end_time: "17:00:00",
  is_active: true,
});
```

### Check Availability

```typescript
const result = await checkPSGAvailability({
  psg_member_id: "psg-uuid",
  appointment_date: "2024-03-15T14:00:00Z",
  duration_minutes: 60,
});

if (result.isAvailable) {
  // Slot is available for booking
}
```

## Performance Considerations

### Indexes

- All foreign keys indexed
- day_of_week indexed for fast availability lookups
- appointment_date indexed for date range queries
- status indexed for filtering

### Optimization

- Server-side availability calculation reduces client load
- Parallel availability checks for multiple PSG members
- Date range limited to prevent excessive slot generation
- RLS policies prevent unauthorized data access

## Testing Checklist

- [ ] PSG member can add/edit/delete availability
- [ ] Students see only active availability
- [ ] Cannot book conflicting time slots
- [ ] Cancellation requires reason
- [ ] Cannot cancel past/completed appointments
- [ ] Status badges display correctly
- [ ] Date/time formatting works across timezones
- [ ] RLS policies enforce proper access control
- [ ] is_psg_available() function prevents double-booking

## Module Status: ✅ COMPLETE

All core appointment scheduling features implemented and ready for integration testing.

**Next Steps**:

1. Run database migration: `database/migrations/004_appointment_scheduling.sql`
2. Test availability management as PSG member
3. Test appointment booking as student
4. Verify RLS policies in production
5. Add navigation links to dashboard
