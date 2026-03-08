

# Make Usernames Case-Insensitive

## Why This Is a Good Idea
Staff on mobile devices may type `stajohndoe` instead of `STAjohndoe`. Since auth emails are built from usernames (`username@internal.local`), and Supabase Auth treats emails as case-insensitive by default, **login already works regardless of case**. However, we should ensure consistency everywhere:

## Changes Needed

### 1. Edge Function: `admin_create_staff/index.ts`
- Normalize `username` to uppercase before creating the auth user and staff profile
- This ensures the stored email is always uppercase: `STAJOHNDOE@internal.local`

### 2. Android App Compatibility (No Changes Needed)
- Supabase Auth email matching is case-insensitive, so `stajohndoe@internal.local` will match `STAJOHNDOE@internal.local`
- No Android app changes required

### 3. Staff Management UI: `src/components/StaffManagement.tsx`  
- The username input already uppercases the prefix, but we should also uppercase the staff name portion when constructing the full username, for display consistency

### Summary
This is a minimal, safe change — just add `.toUpperCase()` to the username in the edge function and UI before storage/auth creation. No database migration needed.

