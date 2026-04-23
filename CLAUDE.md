# CLAUDE.md

This file provides repo-specific guidance to Claude Code when working in this repository.

## Project Identity

- Canonical app/repo name: `ReachAll Hub`
- Prior name used in some older files: `Tech Staff Evaluation Platform`
- Treat `Tech Staff Evaluation Platform` as stale naming that should be updated on sight
- This is an internal HR and operations platform built with Laravel + Inertia + React/TypeScript

Major feature areas:
- Real-time chat
- Task management
- Attendance and leave
- Resource requests
- Staff enrollment
- Profile update approval workflow
- Recognition and learning
- Onboarding checklists
- OKRs
- Reports and analytics
- Content pages, newsletters, bulletins, FAQs
- Finance workflows, approvals, documents, reports, and scheduled checks

## Serious HR Platform Roadmap

The current product has a strong internal HR/operations foundation, but a serious full-fledged HR platform needs the following NOW-tier capabilities. Treat these as strategic product gaps when planning major feature work.

Build these features as modular, permission-gated modules. Superadmin must be able to control access by role wherever practical. Sensitive changes must be audited, and system-critical roles and permissions must be protected from accidental lockout.

### NOW-Tier Missing Capabilities

- Dynamic roles, permissions, and feature access
  - Role-based access with superadmin-configurable role creation, feature assignment, edit, and removal
  - Audit trail for every role and permission change
  - System-protected roles such as `superadmin` to prevent lockout
- Payroll
  - Gross-to-net engine with Nigerian statutory rules such as PAYE, pension, NHF, and NSITF
  - Payslip generation and delivery
  - Off-cycle payroll runs
  - Loans, salary advances, deductions, bank payment file exports, and year-end tax reports
- Benefits administration
  - HMO enrollment, pension, life insurance, disability insurance, dependents, and open enrollment workflows
- Compensation management
  - Salary bands, pay grades, merit and compensation review cycles, bonus and variable pay, and total rewards statements
- Full recruitment / ATS
  - Job requisitions, candidate pipeline, application forms, interview scheduling, scorecards, talent pool, and offer letters
- Org chart and reporting hierarchy
  - Proper employee master data
  - Job positions as separate entities
  - Cost centers, departments, business units, and locations
  - Effective-dated lifecycle events such as hire, promotion, transfer, termination, and rehire
- HR document vault and e-signatures
  - Central digital personnel file
  - Document versioning
  - E-signature workflows for offers, contracts, and policies
  - Contract management with versioning
- Employee relations / case management
  - HR helpdesk and ticketing with knowledge base
  - Grievance and whistleblower channels
  - Disciplinary action tracking
  - Investigation case management
- Global compliance and localization basics
  - Visa and work permit tracking with expiry alerts
  - Right-to-work verification
  - GDPR / NDPR data subject request workflows
  - Mandatory compliance training tracking
  - Policy acknowledgement workflow with versioning

### Supporting NOW-Tier Capabilities

- Performance review cycles beyond OKRs, including quarterly and annual cycles, 360-degree feedback, continuous feedback, 1:1s, and performance improvement plans
- Deeper leave management, including multiple leave types, accrual policies with carry-over, Nigerian holiday calendar, team leave calendar, and cover assignment
- Onboarding document collection for ID, tax, bank, NIN, BVN, visa, and related employee records
- Pre-boarding flows and equipment provisioning requests
- Expense and travel reporting with receipt capture and multi-currency support
- Immutable audit logs across all modules
- Structured offboarding, including exit interview, equipment return, access revocation, final settlement, and clearance

### Roadmap Implementation Rules

- Start with platform foundations before feature breadth: RBAC, module registry, audit logs, employee master data, org structure, document storage, and workflow primitives.
- Avoid building isolated screens with hard-coded role checks. New HR modules must use shared authorization, shared audit logging, shared notification patterns, and Inertia-first page delivery.
- Model country-specific rules, especially payroll and compliance rules, as configurable policy data rather than scattered conditionals.
- Treat payroll, compensation, employee relations, document vault, and compliance data as high-sensitivity data with strict authorization, auditability, and export controls.
- Preserve finance auditability and private document storage rules when extending expense, travel, payroll, or document workflows.
- Prefer phased vertical slices that ship a working module foundation plus one complete workflow before expanding to edge cases.

