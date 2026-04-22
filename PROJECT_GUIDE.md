# Tech Staff Evaluation Platform — Full Project Guide

> This is the single source of truth for understanding, developing, and deploying the Tech Staff Evaluation Platform. It covers every feature, every model, every route, and every architectural decision in the codebase.

---

## Table of Contents

1. [What is This Platform?](#1-what-is-this-platform)
2. [Technology Stack](#2-technology-stack)
3. [Architecture Overview](#3-architecture-overview)
4. [Directory Structure](#4-directory-structure)
5. [Database Schema](#5-database-schema)
6. [User Roles & Permissions](#6-user-roles--permissions)
7. [Authentication & Security](#7-authentication--security)
8. [Feature Deep-Dives](#8-feature-deep-dives)
   - [Dashboard](#81-dashboard)
   - [Chat System](#82-chat-system)
   - [Task Management](#83-task-management)
   - [Attendance](#84-attendance)
   - [Leave Management](#85-leave-management)
   - [Resource Requests](#86-resource-requests)
   - [Staff Enrollment](#87-staff-enrollment)
   - [Profile Management & Approval Workflow](#88-profile-management--approval-workflow)
   - [Performance & Evaluations](#89-performance--evaluations)
   - [Reports & Analytics](#810-reports--analytics)
   - [Notifications & Announcements](#811-notifications--announcements)
   - [Settings](#812-settings)
9. [Real-Time Broadcasting](#9-real-time-broadcasting)
10. [All Routes Reference](#10-all-routes-reference)
11. [All Models Reference](#11-all-models-reference)
12. [All Controllers Reference](#12-all-controllers-reference)
13. [Frontend Component Library](#13-frontend-component-library)
14. [NPM Packages & Their Purpose](#14-npm-packages--their-purpose)
15. [Local Development Setup](#15-local-development-setup)
16. [Deployment Guide](#16-deployment-guide)
17. [Known Conventions & Patterns](#17-known-conventions--patterns)

---

## 1. What is This Platform?

The **Tech Staff Evaluation Platform** is a full-stack internal web application built for technology companies to manage their workforce. It replaces scattered spreadsheets, email threads, and disconnected tools with a single unified interface that serves both staff and management.

### For Staff Members
- View and update their personal profile (via an approval workflow)
- See assigned tasks and update their progress
- Chat with teammates in real-time (direct messages and group channels)
- Request leave and track approval status
- Submit resource/budget requests
- Track their own attendance records
- View their performance evaluations and leaderboard standing

### For HR / Management / Super Admins
- Full dashboard with company-wide KPIs
- Enroll, edit, and deactivate staff accounts
- Approve or reject profile change requests
- Create and assign tasks to any staff member
- Upload and manage attendance records
- Approve or reject leave requests and resource requests
- Access reports, department analytics, and progress reports
- Export data as PDF or CSV

---

## 2. Technology Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Backend | Laravel | 12.x | Server-side logic, routing, ORM, auth |
| Language (Backend) | PHP | 8.2+ | Backend runtime |
| Frontend | React | 19.x | Component-based UI |
| Language (Frontend) | TypeScript | 5.7+ | Type-safe JavaScript |
| Bridge | Inertia.js | 2.3+ | Connects Laravel & React without a REST API |
| Database | SQLite | — | Lightweight single-file database |
| Styling | Tailwind CSS | 4.x | Utility-first CSS framework |
| UI Components | Shadcn UI / Radix UI | — | Accessible, headless component primitives |
| Charts | Recharts | 3.x | Data visualization library |
| Build Tool | Vite | 7.x | Fast frontend bundler |
| Real-Time | Laravel Echo + Pusher | — | WebSocket-based live events |
| 2FA | Laravel Fortify | — | Two-factor authentication |
| Motion | Motion (Framer) | 12.x | Animations |
| Icons | Lucide React | 0.475+ | Icon library |
| Forms | React Hook Form | 7.x | Form state management |
| DnD | React DnD | 16.x | Drag-and-drop for task boards |

### How Inertia.js Works (The Bridge)
Traditional Laravel apps render Blade HTML templates on the server. Traditional React apps fetch data from a JSON API. Inertia.js eliminates the need for both: Laravel controllers return `Inertia::render('PageName', [...data...])` and the React page component receives that data directly as props — no API layer needed. Navigation feels like a SPA (no full page reloads) but the server still handles routing and authentication.

---

## 3. Architecture Overview

```
Browser (React + TypeScript)
        ↕  Inertia.js (XHR, no full reload)
Laravel Router (routes/web.php)
        ↕
Controllers (app/Http/Controllers/)
        ↕
Eloquent Models (app/Models/)
        ↕
SQLite Database (database/database.sqlite)

Real-Time Layer:
Controller → Laravel Event → Pusher/Reverb → Laravel Echo (frontend)
```

### Request Lifecycle
1. User clicks a link or submits a form in React.
2. Inertia intercepts the request and sends an XHR to Laravel.
3. Laravel authenticates the user via session middleware.
4. The matched controller method runs, queries models, transforms data.
5. Controller returns `Inertia::render('PageName', $data)`.
6. React receives the new props and re-renders the page component.
7. URL updates in the browser without a full page reload.

### Role-Based Dashboard Routing
The single `/dashboard` route renders **different React components** depending on the user's role:
- `superadmin`, `hr`, `management` → `AdminDashboardPage`
- `staff` → `DashboardPage`

---

## 4. Directory Structure

```
/
├── app/
│   ├── Events/
│   │   ├── MessageSent.php          # Broadcast: new/updated/deleted message
│   │   └── UserTyping.php           # Broadcast: typing indicator
│   ├── Http/
│   │   └── Controllers/
│   │       ├── AttendanceController.php
│   │       ├── ChatController.php
│   │       ├── Controller.php       # Base controller
│   │       ├── LeaveRequestController.php
│   │       ├── PageController.php   # Most page renders live here
│   │       ├── ProfileController.php # Profile change request workflow
│   │       ├── ReportController.php
│   │       ├── ResourceRequestController.php
│   │       ├── StaffEnrollmentController.php
│   │       ├── TaskController.php
│   │       └── Settings/
│   │           ├── PasswordController.php
│   │           ├── ProfileController.php
│   │           └── TwoFactorAuthenticationController.php
│   └── Models/
│       ├── AttendanceRecord.php
│       ├── Conversation.php
│       ├── ConversationParticipant.php
│       ├── LeaveRequest.php
│       ├── Message.php             # Uses SoftDeletes
│       ├── MessageReaction.php
│       ├── ProfileChangeRequest.php
│       ├── ResourceRequest.php
│       ├── ResourceRequestComment.php
│       ├── Task.php
│       ├── TaskComment.php
│       └── User.php
├── database/
│   ├── migrations/                 # All DB schema changes (chronological)
│   └── database.sqlite             # The actual database file
├── resources/
│   ├── css/                        # Global CSS entry point
│   └── js/
│       ├── app.tsx                 # Frontend entry point
│       ├── ssr.tsx                 # Server-side rendering entry
│       ├── Pages/                  # One React component per page/route
│       │   ├── Admin/              # Admin-only pages
│       │   ├── AdminDashboardPage.tsx
│       │   ├── AnnouncementsPage.tsx
│       │   ├── AttendancePage.tsx
│       │   ├── AttendanceUploadPage.tsx
│       │   ├── ChatPage.tsx
│       │   ├── DashboardPage.tsx
│       │   ├── DepartmentAnalyticsPage.tsx
│       │   ├── EvaluationPage.tsx
│       │   ├── LeaderboardPage.tsx
│       │   ├── LeaveManagementPage.tsx
│       │   ├── LoginPage.tsx
│       │   ├── NotificationsPage.tsx
│       │   ├── PeerReviewPage.tsx
│       │   ├── PerformanceReviewPage.tsx
│       │   ├── ProfilePage.tsx
│       │   ├── ProgressReportPage.tsx
│       │   ├── ProjectsPage.tsx
│       │   ├── ReportsPage.tsx
│       │   ├── RequestsPage.tsx
│       │   ├── ResultsOverviewPage.tsx
│       │   ├── SettingsPage.tsx
│       │   ├── StaffEnrollmentPage.tsx
│       │   ├── StaffOverviewPage.tsx
│       │   └── TasksPage.tsx
│       ├── components/             # Reusable UI pieces
│       │   ├── chat/               # Chat-specific sub-components
│       │   ├── ui/                 # Shadcn UI primitives
│       │   ├── Sidebar.tsx
│       │   ├── TopBar.tsx
│       │   ├── SmartInsights.tsx
│       │   ├── BadgesDisplay.tsx
│       │   ├── DepartmentSpotlight.tsx
│       │   └── ...
│       ├── layouts/                # Page layout wrappers
│       ├── hooks/                  # Custom React hooks
│       ├── lib/                    # Utility functions
│       ├── types/                  # TypeScript type definitions
│       └── wayfinder/              # Auto-generated route helpers
├── routes/
│   ├── web.php                     # All application routes
│   ├── settings.php                # Settings-specific routes
│   ├── channels.php                # WebSocket channel authorization
│   └── console.php                 # Artisan commands
├── config/                         # Laravel config files
├── public/                         # Publicly accessible files
│   └── storage/                    # Symlinked storage (chat attachments)
├── storage/
│   └── app/public/chat-attachments/ # Uploaded chat files
├── vite.config.ts                  # Vite + Laravel plugin config
├── composer.json                   # PHP dependencies
└── package.json                    # Node.js dependencies
```

---

## 5. Database Schema

### `users`
| Column | Type | Notes |
|---|---|---|
| id | bigint PK | Auto-increment |
| employee_id | string | Unique (e.g. EMP001), used for login |
| name | string | Full name |
| email | string | Unique |
| email_verified_at | timestamp | Null until verified |
| password | string | Bcrypt hashed |
| phone | string | Nullable |
| location | string | Nullable |
| department | string | Nullable |
| position | string | Nullable |
| role | string | `staff`, `management`, `hr`, `superadmin` |
| status | string | `active`, `inactive`, `pending` |
| two_factor_secret | text | Nullable (Fortify 2FA) |
| two_factor_recovery_codes | text | Nullable (Fortify 2FA) |
| two_factor_confirmed_at | timestamp | Nullable |
| remember_token | string | Laravel remember-me |
| created_at / updated_at | timestamp | — |

### `conversations`
| Column | Type | Notes |
|---|---|---|
| id | bigint PK | — |
| type | enum | `direct`, `group` |
| name | string | Nullable (group name) |
| department | string | Nullable (department-specific chat) |
| is_read_only | boolean | Only admins can post |
| is_global | boolean | All users can see |
| created_at / updated_at | timestamp | — |

### `conversation_participants` (pivot)
| Column | Type | Notes |
|---|---|---|
| conversation_id | FK | → conversations |
| user_id | FK | → users |
| last_read_at | timestamp | For unread count calculation |
| created_at / updated_at | timestamp | — |

### `messages`
| Column | Type | Notes |
|---|---|---|
| id | bigint PK | — |
| conversation_id | FK | → conversations |
| user_id | FK | → users (sender) |
| content | text | Message text |
| attachment_path | string | Nullable, stored in `public/chat-attachments` |
| attachment_name | string | Original filename |
| attachment_type | string | `image`, `video`, `audio`, `document` |
| attachment_size | bigint | File size in bytes |
| is_edited | boolean | Default false |
| edited_at | timestamp | Nullable |
| deleted_at | timestamp | SoftDeletes |
| created_at / updated_at | timestamp | — |

### `message_reactions`
| Column | Type | Notes |
|---|---|---|
| id | bigint PK | — |
| message_id | FK | → messages |
| user_id | FK | → users |
| emoji | string | Emoji character (max 10 chars) |
| created_at / updated_at | timestamp | — |

### `tasks`
| Column | Type | Notes |
|---|---|---|
| id | bigint PK | — |
| title | string | — |
| assigned_to_user_id | FK | → users |
| assigned_by_user_id | FK | → users |
| priority | string | `low`, `medium`, `high` |
| due_date | date | — |
| status | string | `todo`, `in-progress`, `blocked`, `completed` |
| progress | integer | 0–100 |
| description | text | Nullable |
| department | string | Nullable |
| project | string | Nullable |
| subtasks | json | Array of subtask objects |
| tags | json | Array of tag strings |
| attachments | json | Array of attachment objects |
| created_at / updated_at | timestamp | — |

### `task_comments`
| Column | Type | Notes |
|---|---|---|
| id | bigint PK | — |
| task_id | FK | → tasks |
| user_id | FK | → users |
| text | text | Comment body |
| created_at / updated_at | timestamp | — |

### `attendance_records`
| Column | Type | Notes |
|---|---|---|
| id | bigint PK | — |
| user_id | FK | → users |
| date | date | — |
| clock_in_at | datetime | Nullable |
| clock_out_at | datetime | Nullable |
| total_hours | decimal(8,2) | Nullable |
| status | string | `present`, `late`, `absent` |
| notes | text | Nullable |
| created_at / updated_at | timestamp | — |

### `leave_requests`
| Column | Type | Notes |
|---|---|---|
| id | bigint PK | — |
| user_id | FK | → users (requester) |
| reviewed_by_user_id | FK | Nullable → users (HR reviewer) |
| type | string | Leave type (Annual, Sick, etc.) |
| start_date | date | — |
| end_date | date | — |
| days | integer | Number of days requested |
| reason | text | Staff-provided reason |
| status | string | `pending`, `approved`, `rejected` |
| hr_comment | text | Nullable reviewer comment |
| reviewed_at | datetime | Nullable |
| created_at / updated_at | timestamp | — |

### `resource_requests`
| Column | Type | Notes |
|---|---|---|
| id | bigint PK | — |
| user_id | FK | → users (requester) |
| reviewed_by_user_id | FK | Nullable → users |
| type | string | Request type |
| title | string | Short title |
| description | text | Details |
| amount | decimal(10,2) | Budget amount |
| project | string | Nullable, related project |
| status | string | `pending`, `approved`, `rejected` |
| tagged_person | string | Nullable |
| attachments | json | Array of file paths |
| receipts | json | Array of receipt file paths |
| reviewed_at | datetime | Nullable |
| created_at / updated_at | timestamp | — |

### `resource_request_comments`
| Column | Type | Notes |
|---|---|---|
| id | bigint PK | — |
| resource_request_id | FK | → resource_requests |
| user_id | FK | → users |
| (comment body) | text | — |
| created_at / updated_at | timestamp | — |

### `profile_change_requests`
| Column | Type | Notes |
|---|---|---|
| id | bigint PK | — |
| user_id | FK | → users |
| status | string | `pending`, `approved`, `rejected` |
| (requested fields) | various | Fields the user wants to change |
| created_at / updated_at | timestamp | — |

---

## 6. User Roles & Permissions

The platform has four roles, stored as a string in `users.role`:

| Role | Value | Access Level |
|---|---|---|
| Staff | `staff` | Own data only: tasks assigned to them, own attendance, own leave/requests, own profile |
| Management | `management` | Same as admin for most features — can create/assign tasks, view all data, approve requests |
| HR | `hr` | Full admin access + staff enrollment + profile request approvals |
| Super Admin | `superadmin` | Unrestricted access to all features and data |

### Role Checking Pattern (Backend)
```php
// PageController — dashboard route redirects based on role
if (in_array($role, ['superadmin', 'hr', 'management'])) {
    return Inertia::render('AdminDashboardPage');
}

// TaskController — determines what tasks are visible
private function isManager(User $user): bool {
    return in_array($user->role, ['management', 'superadmin', 'hr'], true);
}

// ChatController — determines conversation access
private function isAdmin(User $user): bool {
    return in_array($user->role, ['superadmin', 'hr', 'management'], true);
}
```

### Role Checking Pattern (Frontend)
The `userRole` prop is passed from the controller to the React page, and conditional rendering is used:
```tsx
{userRole !== 'staff' && <AdminOnlyComponent />}
```

---

## 7. Authentication & Security

### Login
- Users log in with their **Employee ID** (e.g., `EMP001`) and password, not with email.
- Standard Laravel session-based authentication.
- All routes except `/login` and `/logout` are behind the `auth` middleware.

### Email Verification
- The `User` model implements `MustVerifyEmail`.
- Some sensitive routes require the `verified` middleware (e.g., password change, 2FA settings, profile deletion).

### Two-Factor Authentication (2FA)
- Powered by **Laravel Fortify** (`TwoFactorAuthenticatable` trait on User).
- Users can enable TOTP-based 2FA from their settings.
- Recovery codes are generated and stored (hashed) on the user record.
- Managed via `Settings/TwoFactorAuthenticationController.php` and the `TwoFactorSetupModal` component.

### CSRF Protection
- All Laravel form submissions include CSRF token automatically via Inertia.

### Profile Change Request Security
- Staff **cannot directly update** their own profile fields in the database.
- They submit a change request → stored in `profile_change_requests` with `status = pending`.
- An HR/Admin must explicitly approve before the `users` table is updated.

### Password Security
- Passwords are hashed with Bcrypt (`'password' => 'hashed'` cast on User model).
- Password change is rate-limited to 6 attempts per minute (`throttle:6,1`).

---

## 8. Feature Deep-Dives

### 8.1 Dashboard

**Route:** `GET /dashboard`  
**Controller:** `PageController@dashboard`  
**Pages:** `AdminDashboardPage.tsx`, `DashboardPage.tsx`

The dashboard is role-adaptive:
- **Staff dashboard** (`DashboardPage`): Personal overview — their tasks, attendance summary, recent notifications, leaderboard position.
- **Admin dashboard** (`AdminDashboardPage`): Company-wide KPIs — total staff, active projects, department performance, recent activity feed, smart insights.

Key sub-components used on the admin dashboard:
- `SmartInsights.tsx` — AI-style insight cards
- `BadgesDisplay.tsx` — Achievement badges
- `DepartmentSpotlight.tsx` — Highlights a featured department

---

### 8.2 Chat System

**Route:** `GET /chat` (page), `GET|POST /api/chat/*` (data API)  
**Controller:** `ChatController.php`  
**Page:** `ChatPage.tsx`  
**Components:** `resources/js/components/chat/`

The chat system is the most complex feature. Here's every capability:

#### Conversation Types
- **Direct Messages**: 1-on-1 conversations between any two users. Created automatically the first time two users message each other (`findOrCreateDirectConversation`).
- **Group Chats**: Named conversations with multiple participants, optionally tied to a department.
- **Global Channels**: `is_global = true` — all users can see them. Only admins can post to read-only global channels (`is_read_only = true`).

#### Message Features
- **Send messages** (up to 5,000 characters)
- **Edit messages** (author only) — sets `is_edited = true`, stores `edited_at`
- **Delete messages** — soft delete (SoftDeletes trait), sends a `deleted` broadcast action
- **File uploads** — up to 10MB per file, stored in `storage/app/public/chat-attachments/`, supports images, videos, audio, documents
- **Emoji reactions** — toggle reaction on/off per user per emoji
- **Message search** — full-text search within a conversation (min 2 chars, max 50 results)

#### Real-Time Features (WebSockets)
- **Live messages**: When a message is sent, edited, or deleted, `MessageSent` event fires and broadcasts on the private channel `chat.conversation.{id}`.
- **Typing indicators**: `UserTyping` event broadcasts on the same channel when a user is actively typing. Frontend fires this via `POST /api/chat/conversations/{id}/typing`.
- **Unread counts**: Tracked via `conversation_participants.last_read_at`. Unread = messages after `last_read_at`.

#### Access Control
- Staff see only global conversations + conversations they are participants of.
- Admins (`superadmin`, `hr`, `management`) can see all conversations.
- Read-only conversations: only admins can post.

#### Chat API Endpoints
```
GET    /api/chat/conversations                            # List conversations
GET    /api/chat/conversations/{id}/messages             # Get messages
POST   /api/chat/conversations/{id}/messages             # Send message
GET    /api/chat/direct-messages                         # Get all DM contacts
POST   /api/chat/conversations                           # Create group conversation
POST   /api/chat/messages/{id}/reactions                 # Toggle emoji reaction
PUT    /api/chat/messages/{id}                           # Edit message
DELETE /api/chat/messages/{id}                           # Delete message
POST   /api/chat/conversations/{id}/typing               # Trigger typing indicator
GET    /api/chat/conversations/{id}/search?query=...     # Search messages
POST   /api/chat/conversations/{id}/upload               # Upload file
```

---

### 8.3 Task Management

**Route:** `GET|POST /tasks`, `PUT /tasks/{task}`, `PATCH /tasks/{task}/status`, `DELETE /tasks/{task}`, `POST /tasks/{task}/comments`  
**Controller:** `TaskController.php`  
**Page:** `TasksPage.tsx`

#### Task Fields
- Title, description, priority (`low`/`medium`/`high`), due date
- Status: `todo` → `in-progress` → `blocked` → `completed`
- Progress: 0–100% (auto-set to 100 when status = `completed`)
- Department, project grouping
- Subtasks (JSON array), tags (JSON array), attachments (JSON array)

#### Access Control
- **Staff**: Can only see tasks assigned to them or created by them. Can update status/progress on their own assigned tasks. Cannot reassign.
- **Managers** (`management`, `hr`, `superadmin`): Can see all tasks, assign to any staff member, update or delete any task.

#### Task Comments
Any user with access to a task can add comments. Comments load with author name and relative timestamp.

---

### 8.4 Attendance

**Routes:** `GET /attendance`, `GET /attendance-upload`  
**Controller:** `AttendanceController.php`  
**Pages:** `AttendancePage.tsx`, `AttendanceUploadPage.tsx`

#### Staff View
- Shows their own attendance records filtered by month.
- Summary stats: present days, late days, absent days, total hours, total days recorded.
- Month selector populated from months that have actual records.

#### Admin Upload
- Admins use `AttendanceUploadPage` to bulk-upload attendance data for staff.
- Records support: `present`, `late`, `absent` statuses, clock-in/clock-out times, total hours, notes.

---

### 8.5 Leave Management

**Routes:** `GET /leave`, `POST /leave`, `PATCH /leave/{leaveRequest}/status`  
**Controller:** `LeaveRequestController.php`  
**Page:** `LeaveManagementPage.tsx`

#### Staff Flow
1. Staff submits a leave request with: type, start date, end date, number of days, reason.
2. Request is saved with `status = pending`.
3. Staff can see all their past requests and current status.

#### Admin/HR Flow
1. HR/Admin sees all pending requests across all staff.
2. Can approve (`status = approved`) or reject (`status = rejected`) with an optional HR comment.
3. `reviewed_by_user_id` and `reviewed_at` are recorded.

---

### 8.6 Resource Requests

**Routes:** `GET /requests`, `POST /requests`, `POST /requests/{id}/comments`, `PATCH /requests/{id}/status`  
**Controller:** `ResourceRequestController.php`  
**Page:** `RequestsPage.tsx`

The resource request system handles budget/tool/equipment requests from staff:
- Staff submits a request with: type, title, description, amount, project, tagged person, attachments, receipts.
- Request goes through `pending` → `approved` / `rejected` workflow.
- Both staff and reviewers can add threaded comments.

---

### 8.7 Staff Enrollment

**Routes:** `GET /staff-enrollment`, `POST /staff-enrollment`, `PUT /staff-enrollment/{user}`, `PATCH /staff-enrollment/{user}/status`, `DELETE /staff-enrollment/{user}`  
**Controller:** `StaffEnrollmentController.php`  
**Page:** `StaffEnrollmentPage.tsx`

Accessible only by `superadmin` and `hr` roles.

#### Departments (Hardcoded List)
Video & Production, Project Management, Product Team, Content & Brand Comms, Interns, Incubator Team, Skillup Team, DAF Team, Graphics Design, Accounting, Business Development

#### Positions (Hardcoded List)
Video Editor, Producer, Project Manager, Product Manager, Content Writer, Brand Manager, Intern, Tech Trainer, Programs Coordinator, Graphic Designer, Accountant, Business Developer

#### Operations
- **Create**: Enroll a new staff member with Employee ID, name, email, password, department, position, role. Email is auto-verified on creation.
- **Update**: Edit any staff member's details except password.
- **Toggle Status**: Switch between `active` and `inactive`.
- **Delete**: Remove a staff member (cannot delete yourself).

---

### 8.8 Profile Management & Approval Workflow

**Routes:** `POST /profile/update`, `GET /admin/profile-requests`, `POST /admin/profile-requests/{id}/approve`, `POST /admin/profile-requests/{id}/reject`  
**Controller:** `ProfileController.php` (in `app/Http/Controllers/`, not Settings)  
**Page:** `ProfilePage.tsx`, `Admin/ProfileRequests` (Inertia page)

This is a secure, auditable update workflow:
1. Staff visits `/profile` and sees their current information + any pending request.
2. They fill out a change request form (name, email, phone, etc.).
3. `POST /profile/update` stores the request in `profile_change_requests` with `status = pending`.
4. Only one pending request allowed per user at a time.
5. HR Admin visits `/admin/profile-requests` to see all pending requests.
6. Approve → the user's actual record in `users` is updated.
7. Reject → request marked rejected, user's record unchanged.

#### Settings Profile (Different)
`settings/profile` (handled by `Settings/ProfileController`) is a separate, lower-stakes profile edit for things like name/email that doesn't go through the approval workflow. This is a Laravel starter kit default.

---

### 8.9 Performance & Evaluations

**Routes:** `GET /evaluation`, `GET /performance-review`, `GET /peer-review`, `GET /results`, `GET /leaderboard`  
**Controller:** `PageController.php`  
**Pages:** `EvaluationPage.tsx`, `PerformanceReviewPage.tsx`, `PeerReviewPage.tsx`, `ResultsOverviewPage.tsx`, `LeaderboardPage.tsx`

These pages form the core "evaluation" side of the platform:
- **Evaluation**: Staff self-evaluation or manager evaluation form.
- **Performance Review**: Manager-led formal performance review.
- **Peer Review**: 360-degree feedback from colleagues.
- **Results Overview**: Compiled results from evaluations.
- **Leaderboard**: Rankings of staff based on performance scores, points, or evaluation results. Visualized with charts.

---

### 8.10 Reports & Analytics

**Routes:** `GET /reports`, `GET /department-analytics`, `GET /staff-overview`, `GET /progress-report`, `GET /projects`  
**Export Routes:** `GET /reports/export-pdf`, `GET /reports/export-csv`, `GET /reports/progress/export-pdf`, `GET /reports/progress/export-csv`  
**Controller:** `ReportController.php`, `PageController.php`  
**Pages:** `ReportsPage.tsx`, `DepartmentAnalyticsPage.tsx`, `StaffOverviewPage.tsx`, `ProgressReportPage.tsx`, `ProjectsPage.tsx`

- **Reports**: Company-wide performance and KPI report with charts. Exportable as PDF and CSV.
- **Department Analytics**: Drill-down analytics per department.
- **Staff Overview**: Bird's-eye view of all staff with their status, department, and performance.
- **Progress Report**: Project/task progress tracking. Exportable.
- **Projects**: Visual project tracking page.

Charts are built with **Recharts**. Export functionality is handled server-side by `ReportController`.

---

### 8.11 Notifications & Announcements

**Routes:** `GET /notifications`, `GET /announcements`  
**Controller:** `PageController.php`  
**Pages:** `NotificationsPage.tsx`, `AnnouncementsPage.tsx`

- **Notifications**: In-app notification center for the logged-in user.
- **Announcements**: Company-wide announcements, typically posted via a global read-only chat channel or a dedicated admin tool.

---

### 8.12 Settings

**Routes:** `GET /settings-overview`, `settings/profile`, `settings/password`, `settings/appearance`, `settings/two-factor`  
**Controllers:** `Settings/ProfileController`, `Settings/PasswordController`, `Settings/TwoFactorAuthenticationController`  
**Pages:** `SettingsPage.tsx`, `settings/appearance`

- **Profile Settings**: Edit name and email (direct update, no approval required — separate from the HR-approved profile workflow).
- **Password**: Change password (rate-limited, requires `verified` middleware).
- **Appearance**: Light/dark mode toggle (uses `next-themes`).
- **Two-Factor Auth**: Enable/disable TOTP 2FA, view recovery codes. Handled by Fortify.

---

## 9. Real-Time Broadcasting

The platform uses **Laravel Broadcasting** with **Pusher** (or a Pusher-compatible driver like Reverb) and **Laravel Echo** on the frontend.

### Events

#### `MessageSent` (`App\Events\MessageSent`)
- Implements `ShouldBroadcastNow` (synchronous, no queue)
- Broadcasts on: `PrivateChannel('chat.conversation.{conversationId}')`
- Broadcast name: `chat.message`
- Payload:
  ```json
  {
    "conversationId": 1,
    "action": "created" | "updated" | "deleted" | "reactions",
    "message": { ...serialized message object... },
    "actorUserId": 42
  }
  ```

#### `UserTyping` (`App\Events\UserTyping`)
- Implements `ShouldBroadcastNow`
- Broadcasts on: `PrivateChannel('chat.conversation.{conversationId}')`
- Broadcast name: `chat.typing`
- Payload:
  ```json
  {
    "conversationId": 1,
    "userId": 42,
    "userName": "John Doe"
  }
  ```

### Channel Authorization
Channel authorization is defined in `routes/channels.php`. Private channels verify the authenticated user has access to the conversation before allowing them to subscribe.

### Frontend Subscription
Laravel Echo subscribes to the private channel and listens for `chat.message` and `chat.typing` events. The React state is updated directly from the broadcast payload to show live messages and typing indicators without polling.

---

## 10. All Routes Reference

### Public Routes
| Method | URL | Name | Description |
|---|---|---|---|
| GET | / | home | Redirect to dashboard or login |
| POST | /logout | logout | Log out current user |

### Auth Routes (from Fortify/starter kit)
| Method | URL | Description |
|---|---|---|
| GET | /login | Login page |
| POST | /login | Submit login |
| GET | /register | Registration (if enabled) |

### Settings Routes (require `auth`)
| Method | URL | Name | Description |
|---|---|---|---|
| GET | /settings/profile | profile.edit | Edit basic profile |
| PATCH | /settings/profile | profile.update | Update basic profile |
| DELETE | /settings/profile | profile.destroy | Delete account (requires `verified`) |
| GET | /settings/password | user-password.edit | Password change form |
| PUT | /settings/password | user-password.update | Update password |
| GET | /settings/appearance | appearance.edit | Appearance settings |
| GET | /settings/two-factor | two-factor.show | 2FA settings |

### Application Routes (require `auth`)
| Method | URL | Name | Description |
|---|---|---|---|
| GET | /dashboard | dashboard | Role-based dashboard |
| GET | /evaluation | evaluation | Evaluation page |
| GET | /tasks | tasks | Task list |
| POST | /tasks | tasks.store | Create task |
| PUT | /tasks/{task} | tasks.update | Update task |
| PATCH | /tasks/{task}/status | tasks.status | Update task status |
| POST | /tasks/{task}/comments | tasks.comments.store | Add comment |
| DELETE | /tasks/{task} | tasks.destroy | Delete task |
| GET | /chat | chat | Chat page |
| GET | /attendance-upload | attendance-upload | Upload attendance |
| GET | /results | results | Results overview |
| GET | /leaderboard | leaderboard | Leaderboard |
| GET | /profile | profile | Profile page |
| GET | /leave | leave | Leave requests |
| POST | /leave | leave.store | Submit leave request |
| PATCH | /leave/{leaveRequest}/status | leave.status | Approve/reject leave |
| GET | /notifications | notifications | Notifications |
| GET | /announcements | announcements | Announcements |
| GET | /performance-review | performance-review | Performance review |
| GET | /peer-review | peer-review | Peer review |
| GET | /reports | reports | Reports |
| GET | /department-analytics | department-analytics | Department analytics |
| GET | /staff-overview | staff-overview | Staff overview |
| GET | /progress-report | progress-report | Progress report |
| GET | /projects | projects | Projects |
| GET | /requests | requests | Resource requests |
| POST | /requests | requests.store | Create resource request |
| POST | /requests/{id}/comments | requests.comments.store | Add comment |
| PATCH | /requests/{id}/status | requests.status | Update request status |
| GET | /attendance | attendance | Attendance records |
| GET | /staff-enrollment | staff-enrollment | Staff enrollment |
| POST | /staff-enrollment | staff-enrollment.store | Enroll staff |
| PUT | /staff-enrollment/{user} | staff-enrollment.update | Edit staff |
| PATCH | /staff-enrollment/{user}/status | staff-enrollment.toggle-status | Toggle status |
| DELETE | /staff-enrollment/{user} | staff-enrollment.destroy | Remove staff |
| GET | /settings-overview | settings-overview | Settings overview |

### Chat API Routes (require `auth`)
| Method | URL | Description |
|---|---|---|
| GET | /api/chat/conversations | List conversations |
| GET | /api/chat/conversations/{id}/messages | Get messages |
| POST | /api/chat/conversations/{id}/messages | Send message |
| GET | /api/chat/direct-messages | Get DM contacts |
| POST | /api/chat/conversations | Create conversation |
| POST | /api/chat/messages/{id}/reactions | Toggle reaction |
| PUT | /api/chat/messages/{id} | Edit message |
| DELETE | /api/chat/messages/{id} | Delete message |
| POST | /api/chat/conversations/{id}/typing | Typing indicator |
| GET | /api/chat/conversations/{id}/search | Search messages |
| POST | /api/chat/conversations/{id}/upload | Upload file |

### Report Export Routes (require `auth`)
| Method | URL | Name | Description |
|---|---|---|---|
| GET | /reports/export-pdf | reports.export-pdf | Export main report as PDF |
| GET | /reports/export-csv | reports.export-csv | Export main report as CSV |
| GET | /reports/progress/export-pdf | reports.progress.export-pdf | Export progress as PDF |
| GET | /reports/progress/export-csv | reports.progress.export-csv | Export progress as CSV |

### Profile Change Request Routes (require `auth`)
| Method | URL | Name | Description |
|---|---|---|---|
| POST | /profile/update | profile.request-update | Submit profile change request |
| GET | /admin/profile-requests | admin.profile-requests | List pending requests (HR only) |
| POST | /admin/profile-requests/{id}/approve | admin.profile-requests.approve | Approve request |
| POST | /admin/profile-requests/{id}/reject | admin.profile-requests.reject | Reject request |

---

## 11. All Models Reference

### `User`
- **Traits**: `HasFactory`, `Notifiable`, `TwoFactorAuthenticatable`
- **Implements**: `MustVerifyEmail`
- **Relations**: `assignedTasks()`, `createdTasks()`, `taskComments()`, `attendanceRecords()`, `resourceRequests()`, `reviewedResourceRequests()`, `resourceRequestComments()`, `leaveRequests()`, `reviewedLeaveRequests()`
- **Hidden fields**: `password`, `two_factor_secret`, `two_factor_recovery_codes`, `remember_token`

### `Conversation`
- **Relations**: `messages()` (ordered ASC), `participants()` (BelongsToMany with `last_read_at` pivot), `latestMessage()` (hasOne, latest)
- **Method**: `getUnreadCountForUser($userId)` — counts messages after `last_read_at`

### `Message`
- **Traits**: `SoftDeletes`
- **Relations**: `conversation()`, `user()`, `reactions()`
- **Key fields**: `attachment_path`, `attachment_name`, `attachment_type`, `attachment_size`, `is_edited`, `edited_at`

### `MessageReaction`
- Pivot-style model linking `messages` ↔ `users` via `emoji`

### `Task`
- **Relations**: `assignedTo()`, `assignedBy()`, `comments()` (ordered latest)
- **JSON casts**: `subtasks`, `tags`, `attachments`

### `TaskComment`
- **Relations**: `task()`, `user()`

### `AttendanceRecord`
- **Relations**: `user()`
- **Casts**: `date` (date), `clock_in_at`/`clock_out_at` (datetime), `total_hours` (decimal:2)

### `LeaveRequest`
- **Relations**: `user()`, `reviewer()` (BelongsTo via `reviewed_by_user_id`)

### `ResourceRequest`
- **Relations**: `user()`, `reviewer()`, `comments()`
- **JSON casts**: `attachments`, `receipts`

### `ResourceRequestComment`
- **Relations**: `resourceRequest()`, `user()`

### `ProfileChangeRequest`
- **Relations**: `user()`
- Tracks pending/approved/rejected profile edits before they hit `users`

---

## 12. All Controllers Reference

### `PageController`
Thin controller that mainly renders Inertia pages. Handles role-based dashboard redirect. Passes `user` and `pendingRequest` to ProfilePage.

### `ChatController`
The most complex controller. Manages:
- Conversation listing with unread counts
- Message retrieval with reaction serialization
- Message CRUD (send, edit, delete)
- Direct message creation (auto-creates conversations)
- File uploads (stored in `public/chat-attachments`)
- Emoji reactions (toggle)
- Typing indicator broadcast
- Message search
- Access control helpers: `isAdmin()`, `userHasAccessToConversation()`

### `TaskController`
- Full CRUD for tasks
- Role-based filtering (staff vs manager)
- Comment management
- Status/progress updates with auto-complete logic

### `StaffEnrollmentController`
- CRUD for user accounts (admin-only, enforced via `authorizeAdmin()`)
- Hardcoded department and position lists for dropdown validation
- Status toggle (active/inactive)

### `AttendanceController`
- Fetches attendance records for logged-in user
- Month filtering with dynamic month options
- Computes summary stats (present, late, absent, total hours)

### `LeaveRequestController`
- Staff: submit leave request, view their own
- HR/Admin: view all, approve/reject with comment

### `ResourceRequestController`
- Staff: submit requests, add comments
- HR/Admin: approve/reject, add comments

### `ReportController`
- Renders reports page with aggregated data
- PDF and CSV export endpoints for main reports and progress reports

### `ProfileController` (`app/Http/Controllers/`)
- `submitRequest()`: Creates a `ProfileChangeRequest` record
- `adminIndex()`: Lists pending requests (HR/superadmin only)
- `approveRequest()`: Applies the change to `users`, marks request approved
- `rejectRequest()`: Marks request rejected

### `Settings/ProfileController`
Standard Laravel profile settings (name, email update, account deletion). Independent of the HR-approved profile workflow.

### `Settings/PasswordController`
Standard password change with `current_password` verification.

### `Settings/TwoFactorAuthenticationController`
Shows 2FA settings page. Fortify handles the enable/disable/confirm flows.

---

## 13. Frontend Component Library

### Layout Components
- `Sidebar.tsx` — Main navigation sidebar with role-aware menu items
- `TopBar.tsx` — Top navigation bar with user menu and notifications
- `app-shell.tsx` / `app-sidebar.tsx` — Layout wrappers

### Dashboard-Specific
- `SmartInsights.tsx` — Insight cards for admin dashboard
- `BadgesDisplay.tsx` — Staff achievement badges
- `DepartmentSpotlight.tsx` — Featured department card

### Chat Components (`components/chat/`)
- Full chat interface sub-components: message list, input, reaction picker, file upload, typing indicator, conversation list

### UI Primitives (`components/ui/`)
Full Shadcn UI component set including: Button, Card, Dialog, Dropdown, Input, Label, Select, Table, Tabs, Toast (Sonner), Tooltip, Badge, Avatar, Progress, Skeleton, Sheet, Separator, Switch, Slider, and more.

### Utility Components
- `two-factor-setup-modal.tsx` — 2FA enable/disable modal
- `two-factor-recovery-codes.tsx` — Recovery code display
- `appearance-dropdown.tsx` / `appearance-tabs.tsx` — Theme switcher (uses `next-themes`)
- `dialog.tsx`, `skeleton.tsx`, `tooltip.tsx` — General-purpose UI primitives

---

## 14. NPM Packages & Their Purpose

| Package | Purpose |
|---|---|
| `react` / `react-dom` | UI framework |
| `@inertiajs/react` | Inertia.js adapter for React |
| `typescript` | Type checking |
| `tailwindcss` | Utility CSS |
| `@radix-ui/*` | Headless accessible UI primitives (Shadcn base) |
| `lucide-react` | Icon set |
| `recharts` | Chart library (bar, line, pie charts) |
| `react-hook-form` | Form state and validation |
| `react-dnd` + `react-dnd-html5-backend` | Drag and drop (task board) |
| `motion` | Animations |
| `next-themes` | Dark/light mode |
| `sonner` | Toast notifications |
| `laravel-echo` | WebSocket client |
| `pusher-js` | Pusher WebSocket driver |
| `date-fns` | Date formatting/manipulation |
| `react-day-picker` | Calendar/date picker UI |
| `clsx` + `tailwind-merge` | Class name utilities |
| `class-variance-authority` | Component variant system (Shadcn) |
| `cmdk` | Command menu (⌘K) |
| `vaul` | Drawer component |
| `embla-carousel-react` | Carousel |
| `react-resizable-panels` | Resizable panel layouts |
| `input-otp` | OTP input for 2FA |
| `concurrently` | Run multiple npm scripts in parallel |
| `vite` | Build tool |
| `@vitejs/plugin-react` | React support in Vite |
| `@tailwindcss/vite` | Tailwind CSS v4 Vite plugin |
| `@laravel/vite-plugin-wayfinder` | Generates typed route helpers from Laravel routes |

---

## 15. Local Development Setup

### Prerequisites
- PHP 8.2+
- Composer
- Node.js 18+ and NPM
- SQLite (usually included with PHP)

### Step-by-Step

```bash
# 1. Install PHP dependencies
composer install

# 2. Install Node dependencies
npm install

# 3. Set up environment
cp .env.example .env
php artisan key:generate

# 4. Create the database file
touch database/database.sqlite

# 5. Run migrations and seed test data
php artisan migrate --seed

# 6. Create storage symlink (for file uploads)
php artisan storage:link

# 7. Run both servers (in separate terminals, or use the npm script)
php artisan serve         # Terminal 1 → http://localhost:8000
npm run dev               # Terminal 2 → Vite dev server

# Or use the combined script:
npm run serve             # Runs both with concurrently (port 8001)
```

### Default Test Accounts (from seeder)
After running `php artisan migrate --seed`, test accounts are available. Check `database/seeders/` for specific Employee IDs and passwords.

### Real-Time (Optional for local dev)
To test the chat's real-time features locally, set up Pusher credentials in `.env`:
```
PUSHER_APP_ID=your_app_id
PUSHER_APP_KEY=your_app_key
PUSHER_APP_SECRET=your_app_secret
PUSHER_APP_CLUSTER=mt1
BROADCAST_DRIVER=pusher
```
Alternatively, use [Laravel Reverb](https://reverb.laravel.com/) for a self-hosted WebSocket server.

---

## 16. Deployment Guide

Three deployment documents are provided in the project root:
- `DEPLOYMENT_GUIDE.md` — Detailed instructions for cPanel, VPS, and Cloud
- `QUICK_DEPLOY.md` — Fast comparison of hosting options
- `deploy.sh` — Shell script that packages the app for production

### General Production Checklist
1. Set `APP_ENV=production` and `APP_DEBUG=false` in `.env`
2. Set a strong `APP_KEY`
3. Run `npm run build` to compile frontend assets
4. Run `php artisan config:cache && php artisan route:cache && php artisan view:cache`
5. Ensure `storage/` and `bootstrap/cache/` are writable
6. Run `php artisan storage:link` for file upload access
7. Configure a real database (MySQL/PostgreSQL) for production instead of SQLite
8. Configure real Pusher credentials for WebSocket broadcasting
9. Set up a queue worker if using async broadcasting: `php artisan queue:work`
10. Configure a web server (Nginx/Apache) to point to the `public/` directory

---

## 17. Known Conventions & Patterns

### Inertia Page Props
Controllers pass data directly as the second argument to `Inertia::render()`. The React component receives this as typed props. The `userRole` prop is a common pattern passed to most pages for client-side role gating.

### Data Transformation in Controllers
Controllers transform Eloquent model data into plain arrays before passing to Inertia. This prevents accidental exposure of sensitive fields and ensures a stable frontend contract. See `TaskController::transformTask()` and `StaffEnrollmentController::transformUser()` for examples.

### Authorization Pattern
Most controllers use inline `abort(403)` checks rather than Laravel Policies. The `authorizeAdmin()` helper in `StaffEnrollmentController` is a typical example:
```php
private function authorizeAdmin(Request $request): void {
    if (!in_array($request->user()?->role, ['superadmin', 'hr'], true)) {
        abort(403, 'Unauthorized action.');
    }
}
```

### Route Names vs URLs
The Wayfinder package (`@laravel/vite-plugin-wayfinder`) auto-generates TypeScript helpers from Laravel route names. These live in `resources/js/wayfinder/` and allow type-safe route generation on the frontend instead of hardcoding URL strings.

### Flash Messages
Controllers use `back()->with('success', '...')` or `back()->with('error', '...')` for feedback. The Inertia shared props or a frontend listener picks these up and displays them as toast notifications via Sonner.

### File Storage
Uploaded chat files are stored in `storage/app/public/chat-attachments/` and accessed via the `public` disk. The `php artisan storage:link` command creates the symlink from `public/storage` → `storage/app/public`.

### TypeScript Strictness
The project uses strict TypeScript (`tsconfig.json`). ESLint is configured with `typescript-eslint`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, and `eslint-plugin-import`. Formatting is handled by Prettier with `prettier-plugin-tailwindcss` and `prettier-plugin-organize-imports`.
