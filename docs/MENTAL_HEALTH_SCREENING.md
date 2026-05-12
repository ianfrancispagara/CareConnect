# Mental Health Screening Module

Comprehensive mental health screening system for CareConnect PSG Referral System.

## Overview

The Mental Health Screening Module enables:

- **Students**: Take mental health screenings with PHQ-9 based questions
- **PSG Members**: Review screenings, assess severity, and initiate case assessments
- **Admins**: Manage custom questions and oversee all assessments

## Features

### 1. Student Screening Flow

- Multi-step questionnaire with progress tracking
- 10 preset PHQ-9 based mental health questions
- Multiple question types: scale (1-10), yes/no, text, multiple choice
- Automatic severity calculation with color-coding:
  - 🟢 **Green (Low)**: < 40% score
  - 🟡 **Yellow (Moderate)**: 40-69% score
  - 🔴 **Red (High)**: ≥ 70% score or immediate attention flagged
- Immediate attention detection for critical responses
- Personalized recommendations based on severity
- Support resources and next steps guidance

### 2. PSG Member Review Interface

- Dashboard with filterable screening results
- Summary cards: Pending Reviews, High Risk Cases, Total Reviewed
- Smart sorting: unreviewed → severity → date
- Detailed screening view with:
  - Individual question responses and scores
  - Review notes capability
  - Mark as reviewed functionality
  - Start case assessment button

### 3. Case Assessment System

- Real-time chat between student and PSG member (TODO)
- Track assessment status: pending → in_progress → completed/escalated
- Session documentation and notes
- Follow-up question capability

## Database Schema

### Tables (5)

1. **screening_questions**

   - Stores preset and custom screening questions
   - Fields: question_text, question_type, options, weight, is_preset, order

2. **screening_results**

   - Main screening results with severity assessment
   - Fields: student_id, total_score, severity_level, color_code, requires_immediate_attention, reviewed_by, reviewed_at

3. **screening_responses**

   - Individual answers to screening questions
   - Fields: screening_result_id, question_id, answer, score

4. **case_assessments**

   - Tracks ongoing case assessments
   - Fields: screening_result_id, student_id, psg_member_id, status, notes

5. **assessment_messages**
   - Chat messages between student and PSG member
   - Fields: case_assessment_id, sender_id, sender_role, message, is_question

### RLS Policies

- Students: Can only view/create own screenings and responses
- PSG Members: Can view all screenings, update reviews, manage case assessments
- Admins: Full access to all data

## File Structure

```
src/
├── lib/
│   ├── validations/
│   │   └── screening.ts          # Zod schemas, preset questions, severity calculation
│   ├── types/
│   │   └── screening.ts          # TypeScript types and SQL schema
│   └── actions/
│       └── screening.ts          # Server actions for CRUD operations
├── components/
│   └── screening/
│       ├── ScreeningForm.tsx     # Multi-step questionnaire component
│       └── ScreeningResultDisplay.tsx # Color-coded results display
└── app/
    └── dashboard/
        ├── screening/
        │   ├── take/page.tsx     # Student: Take screening
        │   └── results/page.tsx  # Student: View results
        └── psg/
            └── screenings/
                ├── page.tsx       # PSG: Screening list
                └── [id]/page.tsx  # PSG: Screening detail
```

## Setup Instructions

### 1. Database Setup

Execute the SQL migration in Supabase SQL Editor:

```sql
-- Run: database/migrations/002_mental_health_screening.sql
```

This will:

- Create 5 tables with indexes
- Enable RLS policies for all tables
- Insert 10 preset PHQ-9 questions
- Set up triggers for updated_at timestamps

### 2. Environment Variables

Ensure Supabase credentials are configured in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Install Dependencies

```bash
npm install @radix-ui/react-slot @radix-ui/react-tabs @radix-ui/react-separator @radix-ui/react-label clsx tailwind-merge class-variance-authority
```

## Usage

### For Students

1. **Take Screening**

   - Navigate to `/dashboard/screening/take`
   - Answer 10 mental health questions
   - View color-coded results with recommendations
   - Choose next steps: case assessment, appointment, or resources

2. **View Results**
   - Results page shows severity level with color indicator
   - Personalized recommendations based on score
   - Access to support resources (OCCS, hotlines)
   - Options to start case assessment or book appointment

### For PSG Members

1. **Review Screenings**

   - Navigate to `/dashboard/psg/screenings`
   - Filter by: All, Pending, Reviewed
   - View summary cards with key metrics
   - Click "View Details" on any screening

2. **Detailed Review**
   - View student's responses and scores
   - See severity assessment with color coding
   - Add review notes
   - Mark as reviewed
   - Start case assessment

