# Production-Readiness Audit — Staff Coordinator

Audit date: 2026-07-15  
Scope: React/Vite SPA, Supabase schema/migrations, RLS, Edge Functions, and deployment/test configuration. This is a client-heavy multi-tenant FSM application; Supabase RLS and Edge Functions are therefore the security boundary, not React route guards.

## Executive Summary

The product has a broad, credible FSM surface: CRM/leads, projects, jobs/tasks, dispatching, time, inventory, estimates, invoices/payments, safety, memberships, customer portal, online booking, and location/geofence workflows. It has good early structure (lazy routes, React Query, TypeScript, RLS enabled on newer tables, audit triggers, and status constraints).

It is **not production-ready for real customer data or payments**. The principal blockers are public RLS policies that expose and mutate all estimates/payment records, unauthenticated and unbounded Edge Functions that can spend third-party API money or perform biometric matching, and authorization inconsistencies between UI roles and database policies. Direct browser access to Supabase is viable only after RLS is narrowed to tenant and role-specific operations.

### Severity summary

| Severity | Count | Release implication |
|---|---:|---|
| Critical | 4 | Block production release |
| High | 6 | Fix before handling customer/financial/biometric data |
| Medium | 9 | Plan before scale-up |
| Low | 5 | Maintainability and polish |

## Architecture Review

### Current design

- Vite React 18 SPA with React Router, React Query, Tailwind/shadcn components, and Zustand only for the legacy password-based admin state.
- Supabase provides Auth, Postgres/RLS, Storage, Realtime, and Edge Functions. Most business actions are direct browser-to-database writes.
- The domain is implemented by feature-sized pages/components rather than a service/API layer. Database migrations contain most server-side workflows (invoice generation, payment reconciliation, audit logs, role triggers).
- The application is multi-tenant around `companies`; the normal data path is company → customer/project → job/task/invoice/payment.

### Findings

#### A-01 — Authorization is split across UI, RLS, and functions
Severity: High

Impact: A UI-hidden feature can remain writable through the Supabase client. This creates privilege escalation risk and makes future changes hard to reason about.

Root cause: `usePermissions.ts` defines role behavior independently of SQL policies. Several policies treat every staff member as a company administrator while the UI does not.

Recommendation: Make Postgres authorization canonical: add small security-definer predicates such as `is_company_owner_or_admin(company_id)` and use them in every write policy/RPC. Keep the frontend matrix as presentation only. Prefer RPC/Edge Functions for state transitions, money, and public-token flows.

#### A-02 — Very large feature components and duplicated data access
Severity: Medium

Impact: Workflows are difficult to test and likely to diverge across screens. Examples include `ProjectDetailWorkspace`, `StaffManagement`, dashboards, and direct `supabase.from` queries in most pages.

Recommendation: Extract feature hooks/repositories, shared Zod schemas, and domain commands (`createJob`, `transitionJob`, `recordPayment`) with tests. Use query keys and mutations centrally.

#### A-03 — No server/API layer for sensitive FSM actions
Severity: High

Impact: The browser can construct arbitrary database updates that RLS accidentally permits. Transactions and idempotency are unavailable for multi-step workflows.

Recommendation: Move payment capture, estimate approval, job conversion, status transitions, user provisioning, exports, and notification dispatch into authenticated RPCs or Edge Functions.

## Security Findings

#### S-01 — Public estimate data disclosure and modification
Severity: Critical

Impact: Any anonymous caller can select every estimate, option, and item, and update any estimate. `approval_token` is only filtered by the UI, so an attacker can enumerate data or approve/alter an unrelated estimate.

Root cause: `20260714000003_phase2_money.sql` creates `USING (true)` policies for estimates, estimate options, and estimate items; public estimate update has no `WITH CHECK` token binding.

Recommendation: Remove all `USING (true)` public policies. Implement narrowly scoped `SECURITY DEFINER` RPCs that take the token, use `WHERE approval_token = supplied_token`, return only intended fields, validate expiry/status, and atomically approve/decline exactly once. Store a unique, non-guessable token hash rather than exposing a raw UUID as the authorization mechanism.

Implementation: Not auto-fixed because the customer-facing approval UI needs a new authenticated server contract; simply removing the policies would break it.

#### S-02 — Public payment status and forged payment records
Severity: Critical

Impact: Anonymous callers can read payment records and insert a `completed` payment through the public pay page. The reconciliation trigger can mark any invoice paid without a payment processor webhook.

Root cause: broad payment policies (`Staff write payments`, `Public select payment status via invoice`) plus client-side `payments.insert` in `PublicPayPage.tsx`; no Stripe/processor creation, signature verification, webhook, amount verification, or idempotency key exists.

Recommendation: Remove public payment writes. Create payments only from verified provider webhooks using a service role, unique provider event IDs, idempotent transaction handling, and a server-created checkout session. Public page should use a signed, expiring invoice-payment token and return minimal invoice details.

Implementation: Not auto-fixed; it requires selecting/configuring a processor and a webhook deployment.

