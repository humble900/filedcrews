# FieldTrack Pro — Feature Specification
**Field Service Management Platform for Construction & Field-Based Trades**

*Built from: real user pain-point research (Reddit r/fieldservicesoftwares) + competitive gap analysis of FieldPulse, Jobber, Housecall Pro, and ServiceM8 (Capterra, G2, BBB, Trustpilot reviews)*

---

## 1. Positioning

FieldTrack Pro competes not by matching every competitor feature, but by being the platform that **fixes the three problems every competitor shares**, while shipping the core loop (schedule → dispatch → complete → invoice → get paid) at a quality bar that beats WhatsApp/paper as the path of least resistance for technicians.

**The three universal gaps (confirmed across all four competitors' reviews):**
1. Unreliable accounting sync (QuickBooks/Xero) — the #1 complaint on every platform researched
2. Opaque, add-on-heavy pricing with difficult cancellation/data export
3. Incomplete offline reliability and/or OS parity gaps (ServiceM8 Apple-only, Jobber view-only offline, FieldPulse inconsistent uploads)

**Positioning statement:** *"The FSM platform that syncs your books correctly, tells you exactly what you'll pay, and never leaves your techs stranded without signal."*

---

## 2. Feature Tiers

Features are grouped into **MVP (Phase 1)**, **Phase 2 (Growth)**, and **Phase 3 (Scale/Moat)**. Each feature includes what it does, why it's there (source), and the differentiation angle.

---

## PHASE 1 — MVP Core Loop

### 2.1 Scheduling & Dispatch
| Capability | Detail |
|---|---|
| Drag-and-drop visual calendar | Day/week/month/team views; instant reassignment |
| Skill & availability filtering | Assign by technician certification, skill tag, and current location — explicitly requested in Reddit thread (BrilliantLow7403) |
| Auto-conflict detection | Prevent double-booking automatically |
| Multi-day / staged jobs | **Differentiator**: explicit gap where a Reddit user (Hot_Initiative3950) switched away from FieldPulse — jobs need real stage tracking (e.g., Quoted → Scheduled → In Progress → Awaiting Parts → Complete → Invoiced), not just open/closed |
| Route optimization | Basic proximity-based routing at MVP; AI-assisted in Phase 3 |

### 2.2 Work Order Management
| Capability | Detail |
|---|---|
| Granular job status states | assigned, en route, on site, in progress, pending parts, customer not available, completed, invoiced — directly requested in the Reddit thread (tik072) |
| Notes/photos persist across the job lifecycle | **Fixes a named FieldPulse complaint**: "notes and pictures do not follow from one page to the next along the course of the job" |
| Digital job cards | Checklists, forms, and signatures per job type |
| Single-screen job view | All job data (customer, equipment, notes, photos, invoice) on one screen — **fixes FieldPulse's named complaint** about information being "spread out among too many different pages" requiring multiple clicks |

### 2.3 Mobile App (iOS + Android, full parity from day one)
| Capability | Detail |
|---|---|
| Equal feature set on Android and iOS at launch | **Direct fix for ServiceM8's biggest named weakness** — its Android app is a stripped "lite" version causing customers to churn entirely |
| Sub-5-tap job completion | tik072's benchmark: "if the technician needs 12 taps just to close a job, adoption will suffer" |
| Photos, notes, signatures, on-site invoicing | Core field actions, no page-switching |
| **True offline-first architecture** (see 2.7) | Not offline-tolerant — offline-first |

### 2.4 Customer & Asset Management (CRM)
| Capability | Detail |
|---|---|
| Full customer history in one place | Jobs, quotes, invoices, notes, communications — requested repeatedly in the Reddit thread |
| **Asset/equipment as a first-class object** | Tracked by unit (serial number, install date, service history) independent of the customer record — **this is a genuine market gap**; no competitor researched does this well. Fixes the "I told the last guy this" problem named in market research |
| Communication log | All SMS/email/WhatsApp/call touchpoints tied to the customer and the job |

### 2.5 Estimates & Invoicing
| Capability | Detail |
|---|---|
| Quote → job → invoice conversion | One click, no re-entry |
| Configurable pricebook | Consistent pricing across techs |
| On-site payment capture | Card, ACH, mobile tap-to-pay |
| Multiple recipients on invoice emails | **Fixes a named FieldPulse gap**: "unable to email invoices and CC multiple recipients" |

### 2.6 True Two-Way Accounting Sync (QuickBooks Online, QuickBooks Desktop, Xero)
This is the single highest-leverage feature in the entire spec — it is the #1 cited complaint across **every competitor researched** (FieldPulse, Jobber, Housecall Pro, ServiceM8-for-non-Xero-users).

| Requirement | Why |
|---|---|
| Real-time sync, not scheduled/batch | FieldPulse's sync runs on a schedule, not real-time — named as a workflow mismatch risk |
| No duplicate entries on re-sync | Jobber users report ~2% of line items dropping and frequent duplicate transactions |
| Correct address/tax-field formatting | FieldPulse reviewer named this exact bug: "address field in Jobs does not format properly for QB sync" |
| Tested against messy pre-existing client lists | A FieldPulse reviewer specifically blamed sync failure on merging "over a decade of pre-existing client lists from 2 different sources" — build migration/dedup logic in from day one |
| Full two-way, not one-way | Jobber's QBO sync is one-way; Housecall Pro's Desktop sync is one-way. Two-way is the differentiator |
| QuickBooks Desktop AND Online AND Xero support | Jobber has no Desktop sync at all; most competitors are QBO-only. Xero support also captures the UK/ServiceM8 market |

### 2.7 Offline-First Mobile Architecture
| Requirement | Why |
|---|---|
| Full read/write offline: schedule, job status, notes, photos, signatures, payment capture | Web research: a customer lost 6 techs for 2 hours ($3,400) when software failed in a coverage dead zone; FieldPulse reviewer: "offline mode is not very helpful, and data is easily lost in poor cell coverage areas" |
| No data loss on app restart/crash mid-entry | A FieldPulse reviewer described a $40,000/year productivity loss from freezing that wiped field-entered data requiring re-entry |
| Automatic background sync on reconnect | With conflict resolution, not silent overwrite |
| Explicit offline status indicator | User always knows if they're in offline mode |

### 2.8 Transparent, Flat, All-Inclusive Pricing
This is a *business model* feature, not a software feature, but it must be designed into the product from day one (billing engine, plan structure, in-app messaging).

| Requirement | Why |
|---|---|
| Flat per-technician pricing, no per-job fees | Web research: per-job fees "penalize growth" — an HVAC tech doing 4-5 calls/day can rack up hundreds in fees/month |
| No minimum-seat padding | A 2-person team shouldn't pay for 5 "ghost" licenses |
| Core communication (SMS/calling/email) included, not gated add-ons | FieldPulse's #1 complaint: "you need add-ons for basic functionality like calling, texting, and emailing... I spent over $1,000 in add-ons" |
| No first-year price-increase surprises | Named complaint across FieldPulse and ServiceM8 reviews |
| Published pricing, no "contact sales" black box | Directly against ServiceTitan's model |
| Month-to-month by default; no 12-month lock-in | Directly against ServiceTitan's contract-penalty reputation |
| One-click, free, complete data export at any time | ServiceTitan and multiple vendors charge "data hostage" fees; this becomes a marketed guarantee, not just a policy |

---

## PHASE 2 — Growth Features

### 2.9 AMC / Maintenance Contract & Renewal Management
Called out explicitly in the Reddit thread as a **"silent revenue leak"** — not clearly surfaced in any competitor's public feature list.
- Recurring service contract tracking per customer/asset
- Automated renewal reminders (customer-facing and internal)
- Renewal-based reporting: upcoming renewals, lapsed contracts, renewal revenue at risk

### 2.10 Reporting & Dashboards
- Per-job profitability (not just revenue) — explicitly requested: "real numbers I can trust... not pretty dashboards"
- Technician productivity, response time, workload distribution
- Repeat-complaint and warranty-callback tracking
- **Differentiator over Jobber and FieldPulse**, both of which have "basic"/"thin" reporting as a named, repeated complaint

### 2.11 Inventory & Parts Management
- Stock tracking tied to job/technician van inventory
- Approval workflow before parts are used/replaced (prevents "drove to the job without the part")
- Purchase order generation from low-stock triggers

### 2.12 Custom Workflows / Job-Type Templates
- Per-service-type workflow builder (emergency plumbing vs. scheduled HVAC install, etc.)
- Attach forms/checklists/estimate templates to each workflow
- **Matches FieldPulse's most-praised feature** ("Clearpath") — table stakes by Phase 2, not a differentiator, but necessary for parity

### 2.13 Customer Portal & Booking Portal
- Self-serve scheduling, quote approval, and payment
- Real-time technician ETA / "on my way" notifications

### 2.14 WhatsApp-Native Communication Layer
Given the Reddit thread's clearest insight — **technicians default to WhatsApp when the app is too slow, making WhatsApp the real adoption competitor, not other FSM tools** — and your existing WhatsApp Business API integration plan:
- Job assignment/status notifications delivered via WhatsApp for techs who won't open a separate app
- Customer-facing WhatsApp updates (ETA, invoice, payment link) as a first-class channel alongside SMS/email
- **No competitor researched treats WhatsApp as a first-class channel** — this is a genuine open gap, especially valuable in UK/international markets

---

## PHASE 3 — Scale & Moat Features

### 2.15 AI-Assisted Dispatching
- Auto-suggest technician assignment by skill, proximity, and real-time availability
- Named as missing across FieldPulse and Jobber ("no intelligent dispatching or AI-powered tech assignment")
- Ship as an assistive suggestion layer, not a forced auto-assign, to avoid the "Operator AI less accurate than advertised" complaint seen in FieldPulse reviews

### 2.16 Open, Documented API + Native Integrations
- Public developer docs (fixes Housecall Pro's named gap: gated, undocumented API)
- Native integrations beyond accounting: Zapier, Google Calendar, fleet/GPS tracking, payroll
- Avoid forcing customers to stack a second subscription (Zapier) just to connect basic tools, as Housecall Pro reviewers describe

### 2.17 Multi-Region / Multi-Currency Support
- Native local-currency billing (fixes a named Jobber complaint: Canadian customers forced to pay in USD at a 35-40% cost penalty)
- Region-specific payment processors and financing options (fixes a named FieldPulse gap in the Canadian market)

### 2.18 Granular, Role-Based Permissions
- Fixes named complaints across FieldPulse (Team Managers unable to create forms) and Housecall Pro (permissions "bundled," too little control over technician access)

---

## 3. Non-Functional Requirements (Build These In From Day One)

| Requirement | Rationale |
|---|---|
| Support ticket SLA published per plan tier, not silently gated | Named complaint: base-tier support response times lengthen noticeably across FieldPulse and Housecall Pro |
| No dark patterns in cancellation flow | Housecall Pro's BBB resolution rate is 21% — largely billing/cancellation disputes; this is reputational risk to design against explicitly |
| System stability under field conditions (no data loss on crash/freeze) | The $40K/year FieldPulse case study is the clearest proof point of what this costs a customer |
| Construction-appropriate proposal depth (Phase 2+) | Housecall Pro's proposal tool is named as too simple for multi-line, scope-of-work construction proposals — relevant if FieldTrack Pro serves construction contractors specifically |

---

## 4. Competitive Positioning Summary Table

| Feature | FieldPulse | Jobber | Housecall Pro | ServiceM8 | FieldTrack Pro (target) |
|---|---|---|---|---|---|
| Two-way real-time QB/Xero sync | ⚠️ scheduled, buggy | ❌ one-way | ⚠️ one-way, mapping issues | ✅ (Xero only) | ✅ full |
| Full Android + iOS parity | ✅ | ✅ | ⚠️ weaker Android | ❌ Apple-only | ✅ |
| Offline-first (writes, photos, payments) | ⚠️ inconsistent | ⚠️ view-only | not emphasized | not emphasized | ✅ |
| All-inclusive flat pricing, no add-on gating | ❌ | ⚠️ per-user scaling | ❌ | ⚠️ add-ons reported | ✅ |
| Free, instant data export | not confirmed | not confirmed | ❌ | ⚠️ reported difficulty | ✅ guaranteed |
| Asset-level (not just customer-level) history | ⚠️ partial | ⚠️ partial | ⚠️ partial | ⚠️ partial | ✅ first-class |
| AMC/renewal tracking as distinct module | ❌ not surfaced | ❌ | ⚠️ recurring billing only | ❌ | ✅ |
| WhatsApp as first-class channel | ❌ | ❌ | ❌ | ❌ | ✅ |
| Multi-day/staged job tracking | ⚠️ named gap | not clear | not clear | not clear | ✅ |

---

## 5. Suggested Build Sequence

1. **Phase 1 (MVP)** — Sections 2.1–2.8. This alone, done well, beats every competitor on their three most damaging weaknesses (sync, pricing transparency, offline reliability) while matching table-stakes functionality.
2. **Phase 2** — Sections 2.9–2.14, prioritizing AMC/renewal tracking and the WhatsApp layer first, since both are validated, underserved gaps rather than parity features.
3. **Phase 3** — Sections 2.15–2.18, once there's a paying customer base large enough to justify AI dispatching investment and multi-region expansion.