### For Admins

1. **Manage Questions**
   - Use `addScreeningQuestion()` server action
   - Create custom questions beyond presets
   - Set question weight (1-10) for severity calculation

## API Reference

### Server Actions (`/lib/actions/screening.ts`)

#### `submitScreening(responses: QuestionResponse[])`

Submit a new screening with student responses.

- **Returns**: `{ data: ScreeningResult, success: boolean }` or `{ error: string }`
- **Auth**: Student (authenticated)

#### `getScreeningResults(options?)`

Get all screening results with optional filters.

- **Options**: `{ reviewed?: boolean, severityLevel?: string, limit?: number }`
- **Returns**: `{ data: ScreeningResult[], success: boolean }`
- **Auth**: PSG Member or Admin

#### `getScreeningById(screeningId: string)`

Get single screening with responses.

- **Returns**: `{ data: { screening, responses }, success: boolean }`
- **Auth**: Student (own), PSG Member, or Admin

#### `updateScreeningReview(screeningId: string, reviewNotes: string)`

Mark screening as reviewed with notes.

- **Returns**: `{ data: ScreeningResult, success: boolean }`
- **Auth**: PSG Member or Admin

#### `createCaseAssessment(screeningId: string)`

Create a case assessment for a screening.

- **Returns**: `{ data: CaseAssessment, success: boolean }`
- **Auth**: PSG Member or Admin

#### `getScreeningQuestions()`

Get all preset screening questions.

- **Returns**: `{ data: ScreeningQuestion[], success: boolean }`
- **Auth**: Authenticated

#### `addScreeningQuestion(question)`

Add a custom screening question.

- **Returns**: `{ data: ScreeningQuestion, success: boolean }`
- **Auth**: PSG Member or Admin

## Validation

### Question Response Validation

```typescript
{
  question_id: string,
  answer: string | number | boolean,
  score?: number (0-10)
}
```

### Severity Calculation Algorithm

```typescript
function calculateSeverity(responses: QuestionResponse[]) {
  // 1. Sum weighted scores
  // 2. Calculate percentage (score / maxPossibleScore * 100)
  // 3. Check for immediate attention flags (e.g., suicidal thoughts)
  // 4. Categorize:
  //    - percentage >= 70 || requiresAttention → HIGH (red)
  //    - percentage >= 40 → MODERATE (yellow)
  //    - percentage < 40 → LOW (green)
}
```

## Security

- **RLS Policies**: All tables have Row Level Security enabled
- **Authentication**: All actions require authenticated user
- **Authorization**: Role-based access (student/psg_member/admin)
- **Data Privacy**: Students can only access own screenings
- **Audit Trail**: All reviews tracked with reviewer ID and timestamp

## Performance

- **Indexes**: Created on frequently queried columns:

  - `screening_results`: student_id, severity_level, reviewed_at, created_at
  - `screening_responses`: screening_result_id
  - `case_assessments`: student_id, psg_member_id, status
  - `assessment_messages`: case_assessment_id, created_at

- **Optimizations**:
  - Limit queries with pagination
  - Filter at database level (not in application)
  - Use `select('*')` only when necessary

## TODO

### Remaining Features (Task 7)

- [ ] Real-time chat for case assessment (Supabase Realtime)
- [ ] Admin question management UI
- [ ] Message reactions/read receipts
- [ ] Export screening reports as PDF
- [ ] Analytics dashboard for trends
- [ ] Email notifications for high-risk cases

## Testing

### Manual Testing Checklist

- [ ] Student can take screening and see results
- [ ] Severity calculation matches expected output
- [ ] PSG member can view all screenings
- [ ] PSG member can filter by severity/status
- [ ] PSG member can mark screening as reviewed
- [ ] Case assessment creation works
- [ ] RLS policies prevent unauthorized access
- [ ] Preset questions load correctly

### Test Users

Create test users with roles:

- `student@carsu.edu.ph` (role: student)
- `psg@carsu.edu.ph` (role: psg_member)
- `admin@carsu.edu.ph` (role: admin)

## Support Resources

Included in screening results:

- **CSU Office of Counseling and Career Services (OCCS)**
- **National Mental Health Crisis Hotline**: 1553
- **In Touch Community Services**: 09178001123
- **Emergency Services**: 911

## Contributing

When adding new features:

1. Update validation schemas in `/lib/validations/screening.ts`
2. Add new types in `/lib/types/screening.ts`
3. Create server actions in `/lib/actions/screening.ts`
4. Update RLS policies in migration SQL
5. Update this README

## License

Part of CareConnect: PSG Referral System for Caraga State University