#### S-03 — Unauthenticated API-cost and biometric endpoints
Severity: Critical

Impact: `face-verify`, `send_email_notification`, and `get-maps-key` accept unauthenticated requests. Attackers can spend AI/email quota, submit arbitrary biometric images, and retrieve the Maps key. `send_test_push` was also unauthenticated.

Root cause: Edge Functions use permissive CORS and do not validate a JWT/tenant/role. Function endpoints are public internet endpoints.

Recommendation: Require verified JWTs for user-invoked functions; use a separate internal secret for function-to-function calls; add per-user/IP/tenant rate limits and payload-size/content-type limits. Restrict the Google key by browser referrer and permitted APIs even after endpoint protection. Obtain explicit biometric consent, set retention/deletion policy, and complete jurisdictional/legal review before launch.

Implementation: `send_test_push` is now authenticated and tenant-scoped. The remaining functions need a deliberate public vs. internal contract decision, so they were not changed automatically.

#### S-04 — Unauthenticated staff provisioning/deletion
Severity: Critical (fixed in source)

Impact: Previously, anyone could create Field Crew accounts for any company and delete any staff ID, including their authentication account.

Root cause: `admin_create_staff` only authenticated elevated-role creation; `admin_delete_staff` did not authenticate or authorize at all.

Implementation: Added verified caller checks. Creation now requires a same-company owner, Admin, or delegated role manager; deletion requires the same-company owner or Admin. See modified Edge Function files below. Deploy the functions before relying on this fix.

#### S-05 — UI password flag is not an authorization mechanism
Severity: High

Impact: `admin_verify_password` compares a shared environment password and `useAdminAuth` persists `admin_authenticated=true` in localStorage. It is brute-forceable and a user can set the flag manually. If any UI uses it as a guard, it is bypassable.

Recommendation: Remove this flow in favor of Supabase Auth plus the `platform_admins` server/RLS check. Add rate limiting, MFA for platform administrators, and server-side admin actions.

#### S-06 — API keys are not cryptographically generated or hashed
Severity: High

Impact: Settings generates a token with `Math.random()` and stores only a display-masked fragment in `key_hash`; there is no server-side verification path. This feature provides a misleading security guarantee.

Recommendation: Generate opaque random keys server-side (`crypto.getRandomValues`), store a salted hash, show raw key once, add prefix/key ID, expiry, last-used, revocation, and authentication middleware. Restrict `api_keys` writes to admins/owners.

#### S-07 — Sensitive PII fetched into normal browser sessions
Severity: High

Impact: `useAuth` selects staff bank name, routing number, and account number for every staff session. This exposes highly sensitive payroll information unnecessarily.

Recommendation: Remove bank data from the general profile type/query. Store encrypted payroll data separately, grant only named payroll roles via an audited server endpoint, and never use direct browser reads for it.

#### S-08 — RLS grants are materially broader than role intent
Severity: High

Impact: migrations grant all staff write access to estimates, estimate items/options, payments, locations, API keys, and action items. Frontend role checks do not stop direct REST calls.

Recommendation: Replace staff-wide `FOR ALL` policies with role-aware predicates. Validate assignments for technician actions, and use `WITH CHECK` that prevents cross-tenant foreign-key references.

#### S-09 — Face-verification result path throws when AWS succeeds
Severity: High (fixed in source)

Impact: `staff_submit_face_for_event` referenced `result` outside the OpenAI fallback branch. AWS Rekognition success reaches a `ReferenceError` during mismatch email or response serialization.

Implementation: Responses and emails now use the always-defined `confidence` and `explanation` variables.

## Database Findings

#### D-01 — Payment transition is not trustworthy
Severity: Critical

The payment trigger marks invoices paid from any completed payment row and does not prevent overpayment, negative amounts, duplicate provider events, or changed completed rows. Make payment ingestion webhook-only and lock invoice/payment rows in a transaction.

#### D-02 — Public-token authorization lives in application code
Severity: Critical

Database RLS cannot rely on a React `.eq("approval_token", token)` filter. Enforce token authorization in a database RPC/function.

#### D-03 — State constraints do not enforce valid transitions
Severity: Medium

Jobs have a valid-status CHECK, but any status can transition to any other (for example `Cancelled` → `Paid`). Similar gaps exist for estimates, invoices, tasks, incidents, and shifts. Job events log changes but do not validate them.

Recommendation: use a transition table or `transition_job` RPC that verifies current/next state, actor role, timestamps, and side effects exactly once.

#### D-04 — RLS migration history contains conflicting role vocabulary
Severity: Medium

One hardening migration constrains `global_role` to `Technician`, whereas the UI and current role model use `Field Crew`; later migrations attempt renaming. Fresh-database migration testing is required to prove the final schema applies cleanly.

#### D-05 — Audit log policy is not actually admin-role based
Severity: Medium

`Admin read audit log` only allows company owners, contrary to its name; `System insert audit log` permits any authenticated insert with arbitrary data. Restrict inserts to triggers/service role and select to explicit audited roles.

#### D-06 — Missing lifecycle/data-management controls
Severity: Medium

