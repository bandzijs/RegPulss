# Duplicate Email Logging System

## Overview

The RegPulss app now has a complete duplicate email tracking system that logs all rejected subscription attempts with detailed information.

---

## Database Schema

### email_duplicates Table

```sql
CREATE TABLE email_duplicates (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  attempted_at TIMESTAMP,
  reason TEXT,
  user_agent TEXT
);
```

**Columns:**
- `id` - Unique identifier (UUID)
- `email` - The email that attempted to subscribe
- `attempted_at` - When the duplicate attempt occurred
- `reason` - Why it was rejected (e.g., "Already subscribed")
- `user_agent` - Browser/client information for analytics

**Indexes:**
- `idx_email_duplicates_email` - Fast lookups by email
- `idx_email_duplicates_attempted_at` - Fast lookups by date

### duplicate_statistics View

```sql
SELECT
  email,
  COUNT(*) as duplicate_count,
  MIN(attempted_at) as first_attempt,
  MAX(attempted_at) as last_attempt,
  COUNT(DISTINCT reason) as unique_reasons
FROM email_duplicates
GROUP BY email;
```

Shows aggregated duplicate statistics per email.

---

## Setup Instructions

### 1. Create the Table in Supabase

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Copy contents of `supabase-duplicate-logging.sql`
3. Run the SQL

### 2. Verify Tables Created

In Supabase Dashboard, check **Table Editor**:
- ✅ `email_duplicates` should appear
- ✅ `duplicate_statistics` view should appear

---

## Utility Functions

### Import

```typescript
import {
  isEmailSubscribed,
  getDuplicateCount,
  logDuplicateAttempt,
  getDuplicateStats,
  getDuplicatesForEmail,
  getDuplicatesByDateRange,
  clearOldDuplicates,
} from '@/lib/duplicateManager';
```

### Functions

#### `isEmailSubscribed(email: string): Promise<boolean>`

Check if an email is already subscribed.

```typescript
const subscribed = await isEmailSubscribed('user@example.com');
if (subscribed) {
  console.log('Already subscribed');
}
```

#### `getDuplicateCount(email: string): Promise<number>`

Get the number of duplicate attempts for an email.

```typescript
const count = await getDuplicateCount('user@example.com');
console.log(`This email has tried ${count} times`);
```

#### `logDuplicateAttempt(email: string, reason: string, userAgent?: string): Promise<boolean>`

Log a duplicate subscription attempt.

```typescript
await logDuplicateAttempt(
  'user@example.com',
  'Already subscribed',
  'Mozilla/5.0...'
);
```

#### `getDuplicateStats(): Promise<Array>`

Get duplicate statistics for all emails (ordered by count).

```typescript
const stats = await getDuplicateStats();
stats.forEach(stat => {
  console.log(`${stat.email}: ${stat.duplicate_count} attempts`);
});
```

#### `getDuplicatesForEmail(email: string): Promise<Array>`

Get all duplicate attempts for a specific email.

```typescript
const attempts = await getDuplicatesForEmail('user@example.com');
attempts.forEach(attempt => {
  console.log(`Attempted at: ${attempt.attempted_at}`);
});
```

#### `getDuplicatesByDateRange(startDate: Date, endDate: Date): Promise<Array>`

Get duplicate attempts within a date range.

```typescript
const start = new Date('2026-02-01');
const end = new Date('2026-02-28');
const duplicates = await getDuplicatesByDateRange(start, end);
console.log(`Duplicates in Feb: ${duplicates.length}`);
```

#### `clearOldDuplicates(daysOld: number): Promise<number>`

Delete old duplicate records (useful for data cleanup).

```typescript
// Delete duplicates older than 90 days
const deleted = await clearOldDuplicates(90);
console.log(`Deleted ${deleted} old records`);
```

---

## How It Works

### When a Duplicate Subscription Attempt Occurs

```
1. User submits email → /api/subscribe
2. API attempts INSERT into email_subscriptions
3. Database rejects (UNIQUE constraint violation, error 23505)
4. API catches error and:
   ├─ Returns 409 "Already subscribed" to user
   └─ Logs attempt to email_duplicates table
5. Data available for analytics/dashboard
```

### What Gets Logged

For each duplicate attempt:
- ✅ Email address
- ✅ Timestamp
- ✅ Reason ("Already subscribed")
- ✅ User agent (browser info)

---

## Monitoring & Analytics

### View Recent Duplicates

In Supabase Dashboard → Table Editor → email_duplicates:
- Sort by `attempted_at` (descending) to see recent attempts
- Filter by `email` to see attempts for specific email
- Count rows to see total duplicate attempts

### Get Statistics

Query the `duplicate_statistics` view:

```typescript
const stats = await getDuplicateStats();
// Shows: email, duplicate_count, first_attempt, last_attempt, unique_reasons
```

### Top Duplicated Emails

In Supabase SQL Editor:

```sql
SELECT email, COUNT(*) as attempts
FROM email_duplicates
GROUP BY email
ORDER BY attempts DESC
LIMIT 10;
```

---

## RLS Policies

The `email_duplicates` table has these policies:

1. **SELECT (Public)** - Anyone can view duplicate logs
   ```sql
   WITH CHECK (true)
   ```

2. **INSERT (Validated)** - Anonymous users can log duplicates if email is valid
   ```sql
   WITH CHECK (email IS NOT NULL AND email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
   ```

---

## Usage Examples

### Example 1: Dashboard Summary

```typescript
const stats = await getDuplicateStats();
console.log(`Total emails with duplicates: ${stats.length}`);

const topDuplicate = stats[0];
console.log(`
  Most duplicated email: ${topDuplicate.email}
  Attempts: ${topDuplicate.duplicate_count}
  First attempt: ${topDuplicate.first_attempt}
  Last attempt: ${topDuplicate.last_attempt}
`);
```

### Example 2: Check Before Showing Modal

```typescript
const isSubscribed = await isEmailSubscribed('user@example.com');

if (isSubscribed) {
  const duplicates = await getDuplicateCount('user@example.com');
  console.log(`This email already subscribed (${duplicates} duplicate attempts)`);
}
```

### Example 3: Cleanup Script

```typescript
// Run this monthly to clean old data
const deleted = await clearOldDuplicates(90); // 90 days
console.log(`Cleaned up ${deleted} old duplicate records`);
```

---

## Testing

Test duplicate logging:

```bash
# 1. Try subscribing with the same email twice
# First attempt: Success (201)
# Second attempt: Rejected (409) + logged to email_duplicates

# 2. Check Supabase email_duplicates table
# Should see 1 row with your email

# 3. Try subscribing again
# Should see 2 rows total
```

---

## Files

- `supabase-duplicate-logging.sql` - SQL to create tables and policies
- `lib/duplicateManager.ts` - Utility functions for managing duplicates
- `app/api/subscribe/route.ts` - Updated to log duplicates
- `DUPLICATE_EMAIL_LOGGING.md` - This documentation

---

## Next Steps

1. Run the SQL script in Supabase
2. Test duplicate submissions
3. Monitor `email_duplicates` table in Supabase Dashboard
4. Use utility functions in dashboards/analytics as needed
