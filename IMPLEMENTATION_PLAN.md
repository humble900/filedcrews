# Feature-Preserving Production-Readiness Plan

## Guiding Rules

This plan fixes the audit findings **without deleting existing features or changing the product's intended workflows**. Each remediation is additive or compatible:

- Keep existing URLs, screens, tables, and user-visible feature names.
- Put secured endpoints/RPCs behind the existing React calls before retiring an unsafe direct database call.
- Deploy database changes as additive migrations; use backfills and compatibility views/functions where needed.
- Release each phase behind a feature flag or a staged tenant rollout, with a tested rollback migration/route.
- Preserve historical records and attachments. Archive or restrict access rather than delete.
- Validate every change with owner, Admin, Finance, Dispatcher, Field Crew, customer-link, anonymous, and cross-tenant test accounts.

## Phase 0 — Baseline, Backup, and Safety Net (1–2 days)

**Goal:** establish a reproducible baseline before behavior changes.

1. Create a staging Supabase project from a sanitized production snapshot and run all migrations from zero in CI.
2. Export database schema, RLS policies, Edge Function configuration, storage bucket settings, and deployed secret names (never secret values).
3. Add CI checks for `npm run lint`, unit tests, production build, migration apply, and a minimal RLS test suite.
4. Add error monitoring and structured, redacted Edge Function logs with request IDs.
5. Create a role-and-workflow test matrix covering signup, company setup, staff provisioning, job lifecycle, estimate approval, payment, location updates, face verification, and notification delivery.

**Compatibility:** no runtime behavior changes.  
**Exit criteria:** a failed migration/build/test blocks release; a restore drill and rollback procedure are documented.

## Phase 1 — Immediate Security Containment (2–4 days)

**Goal:** stop unauthorized actions while keeping current screens and URLs working.

1. Deploy the completed staff-management fixes for create, delete, and test-push Edge Functions.
2. Add JWT validation, tenant checks, role checks, request-size limits, and rate limits to every Edge Function.
3. Keep `/face-verify`, email notification, Maps, and public links available, but route each through an explicit access policy:
   - authenticated employee use: verified session plus same-company scope;
   - internal function-to-function use: a new server-only internal secret;
   - customer public link use: a dedicated, expiring token—not anonymous database access.
4. Restrict the Google Maps key in Google Cloud to approved production/staging domains and only the required Maps APIs.
5. Remove bank/routing/account fields from the general auth bootstrap query. Add a separate, audited payroll-data endpoint for authorized payroll users only; do not delete existing stored payroll data.
6. Add MFA requirements and a server-side authorization check for platform administrators; retain the existing Superadmin screen and URL.

**Compatibility:** UI screens remain; only unauthorized requests receive 401/403. Existing internal email/face flows move to server-authenticated calls.  
**Exit criteria:** unauthenticated and cross-tenant tests fail; authorized existing journeys pass.

## Phase 2 — Secure Public Approval and Payments (1–2 weeks)

**Goal:** preserve public estimate approval and payment features while moving authorization and money handling to trusted server code.

1. Add `public_link_tokens` (or equivalent) with token hash, entity type/id, expiry, revocation time, usage metadata, and audit fields. Preserve existing `approval_token` values during migration by backfilling compatible records.
2. Add Edge Functions/RPCs for: `get_public_estimate`, `approve_estimate`, `decline_estimate`, `get_public_invoice`, and `create_payment_checkout`.
3. Update existing `/approve/:token` and `/pay/:invoiceId` pages to call these endpoints without changing their URL or visual workflow.
4. Add a payment-provider checkout/session endpoint and a signed webhook endpoint. Only the webhook may insert/update a completed payment or change invoice payment status.
5. Add provider event IDs, unique constraints, idempotency keys, amount/currency verification, refund handling, and audit events.
6. After compatibility verification, narrow the old public RLS policies so they no longer expose arbitrary estimates, line items, invoices, or payments.

**Compatibility:** customers retain their existing approval/payment links; old links are accepted through the compatibility lookup until a communicated expiry date. No business feature is removed.  
**Exit criteria:** a token reveals only its intended record; duplicate submissions are idempotent; forged REST inserts cannot mark an invoice paid.

## Phase 3 — Canonical Roles and Database Authorization (1–2 weeks)

