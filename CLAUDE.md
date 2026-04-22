# CLAUDE.md

This file provides repo-specific guidance to Claude Code when working in this repository.

## Project Identity

- Canonical app/repo name: `Tech Staff Evaluation Platform`
- Legacy name appears in some files: `ReachAll Hub`
- Treat `ReachAll Hub` as stale naming unless the task is an intentional rename/branding cleanup
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

## Required Claude Code Skill Routing

Claude Code should explicitly use these installed skills from `~/.claude/skills` whenever the task matches. Use more than one skill when needed.

### Core Implementation Skills

- `laravel-specialist` for controllers, models, policies, Fortify, queues, migrations, Artisan commands, and Laravel-specific testing
- `php-pro` for strict PHP refactors, services, validation, typed data flow, and maintainability improvements
- `react-expert` for Inertia pages, React components, hooks, state flow, and UI behavior
- `typescript-pro` for type safety, shared types, route/helper typing, and removal of unsafe casts
- `fullstack-guardian` for work that spans backend + frontend + security/validation

### Quality and Debugging Skills

- `test-master` for PHPUnit/Laravel feature tests, regression coverage, release-readiness checks, and test gap analysis
- `code-reviewer` for code audits, pre-deployment reviews, refactor reviews, and quality passes
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

- Full-stack feature or bug fix: `fullstack-guardian` + `laravel-specialist` + `react-expert` + `typescript-pro` + `test-master`
- Security-sensitive change: `laravel-specialist` + `security-reviewer` + `secure-code-guardian` + `test-master`
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
