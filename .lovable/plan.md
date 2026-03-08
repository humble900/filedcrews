

# Plan: Show Password on Creation + Delete Staff

## Overview
Two features for the Staff Management page:
1. **Show password after creating a staff** -- display the password in a success banner so the admin can copy it before it's gone forever
2. **Delete staff button** -- with a confirmation dialog and full cleanup of related data

## Safety Note
Deleting a staff member will NOT affect the Android app or other staff. Each staff has an independent login. If a deleted staff tries to use the app, they simply get an "unauthorized" error -- the app won't crash.

---

## 1. Show Password After Creation

**What changes:**
- After successfully creating a staff member, instead of just a toast, show a highlighted card/banner with the username and password visible
- Include a "Copy Password" button
- The banner stays visible until the admin dismisses it or creates another staff member

**File:** `src/components/StaffManagement.tsx`
- Add state for `lastCreatedStaff` (stores username + password)
- After successful creation, populate this state
- Render a visible card with the credentials and copy button

---

## 2. Delete Staff (with full cleanup)

**What changes:**

### Backend function: `supabase/functions/admin_delete_staff/index.ts`
A new backend function that, given a `staff_id`:
1. Looks up the staff profile to get `auth_user_id`
2. Deletes related records from `staff_locations`, `staff_location_history`, and `geofence_events` (all reference `staff_id`)
3. Deletes the `staff_profiles` row
4. Deletes the auth user account

This must use the service role key to perform admin operations.

### Frontend: `src/components/StaffManagement.tsx`
- Add a red "Delete" button (trash icon) next to each staff member
- Show a confirmation dialog (AlertDialog) warning that this action is permanent
- On confirm, call the `admin_delete_staff` function and refresh the list

### Config: `supabase/config.toml`
- Add `[functions.admin_delete_staff]` with `verify_jwt = false` (matches existing pattern)

---

## Technical Details

### New edge function (`admin_delete_staff/index.ts`)
```
Input: { staff_id: string }
Steps:
  1. Fetch staff_profiles row by id to get auth_user_id
  2. DELETE FROM staff_locations WHERE staff_id = ?
  3. DELETE FROM staff_location_history WHERE staff_id = ?
  4. DELETE FROM geofence_events WHERE staff_id = ?
  5. DELETE FROM staff_profiles WHERE id = ?
  6. supabaseAdmin.auth.admin.deleteUser(auth_user_id)
  7. Return success
```

### UI changes in StaffManagement.tsx
- New state: `lastCreatedStaff` (object with username/password or null)
- New state: `deletingId` (tracks which staff is being deleted)
- Success banner component after creation showing credentials
- AlertDialog for delete confirmation
- Trash icon button per staff row

