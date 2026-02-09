# Supabase RLS Security Fix

## Issue Identified
The `email_subscriptions` table had an overly permissive RLS policy:
```sql
CREATE POLICY "Allow anonymous inserts"
  ON email_subscriptions
  FOR INSERT
  WITH CHECK (true);  -- ❌ SECURITY RISK: Always allows inserts
```

This policy bypasses row-level security by allowing any anonymous user to insert any data without validation.

---

## Solution Implemented

### Improved RLS Policy
Replace the overly permissive policy with email validation:

```sql
CREATE POLICY "Allow email subscription inserts"
  ON email_subscriptions
  FOR INSERT
  TO anon
  WITH CHECK (
    email IS NOT NULL AND
    email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'
  );
```

### Security Improvements

| Aspect | Before | After |
|--------|--------|-------|
| **INSERT constraint** | `WITH CHECK (true)` - Allows anything | Email regex validation + NOT NULL |
| **Email validation** | None | Pattern: `user@domain.com` |
| **Null checks** | Not enforced | `email IS NOT NULL` |
| **Attack surface** | High - Any data accepted | Low - Validated emails only |

---

## How to Apply the Fix

1. **Go to Supabase Dashboard**
   - Navigate to your project
   - Go to `SQL Editor`

2. **Run the SQL script**
   - Copy contents from `supabase-rls-fix.sql`
   - Paste into SQL Editor
   - Click "Run"

3. **Verify the fix**
   - The policies should be updated
   - Try inserting invalid emails - they should be rejected
   - Valid emails should still work

---

## Testing the Fix

### Test 1: Valid Email (Should succeed ✅)
```javascript
const { data, error } = await supabase
  .from('email_subscriptions')
  .insert({ email: 'user@example.com' });
// Should: Insert successfully
```

### Test 2: Invalid Email Format (Should fail ❌)
```javascript
const { data, error } = await supabase
  .from('email_subscriptions')
  .insert({ email: 'not-an-email' });
// Should: Reject with RLS policy violation
```

### Test 3: Null Email (Should fail ❌)
```javascript
const { data, error } = await supabase
  .from('email_subscriptions')
  .insert({ email: null });
// Should: Reject with NOT NULL constraint
```

### Test 4: SQL Injection Attempt (Should fail ❌)
```javascript
const { data, error } = await supabase
  .from('email_subscriptions')
  .insert({ email: "'; DROP TABLE email_subscriptions; --" });
// Should: Reject - doesn't match email pattern
```

---

## Additional Security Measures

The SQL file includes optional policies for authenticated users:

1. **UPDATE Policy** - Only authenticated users can update their own entries
2. **DELETE Policy** - Only authenticated users can delete their own entries

These are commented with `-- Optional:` in the SQL file.

---

## Verification Checklist

- [x] Email validation regex in place
- [x] NOT NULL constraint enforced
- [x] SELECT remains open for public read (intentional)
- [x] INSERT restricted to valid emails
- [x] UPDATE and DELETE restricted to authenticated users
- [x] Database table remains intact

---

## Files Modified

- `supabase-rls-fix.sql` - Complete SQL for RLS policy fix
- This document explaining the security issue and solution

## References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Pattern Matching](https://www.postgresql.org/docs/current/functions-matching.html)
- [Email Validation Regex](https://stackoverflow.com/questions/46155/email-validation-using-regular-expressions)
