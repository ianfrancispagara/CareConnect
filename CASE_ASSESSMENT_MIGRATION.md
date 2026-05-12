# Case Assessment via Chat - Migration Instructions

## Problem

Implementing chat-based case assessment using Columbia-Suicide Severity Rating Scale questions.

## Solution

Add assessment fields to conversations table to store assessment results and severity.

## Steps to Apply Migration

1. Open your Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to your project: **CareConnect**
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy and paste the contents of: `database/migrations/021_add_assessment_to_conversations.sql`
6. Click **Run** button

## What This Does

The migration will:

- Add `assessment_completed` boolean field to track if assessment is done
- Add `assessment_severity` field to store severity level (low/moderate/high)
- Add `assessment_color` field to store color code (green/yellow/red)
- Add `requires_immediate_attention` boolean for urgent cases
- Add `assessment_responses` JSONB field to store all Q&A
- Add `assessment_completed_at` timestamp
- Create indexes for efficient querying

## Features Added

1. **Chat-Based Assessment Flow**:

   - When student clicks "Start Case Assessment", chat opens automatically
   - Bot asks 6 preset questions based on Columbia-Suicide Severity Rating Scale
   - Student answers yes/no to each question
   - Skip logic: If Q2 is "no", skip to Q6
   - Automatic severity calculation

2. **Severity Display**:

   - PSG/Admin sees severity badge next to student name
   - Colors: Green (Low), Yellow (Moderate), Red (High)
   - Immediate attention flag for high-risk cases

3. **Privacy & Security**:
   - Responses encrypted like regular messages
   - Stored in conversation metadata
   - Only accessible to assigned PSG/admin

## Verification

After running the migration:

1. Test the assessment flow on screening results page
2. Check PSG chat widget for severity badges
3. Verify assessment data is stored in conversations table

## File Location

`/home/jetrossneri/Projects/CareConnect/frontend/database/migrations/021_add_assessment_to_conversations.sql`