No visible retention jobs for GPS/location history, biometric comparisons, audit logs, files, or notifications; no soft-delete/archive model for business records; no backup/restore evidence.

## Frontend and Product Findings

#### F-01 — Route protection is incomplete
Severity: High

Most dashboard routes use `ProtectedRoute`, but `/superadmin`, `/face-verify`, `/portal`, and public flows rely on page-local logic or no guard. Route guards are UX only; server authorization must match every action.

#### F-02 — Customer payment/approval flows have no reliable loading/idempotency model
Severity: High

Direct inserts/updates risk duplicate clicks and cannot safely reconcile external payment state. Add server-side idempotency and disable/retry UI based on a durable operation status.

#### F-03 — Form validation is inconsistent and mostly hand-written
Severity: Medium

The dependency set includes React Hook Form/Zod but feature pages commonly validate imperatively. Central schemas should validate client inputs and be shared with RPC/Edge Function input validation.

#### F-04 — Data fetching is largely unpaginated
Severity: Medium

Many dashboards/maps/reports use broad `select('*')` and aggregate in the browser. This will become slow for events, GPS history, jobs, estimates, and audit logs.

Recommendation: select columns explicitly, paginate/cursor large collections, aggregate in SQL views/RPCs, and add indexes that match tenant/date/status queries.

#### F-05 — Accessibility and responsive QA are insufficiently evidenced
Severity: Medium

No automated accessibility suite is present. Large dense tables, custom dialogs, map UI, drag-and-drop upload controls, and color-only status presentation need keyboard, screen-reader, contrast, and mobile testing.

## Performance Findings

- Lazy route loading and React Query defaults are positives.
- Dashboard/report/map components issue multiple independent queries and perform browser aggregation; expect waterfall and memory pressure as tenants grow. (Medium)
- Location updates loop through geofences and query the latest event separately for each geofence. This is O(geofences) round trips per device update. Batch in a SQL RPC and add `(staff_id, geofence_id, created_at DESC)` index. (High at scale)
- Location history is written per update without retention, sampling/backoff, or ingestion queue. This will grow quickly and affect cost. (High)
- Images are stored/handled as base64 in browser and Edge Function payloads; enforce size/type limits, resize client-side, and use signed uploads. (Medium)

## Testing, DevOps, and Deployment Risks

- Test coverage is effectively a single example test; no meaningful unit/integration/E2E coverage for auth, RLS, payment, public token, staff lifecycle, or status transitions. (High)
- No visible CI workflow, Docker/deployment definition, migration verification, dependency audit, security scan, or release gate. (High)
- No health checks, monitoring, structured logging/redaction, alerting, error tracker, backup/restore drill, or rollback playbook are included. (High)
- Local commands could not be run in this audit environment because the sandboxed Node runtime is denied parent-directory metadata access. This is an environment limitation, not a passing result. Run `npm run lint`, `npm test -- --run`, `npm run build`, Supabase migration tests, and a dependency audit in CI before release.
- Existing user changes were preserved: `src/components/StaffPortal.tsx` and three untracked test scripts were already present and were not modified.

## Automatic Fixes Applied

| File | Change | Expected outcome |
|---|---|---|
| `supabase/functions/admin_create_staff/index.ts` | Authenticate/authorize every creation, including Field Crew. | Prevent anonymous/cross-tenant account provisioning. |
| `supabase/functions/admin_delete_staff/index.ts` | Require same-company owner/Admin before deletion. | Prevent anonymous/cross-tenant staff and auth-user deletion. |
| `supabase/functions/send_test_push/index.ts` | Require same-company owner/Admin before sending. | Prevent arbitrary push-notification abuse. |
| `supabase/functions/staff_submit_face_for_event/index.ts` | Remove out-of-scope `result` references. | Prevent runtime failure on AWS verification path. |

Deploy the changed Edge Functions and test them with owner, Admin, Field Crew, unauthenticated, and cross-tenant accounts.

## Recommended Refactors and Missing Features

1. A command/API layer for FSM state changes, money, public links, and admin actions.
2. Canonical database authorization helpers and a role-permission test matrix.
3. Processor-backed payments with webhook verification and idempotency.
4. Signed/hashed public-link token service with expiration, revocation, and audit trail.
5. Notification/outbox job model with retries and dead-letter visibility.
6. Secure file upload pipeline (private buckets, signed URLs, content scanning/limits, retention).
7. Observability baseline: request IDs, structured redacted logs, error tracker, metrics, health checks.
8. Backup, restore, retention, consent, and incident-response procedures.

## Prioritized Roadmap

1. **Release blocker:** replace public estimate/payment RLS flows with secured RPC/Edge Functions and provider webhooks.
2. **Release blocker:** close/replace unauthenticated face/email/maps functions; configure rate limits and key restrictions.
3. **Week 1:** normalize database role enforcement, remove browser access to payroll fields, deploy staff-function fixes, and add tests.
4. **Month 1:** formalize FSM transition commands, pagination/aggregation, retention, CI/CD, observability, and backup drills.