## Primary References

- `PROJECT_GUIDE.md` is the repo-wide source of truth for product/domain behavior
- `routes/web.php` defines the main application surface
- `routes/console.php` defines scheduled finance jobs that matter in production
- `app/Http/Controllers/PageController.php` shows dashboard routing and role/stage-based rendering
- `app/Models/` and `app/Services/Finance/` contain the core backend domain logic
- `resources/js/Pages/`, `resources/js/components/`, and `resources/js/types/` contain the frontend structure
- `routes/channels.php` and chat-related controllers/events govern realtime behavior
- `docs/finance/README.md` and `.env.example` contain important deployment and finance go-live notes

## Stack and Repo Facts

- Backend: Laravel 12, PHP 8.2+, Fortify, Inertia Laravel, Excel export, DomPDF, Sentry, Pusher server
- Frontend: React 19, TypeScript 5.7, Inertia React 2.x, Tailwind CSS 4, Radix/Shadcn-style components, Recharts, Tiptap, React Hook Form, Motion
- Auth: session-based Fortify; login identifier is `employee_id`, not email
- Roles: `staff`, `management`, `hr`, `finance`, `general_management`, `ceo`, `superadmin`
- Employee stages: `joiner`, `performer`, `leader`
- Dev database: SQLite
- Production target: MySQL/MariaDB on VPS unless the user explicitly chooses another production database
- Realtime: Laravel broadcasting + Echo + Pusher-compatible driver
- Chat file uploads depend on `php artisan storage:link`
- Scheduler matters in production because finance jobs are defined in `routes/console.php`
- Queue workers matter in production for asynchronous work
- This app is Inertia-first; do not introduce a separate REST API, Livewire, or a new SPA data layer unless the task explicitly requires it

## Frontend UX Governance

Treat frontend work in this repo as a governed UX system, not as isolated page edits.

- Preserve the app's internal-product character, but consolidate inconsistent page-level styling and interaction patterns
- Prefer the existing shared primitives in `resources/js/components/ui/` and the newer shell/layout foundation over bespoke page-local wrappers
- Prefer theme tokens and semantic classes from `resources/css/app.css` over hardcoded hex colors or one-off color utilities
- Reduce duplicate layout patterns and converge toward one shell/navigation approach where the existing structure supports it
- Treat accessibility, responsiveness, and empty/loading/error/success states as required work, not optional polish
- When frontend behavior conflicts with backend/product truth, update the UI to reflect the real system behavior instead of preserving misleading copy

### UI Implementation Rules

- Use shared `Card`, `Button`, `Input`, `Textarea`, `Form`, `Table`, `Dialog`, `Drawer`, `Sheet`, `Tabs`, `Pagination`, and `Toaster` primitives before creating custom wrappers
- Use `react-hook-form` patterns via the existing form helpers in `resources/js/components/ui/form.tsx` for non-trivial forms
- Reuse the current shell/layout building blocks such as `MainLayout`, `app-shell`, shared sidebar/header components, and existing app layouts before introducing one-off page shells
- Use tokenized colors and semantic roles from `resources/css/app.css`; avoid new page-local `#1F6E4A`, `#FFD400`, and similar hardcoded values unless the exception is documented in the task
- Do not rely on dark-mode override hacks as the primary styling strategy; build components to work in both themes directly
- Prefer shared status, badge, table, and card patterns over page-specific bespoke variants when the semantics are the same
- Build forms, filters, search bars, and tables to remain usable on mobile and tablet, not just wide desktop layouts
- Use motion sparingly and purposefully for hierarchy, transitions, and feedback; do not add decorative animation without UX value
- Prefer clear CTA placement, predictable navigation, and scannable information density over visually dense dashboards

### UX Review Checklist

Before closing any UI-related task, explicitly evaluate:

- Information hierarchy and page scannability
- Mobile and tablet behavior, including overflow and stacking
- Keyboard and screen-reader basics for interactive controls
- Form clarity, validation, helper text, and submit/loading states
- Table, filter, and search usability, including overflow behavior
- Empty, loading, success, and error states
- Consistency with navigation, naming, icon use, and CTA placement
- Contrast and theme correctness in both light and dark modes

### Known UI Consistency Issues

Keep these in mind during future frontend work:

- Mixed old/new shell and navigation patterns still exist across the app
- Hardcoded brand colors are widespread in pages and widgets instead of using shared tokens
- Dark-mode patching in CSS currently compensates for hardcoded light-mode classes
- Some auth and UX copy does not fully match actual app behavior and backend rules
- Several dashboards and status presentations use bespoke page-level card and state styling that should converge on shared patterns over time

## Required Claude Code Skill Routing

Claude Code should explicitly use these installed skills from `~/.claude/skills` whenever the task matches. Use more than one skill when needed.

### Core Implementation Skills

- `laravel-specialist` for controllers, models, policies, Fortify, queues, migrations, Artisan commands, and Laravel-specific testing
- `php-pro` for strict PHP refactors, services, validation, typed data flow, and maintainability improvements
- `ui-ux-pro-max` for UI/UX design decisions, interaction patterns, responsive behavior, accessibility, and interface quality control
- `frontend-design` for production-grade frontend implementation, visual direction, layout refinement, and polished interface work
- `react-expert` for Inertia pages, React components, hooks, state flow, and UI behavior
- `react-best-practices` for React-side quality, rendering discipline, and performance-oriented implementation patterns
- `typescript-pro` for type safety, shared types, route/helper typing, and removal of unsafe casts
- `fullstack-guardian` for work that spans backend + frontend + security/validation

### Quality and Debugging Skills

- `test-master` for PHPUnit/Laravel feature tests, regression coverage, release-readiness checks, and test gap analysis
- `code-reviewer` for code audits, pre-deployment reviews, refactor reviews, and quality passes
- `web-design-guidelines` for UI/UX audits, best-practice checks, and design-review style findings
- `contrast-checker` for WCAG color-contrast validation and accessible color corrections
- `link-purpose` for link-text clarity and navigation accessibility review
- `debugging-wizard` for reproduction-first bug investigation and root-cause analysis

### Security Skills

- `security-reviewer` for production hardening, auth flows, file uploads/downloads, finance access control, secrets handling, and vulnerability review
- `secure-code-guardian` when implementing auth/authz, input validation, headers, CSRF/XSS/SQLi protections, or other code-level hardening

### Data, Realtime, and Operations Skills

- `database-optimizer` for query tuning, indexes, dashboard/report performance, and MySQL migration/performance review
- `websocket-engineer` for chat, typing indicators, broadcasting, channel authorization, Pusher/Reverb setup, and realtime scaling concerns
- `devops-engineer` for VPS deployment, build/release scripts, queue workers, cron, process supervision, Nginx/Apache/PHP-FPM, CI/CD, and rollback procedures
- `cloud-architect` for Hostinger VPS topology, storage strategy, backups, network/security design, and disaster recovery planning
- `sre-engineer` for health checks, reliability, runbooks, operational readiness, and production safeguards
- `monitoring-expert` for Sentry, structured logging, alerting, performance baselines, and post-deploy observability
- `architecture-designer` when making high-level architecture or deployment trade-off decisions
- `cli-developer` only when building or refining CLI/script tooling for deployment or maintenance

### Preferred Skill Combinations