**Goal:** make database enforcement match the current Owner/Admin/Finance/Dispatcher/Field Crew feature model.

1. Add security-definer helper functions such as `is_company_owner`, `is_company_admin`, `has_company_permission`, and `is_assigned_to_job`, each with a fixed `search_path` and targeted grants.
2. Add a versioned permission mapping table that represents the existing frontend permission matrix; retain existing role names and custom roles.
3. Replace broad staff `FOR ALL` policies gradually, domain by domain, with role/assignment-aware `SELECT`, `INSERT`, `UPDATE`, and `DELETE` policies.
4. Preserve existing RLS behavior for each verified permitted workflow; use feature flags to roll tenants onto the new policies.
5. Resolve the historical `Technician` versus `Field Crew` migration mismatch with a non-destructive data migration and a compatibility constraint during rollout.
6. Move platform-administrator mutations to server-side operations while retaining the existing Superadmin dashboard UI.

**Compatibility:** current roles, custom roles, and page access stay intact. Changes affect only calls that were never legitimately permitted.  
**Exit criteria:** automated RLS tests prove all roles can perform their intended existing actions and cannot cross tenant/role boundaries.

## Phase 4 — Reliable FSM Workflow Commands (2–3 weeks)

**Goal:** make current workflows reliable without altering their screens or status labels.

1. Add transactional commands/RPCs for job creation/conversion, job status transition, task completion, staff assignment, timesheet entry, inventory consumption, estimate conversion, invoice generation, and payment reconciliation.
2. Encode the existing status labels in transition rules, preventing impossible transitions while allowing approved exception/reopen paths with reason and audit entry.
3. Preserve direct-page interactions by replacing the underlying React mutation only; retain routes, forms, labels, and notifications.
4. Add idempotency for retryable actions, optimistic updates with rollback, and durable job/action event records.
5. Introduce a notification outbox table and worker/Edge Function retries for email, push, accounting sync, and overdue reminders.

**Compatibility:** no FSM module is removed; workflows gain validation, retry safety, and audit history.  
**Exit criteria:** transition tests cover normal, invalid, duplicate, concurrent, and retry scenarios; no duplicate invoices/payments/notifications occur.

## Phase 5 — Scale, Data Protection, and UX Hardening (2–4 weeks)

**Goal:** sustain larger tenants while preserving features and historical data.

1. Add server-side pagination/filtering/sorting and aggregate report queries; keep existing table/report UI but feed it paginated data.
2. Replace per-geofence location round trips with one indexed database command; add retention/aggregation for location history without deleting required active records.
3. Add signed/private storage access, upload validation, image resizing, malware scanning where applicable, and retention rules for attachments and biometric images.
4. Establish consent, review, retention, export, and deletion workflows for GPS and biometric data; preserve required records as archived/audited rather than silently deleting them.
5. Complete keyboard, screen-reader, contrast, mobile, slow-network, empty-state, and error-state QA for every existing screen.

**Compatibility:** reports, maps, uploads, and mobile flows remain available; data access becomes faster and safer.  
**Exit criteria:** load tests meet defined response-time targets, primary workflows pass mobile/accessibility QA, and retention jobs are observable and reversible.

## Phase 6 — Operate and Release Safely (ongoing)

**Goal:** keep improvements working after deployment.

1. Use staged releases: internal tenant → pilot tenants → full rollout, with feature flags and measured error/security telemetry.
2. Maintain database backup/restore testing, migration rollback procedures, dependency updates, secret rotation, incident response, and quarterly RLS/function review.
3. Track production SLOs for sign-in, staff check-in, job status updates, approval, payment webhook processing, and notification delivery.

**Exit criteria:** every release has automated gates, an owner, metrics, alerting, and rollback instructions.

## Phase Dependencies

| Phase | Must precede |
|---|---|
| 0 | All production changes |
| 1 | 2, 3, and 4 |
| 2 | Any production payment/approval expansion |
| 3 | Broad direct-browser database feature work |
| 4 | Automation and reporting expansions |
| 5 | High-volume tenant onboarding |

---

# Earlier Implementation Notes

## Quick Wins (≤1 day)

