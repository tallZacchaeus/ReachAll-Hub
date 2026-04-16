# Known Issues & Accepted Risks

Last updated: 2026-04-16  
Reviewed by: Engineering (ReachAll Hub Finance Module)

This file documents audit findings that are intentionally deferred, accepted as
low-risk, or already mitigated by other controls. It must be reviewed before
every major release and updated as items are resolved or re-scoped.

---

## Accepted / Mitigated Risks

### CAT3-04 — Duplicate request_id (RESOLVED in Sprint 3)
**Status:** Resolved  
`request_id` has a `->unique()` constraint in the migration. A `generateRequestId()` helper
uses a timestamp + random suffix. Verified in migration audit.

### CAT3-05 — created_at/updated_at in $fillable (RESOLVED)
**Status:** Resolved  
`Requisition::$fillable` does not include `created_at` or `updated_at`. Verified by code review.

### CAT5-05 — MySQL charset not utf8mb4 (RESOLVED)
**Status:** Resolved  
`config/database.php` already sets `charset = utf8mb4` and `collation = utf8mb4_unicode_ci`.

### CAT6-05 — Missing financial_period_id index (RESOLVED in Sprint 3)
**Status:** Resolved  
Sprint 3 migration `2026_04_16_070000_add_performance_indexes_to_finance_tables.php` includes
composite indexes covering `financial_period_id` on requisitions.

---

## Deferred Items (Post-Launch Backlog)

### CAT12-05 — TODO/FIXME comments in production code
**Status:** Deferred — no blocking TODOs found  
A full grep of the codebase (`grep -rn "TODO\|FIXME" app/`) returned **zero matches** in PHP
files at time of launch. Frontend TypeScript files also returned zero matches in Finance pages.  
**Action:** Add a CI lint rule (`grep -rn "TODO\|FIXME" app/ resources/js/Pages/Finance/`) as
a soft warning in a future sprint.  
**Risk:** Low — no deferred logic hidden behind TODO markers.

### CAT11-04 — File storage on ephemeral disk
**Status:** Accepted risk for initial launch; S3 migration required before scale  
Finance receipts and supporting documents are currently stored on the local `public` disk.
This is acceptable for a single-server deployment but **will result in data loss** if the
server is replaced or scaled horizontally.  
**Mitigation:** Set `FILESYSTEM_DISK=s3` and configure AWS credentials before launching on
cloud infrastructure. See `.env.example` S3 section for all required variables.  
**Risk:** Medium — data loss possible on server replacement. Must be resolved before
horizontal scaling or cloud migration.

### CAT8-04 — Frontend money formatting inconsistency
**Status:** Partially resolved — `resources/js/lib/money.ts` utility created in Sprint 4  
Some older Finance pages may still use inline formatting rather than `formatNaira()`. A
full migration of all Finance pages to use the shared utility is tracked for Sprint 5.  
**Risk:** Low — cosmetic only; backend always uses integer kobo.

### Requisition test suite — 8 pre-existing failures
**Status:** Known pre-existing failures; not regressions from Sprints 1–4  
`tests/Feature/Finance/RequisitionTest.php` has 8 failing tests that predate the sprint
work. Root cause: test fixtures assume a specific approval routing behaviour that diverges
from the current `ApprovalRouter` implementation. These tests have been failing since the
initial project setup and do not reflect production regressions.  
**Action:** Fix in Sprint 5 — rewrite test fixtures to match the actual routing rules.  
**Risk:** Low — production approval routing is covered by `ApprovalRouterTest` (all passing)
and Sprint 3/4 regression suites.

---

## Penetration Test

A penetration test is **recommended within 30 days of launch**.

Focus areas for the tester:
- Finance approval bypass (can a non-approver approve their own request?)
- Petty cash concurrent double-spend (race condition guard added in CAT2-06)
- IDOR on requisition/payment endpoints (can User A access User B's records?)
- Session fixation / CSRF on all state-changing finance routes
- File upload filtering (receipt uploads — path traversal, MIME spoofing)
- CSP header enforcement in production (X-Frame-Options, nosniff — added CAT11-02)

---

## Resolved Audit Findings (All Sprints)

| Finding    | Sprint | Description                                    |
|-----------|--------|------------------------------------------------|
| CAT9-01   | 3      | SLA escalation command + scheduler             |
| CAT12-01  | 3      | Approval reminder command                      |
| CAT10-02  | 3      | Vendor TIN field + FIRS validation             |
| CAT10-01  | 3      | FIRS WHT-01 schedule export                    |
| CAT12-02  | 3      | Audit log viewer (finance/ceo/superadmin only) |
| CAT6-01   | 3      | Performance indexes — approval_steps           |
| CAT6-02   | 3      | Performance indexes — requisitions             |
| CAT6-03   | 3      | Performance indexes — petty_cash_transactions  |
| CAT2-02   | 3      | CAPEX account code enforcement                 |
| CAT1-01   | 3      | Help page role restrictions                    |
| CAT9-02   | 3      | Echo channel auth callbacks                    |
| CAT9-03   | 3      | PeriodCloseController error logging            |
| CAT7-01   | 3      | PeriodCloseController error logging            |
| CAT11-02  | 4      | Security response headers middleware           |
| CAT11-03  | 4      | Sentry error monitoring integration            |
| CAT12-03  | 4      | GitHub Actions CI pipeline                     |
| CAT12-04  | 4      | composer audit + npm audit in CI               |
| CAT10-03  | 4      | Configurable VAT rate (env-driven)             |
| CAT2-06   | 4      | Petty cash race condition / double-spend guard |
| CAT4-04   | 4      | ESLint no-console rule                         |
| CAT5-06   | 4      | App timezone Africa/Lagos                      |
| CAT8-01   | 4      | Inertia restricted user field exposure         |
| CAT1-03   | 4      | FinanceRoleHelper role constants               |
| CAT1-11   | 4      | Password minimum strength always enforced      |
| CAT2-07   | 4      | Committed pipeline dashboard metric            |
| CAT6-04   | 4      | Large report exports queued to background job  |
| CAT2-10   | 4      | Requisition update recalculates VAT/WHT        |
| CAT2-11   | 4      | exchange_rate widened to decimal(14,6)         |
| CAT11-05  | 4      | Maintenance mode bypass strategy documented    |
| CAT3-04   | —      | request_id unique (already in schema)          |
| CAT3-05   | —      | No timestamps in $fillable (already clean)     |
| CAT5-05   | —      | utf8mb4 charset (already configured)           |