- UI/UX-heavy implementation or redesign: `ui-ux-pro-max` + `frontend-design` + `react-best-practices`; add `typescript-pro` for typed implementation and `fullstack-guardian` when the flow spans backend and UI
- UI/UX audit, accessibility review, or polish pass: `ui-ux-pro-max` + `web-design-guidelines` + `contrast-checker` + `link-purpose`
- Full-stack feature or bug fix: `fullstack-guardian` + `laravel-specialist` + `react-expert` + `typescript-pro` + `test-master`
- Security-sensitive change: `laravel-specialist` + `security-reviewer` + `secure-code-guardian` + `test-master`
- Enterprise HR platform expansion: `architecture-designer` + `fullstack-guardian` + `laravel-specialist` + `php-pro` + `react-expert` + `typescript-pro` + `security-reviewer` + `test-master`; add `database-optimizer` for employee master data, payroll, reporting, audit logs, or high-volume tables
- Production-readiness or Hostinger deployment work: `code-reviewer` + `security-reviewer` + `devops-engineer` + `cloud-architect` + `sre-engineer` + `monitoring-expert`
- Chat/realtime work: `laravel-specialist` + `react-expert` + `websocket-engineer` + `test-master`
- Finance module work: `laravel-specialist` + `php-pro` + `security-reviewer` + `test-master`; add `database-optimizer` for reporting or heavy queries

Do not invoke unrelated skills unless the task clearly requires them.

## Commands

```bash
# One-shot setup (fresh clone)
composer setup

# Development — Laravel + queue listener + logs + Vite
composer dev

# SSR development
composer dev:ssr

# Tests and lint gates
composer test
composer lint
composer test:lint

# Frontend
npm run dev
npm run build
npm run build:ssr
npm run lint
npm run format
npm run format:check
npm run types
```

## Working Rules for This Repo

- Follow existing Laravel + Inertia patterns; prefer controller-rendered pages over inventing new APIs
- Keep growing business logic out of controllers; prefer services, actions, and focused query scopes when logic becomes non-trivial
- Preserve role-based authorization and finance auditability
- Respect file visibility rules; finance/private documents must not be moved to public storage by default
- Assume changes must pass the narrowest relevant checks before completion
- Common gates are `composer test`, targeted `php artisan test`, `npm run types`, `npm run build`, and `npm run lint`
- Do not add new tooling such as PHPStan, Pest, Docker, Redis, or Reverb unless the user asks for it or the task explicitly requires it
- If documentation and code disagree, trust the code first, then update documentation as part of the task

## Production Target: Hostinger VPS

Assume the deployment target is a single Linux VPS at Hostinger unless the user says otherwise.

### Production Expectations

- Use MySQL/MariaDB instead of SQLite
- Run PHP-FPM behind Nginx or Apache
- Build frontend assets during deploy and serve `public/build`
- Run a persistent queue worker via `systemd` or Supervisor
- Configure cron to run `php artisan schedule:run` every minute
- Run `php artisan storage:link`
- Set `APP_ENV=production`, `APP_DEBUG=false`, and production-safe logging/session/cache settings
- Use HTTPS with secure cookies
- Configure broadcasting with real Pusher credentials or a compatible self-hosted option only if the VPS setup supports it
- Use backed-up persistent storage for uploads and finance documents; prefer S3-compatible object storage if available
- Enable Sentry and basic health/operational monitoring before go-live
- Confirm backup, restore, rollback, and restart procedures exist before deployment

### Pre-Deploy Verification Checklist

- Migrations are safe to run with `php artisan migrate --force`
- Queue-dependent and scheduler-dependent finance flows are covered
- Storage permissions and symlinks are correct
- Login, 2FA, email verification, password reset, chat, file uploads, exports, reports, and finance document downloads work in production-like config
- Cache/config/route/view optimize commands do not break runtime behavior
- No local URLs, debug flags, demo credentials, or stale `ReachAll Hub` branding remain where they would leak into production

## Known Repo-Specific Notes

- `PROJECT_GUIDE.md` describes the product correctly; the current repository still has legacy `ReachAll Hub` naming in some files
- Login uses `employee_id`
- Dashboard rendering depends on both `role` and `employee_stage`
- Finance scheduled jobs are defined in `routes/console.php`
- Chat and some file access depend on broadcasting/storage configuration being correct in production

## When Asked for Deployment Readiness

Default workflow:

1. Audit repo and environment config for production blockers
2. Fix blockers in the smallest safe increments
3. Run targeted tests/build/type checks after each group of changes
4. Produce a concrete Hostinger VPS deployment checklist with commands, services, env vars, and rollback notes