| Work | Effort | Dependencies | Success criteria |
|---|---:|---|---|
| Deploy and test the four Edge Function source fixes from this audit. | 2–4h | Supabase deploy access | Unauthenticated and cross-tenant staff creation/deletion/test push return 401/403; authorized owner/Admin paths work. |
| Disable public payment writes and estimate updates until secured replacements ship. | 1–2h | Product acceptance of temporary restriction | Anonymous REST attempts cannot read/mutate unrelated records or mark invoices paid. |
| Remove payroll/bank fields from `useAuth` general select. | 1h | Confirm payroll UI use | Standard staff sessions never receive routing/account data. |
| Restrict Google Maps key in Google Cloud by production domains and APIs. | 1h | Google Cloud access | Key cannot be used from arbitrary origins or APIs. |
| Rotate any key that may have been exposed; verify `.env` remains ignored. | 1h | Secret manager access | New secrets are present only in managed environment configuration. |
| Add CI jobs for lint, tests, production build, and migration validation. | 3–6h | Git hosting/CI access | Pull requests cannot merge when these gates fail. |

## Short-term Improvements (≤1 week)

| Work | Effort | Dependencies | Risks | Success criteria |
|---|---:|---|---|---|
| Rebuild estimate approval as token-scoped RPCs. | 2–3d | UX decision, migrations | Existing links require migration/compatibility | Token reveals only one estimate, expires/revokes, and can approve once atomically. |
| Integrate a payment provider checkout and verified webhooks. | 3–5d | Stripe/provider account, webhook secret | Financial correctness | Only a verified provider event changes payment/invoice state; duplicates are idempotent. |
| Authenticate/rate-limit every Edge Function; create internal-call authentication for email. | 2–3d | Edge secrets, gateway plan | Can affect current mobile flows | Every endpoint has an explicit caller, tenant, role, and rate-limit policy. |
| Replace broad staff RLS write policies with owner/admin/assignment predicates. | 3–5d | RLS test fixtures | Can expose latent UI assumptions | Automated matrix proves each role can only read/write intended tenant records. |
| Add Zod schemas for all forms/functions and common mutation error handling. | 2–4d | Product field rules | Validation differences | Invalid payloads fail consistently client/server. |
| Add tests for auth, RLS, provisioning, public approval, payment webhook, and status transitions. | 3–5d | Test Supabase project | Fixture setup | Critical business/security paths are covered in CI. |

## Medium-term Improvements (≤1 month)

| Work | Effort | Success criteria |
|---|---:|---|
| Introduce domain commands/RPCs for job/task/estimate/invoice state transitions. | 1–2w | Invalid transitions are rejected, actions are audited, and side effects run once. |
| Extract feature hooks/repositories and split large pages. | 1–2w | UI behavior is preserved while queries/mutations become reusable and testable. |
| Build paginated reporting/dashboard queries and location-ingestion RPC. | 1w | Large tenants have bounded query count/response size and indexed query plans. |
| Secure upload/storage pipeline and retention controls. | 1w | Private files require signed access; image size/type/retention policy is enforced. |
| Add observability, alerting, backups, restore drills, and release runbooks. | 1–2w | A failed deploy can roll back; operators can detect and recover from service/data issues. |
| Accessibility/mobile QA program. | 1w | Keyboard, screen reader, contrast, and primary mobile workflows meet agreed acceptance criteria. |

## Long-term Refactors

- Establish a versioned API/domain layer rather than exposing most tables directly to the browser.
- Adopt a formal permission model (role/permission tables and server predicates) with audited administration.
- Add an outbox/queue for email, push, accounting sync, report generation, and retries.
- Introduce data lifecycle governance for GPS, biometric records, audit logs, documents, and account deletion.
- Separate the platform-superadmin console into a dedicated, MFA-protected surface with server-only administrative operations.

## Sequencing and Risks

1. First stop unauthorized public writes and deploy the staff-function fixes.
2. Build secured approval/payment replacements in a staging Supabase project with migration tests and provider sandbox events.
3. Tighten RLS one domain at a time, releasing behind feature flags while role-matrix tests are green.
4. Move stateful business workflows to commands/RPCs before adding more modules.

The major risk is that UI-only permissions have masked database over-permission. Every RLS change needs fixture accounts for owner, Admin, Finance, Dispatcher, Field Crew, anonymous, and cross-tenant users, plus rollback migrations.
