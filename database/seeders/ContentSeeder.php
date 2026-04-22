<?php

namespace Database\Seeders;

use App\Models\ChecklistTemplate;
use App\Models\ContentCategory;
use App\Models\ContentPage;
use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\User;
use Illuminate\Database\Seeder;

class ContentSeeder extends Seeder
{
    public function run(): void
    {
        $adminUser = User::where('role', 'superadmin')->first()
            ?? User::where('role', 'hr')->first()
            ?? User::first();

        if (! $adminUser) {
            return;
        }

        // ─── Content Categories ──────────────────────────────────────────────

        $categories = [
            ['name' => 'Employee Handbook',       'slug' => 'employee-handbook',    'sort_order' => 1],
            ['name' => 'Leave Policy',             'slug' => 'leave-policy',         'sort_order' => 2],
            ['name' => 'Payroll & Benefits',       'slug' => 'payroll-benefits',     'sort_order' => 3],
            ['name' => 'Code of Conduct',          'slug' => 'code-of-conduct',      'sort_order' => 4],
            ['name' => 'Ethics & Whistleblowing',  'slug' => 'ethics-whistleblowing','sort_order' => 5],
            ['name' => 'Data Privacy & Security',  'slug' => 'data-privacy',         'sort_order' => 6],
            ['name' => 'IT Setup',                 'slug' => 'it-setup',             'sort_order' => 7],
            ['name' => 'HR Essentials',            'slug' => 'hr-essentials',        'sort_order' => 8],
            // Knowledge Repository
            ['name' => 'SOPs',                     'slug' => 'sops',                 'sort_order' => 9],
            ['name' => 'Templates',                'slug' => 'templates',            'sort_order' => 10],
            ['name' => 'Business Tools',           'slug' => 'business-tools',       'sort_order' => 11],
            ['name' => 'IT Self-Service',          'slug' => 'it-self-service',      'sort_order' => 12],
        ];

        $categoryModels = [];
        foreach ($categories as $cat) {
            $categoryModels[$cat['slug']] = ContentCategory::firstOrCreate(
                ['slug' => $cat['slug']],
                ['name' => $cat['name'], 'sort_order' => $cat['sort_order']]
            );
        }

        // ─── Content Pages ───────────────────────────────────────────────────

        $pages = [
            // Employee Handbook
            [
                'title' => 'Employee Handbook — Welcome & Overview',
                'slug' => 'employee-handbook-welcome',
                'category' => 'employee-handbook',
                'requires_acknowledgement' => false,
                'body' => '<h2>Welcome to the Team</h2><p>This handbook contains everything you need to know about working here — from our values and culture to day-to-day policies. Please read it carefully and reach out to HR with any questions.</p><h3>Our Mission</h3><p>We are committed to creating an environment where every team member can thrive, grow, and contribute meaningfully to our shared goals.</p><h3>Core Values</h3><ul><li><strong>Integrity</strong> — We do what we say and say what we mean.</li><li><strong>Excellence</strong> — We hold ourselves to high standards in everything we do.</li><li><strong>Collaboration</strong> — We achieve more together than alone.</li><li><strong>Innovation</strong> — We embrace new ideas and continuous improvement.</li></ul>',
            ],
            // Leave Policy
            [
                'title' => 'Annual Leave & Absence Policy',
                'slug' => 'annual-leave-policy',
                'category' => 'leave-policy',
                'requires_acknowledgement' => false,
                'body' => '<h2>Annual Leave Entitlement</h2><p>All full-time employees are entitled to <strong>20 working days</strong> of annual leave per calendar year, pro-rated for part-time employees.</p><h3>How to Apply</h3><p>Submit all leave requests through the HR platform at least <strong>5 working days</strong> in advance. Emergency leave must be communicated to your line manager as soon as possible.</p><h3>Leave Categories</h3><ul><li>Annual Leave</li><li>Sick Leave (up to 10 days with medical certificate)</li><li>Maternity / Paternity Leave</li><li>Compassionate Leave (up to 3 days)</li></ul><p>All leave types are subject to management approval.</p>',
            ],
            // Payroll & Benefits
            [
                'title' => 'Payroll Schedule & Benefits Overview',
                'slug' => 'payroll-benefits-overview',
                'category' => 'payroll-benefits',
                'requires_acknowledgement' => false,
                'body' => '<h2>Payroll</h2><p>Salaries are processed on the <strong>last working day of each month</strong>. Ensure your bank details are up to date in the HR system to avoid delays.</p><h3>Benefits</h3><ul><li><strong>Health Insurance</strong> — Company-sponsored HMO plan for all confirmed employees.</li><li><strong>Performance Bonus</strong> — Discretionary bonus based on quarterly evaluation scores.</li><li><strong>Professional Development</strong> — Up to NGN 50,000 per year for approved courses and certifications.</li><li><strong>Remote Work</strong> — Hybrid schedule available after 3 months of employment.</li></ul>',
            ],
            // Code of Conduct
            [
                'title' => 'Code of Conduct',
                'slug' => 'code-of-conduct',
                'category' => 'code-of-conduct',
                'requires_acknowledgement' => true,
                'body' => '<h2>Our Standards</h2><p>All employees are expected to conduct themselves with the highest level of professionalism, integrity, and respect. This Code of Conduct outlines the standards we hold ourselves to as individuals and as a team.</p><h3>Professional Behaviour</h3><ul><li>Treat colleagues, clients, and partners with respect and dignity.</li><li>Maintain confidentiality of company and client information.</li><li>Avoid conflicts of interest and disclose any potential conflicts to HR.</li></ul><h3>Prohibited Conduct</h3><ul><li>Harassment, bullying, or discrimination of any kind.</li><li>Misuse of company resources or intellectual property.</li><li>Falsification of records, timesheets, or expense claims.</li></ul><h3>Reporting</h3><p>Any violations should be reported to HR or through the confidential whistleblowing channel. All reports will be investigated fairly and promptly.</p><p><em>By acknowledging this policy, you confirm that you have read, understood, and agree to abide by this Code of Conduct.</em></p>',
            ],
            // Ethics & Whistleblowing
            [
                'title' => 'Ethics & Whistleblowing Policy',
                'slug' => 'ethics-whistleblowing-policy',
                'category' => 'ethics-whistleblowing',
                'requires_acknowledgement' => false,
                'body' => '<h2>Our Commitment to Ethical Conduct</h2><p>We are committed to maintaining the highest ethical standards across all of our activities. This policy outlines the procedures for raising concerns about unethical behaviour, fraud, or misconduct.</p><h3>Who Can Report?</h3><p>Any employee, contractor, or stakeholder who witnesses or suspects misconduct is encouraged to report it through the appropriate channels.</p><h3>How to Report</h3><ul><li>Speak directly to your line manager or HR.</li><li>Submit a confidential report via the HR platform.</li><li>Email the anonymous ethics inbox: ethics@company.com</li></ul><h3>Protections</h3><p>Whistleblowers are protected from retaliation. All reports are treated with strict confidentiality.</p>',
            ],
            // Data Privacy
            [
                'title' => 'Data Privacy & Security Policy',
                'slug' => 'data-privacy-policy',
                'category' => 'data-privacy',
                'requires_acknowledgement' => true,
                'body' => '<h2>Your Responsibilities</h2><p>All employees who handle personal data — whether of colleagues, clients, or partners — are responsible for protecting that data in accordance with applicable data protection laws and this policy.</p><h3>Key Principles</h3><ul><li><strong>Collect only what is necessary</strong> — Do not collect personal data beyond what is required for the task.</li><li><strong>Store securely</strong> — Use company-approved systems. Do not store personal data on personal devices.</li><li><strong>Limit access</strong> — Share personal data only with those who need it to perform their role.</li><li><strong>Report breaches immediately</strong> — Any suspected data breach must be reported to IT and HR within 24 hours.</li></ul><h3>Consequences</h3><p>Violations of this policy may result in disciplinary action up to and including termination, as well as potential legal liability.</p><p><em>By acknowledging this policy, you confirm that you have read and understood your data protection obligations.</em></p>',
            ],
            // IT Setup
            [
                'title' => 'IT Setup & Access Guide',
                'slug' => 'it-setup-guide',
                'category' => 'it-setup',
                'requires_acknowledgement' => false,
                'body' => '<h2>Getting Started with IT</h2><p>Your IT setup will be prepared before your first day. This guide walks you through everything you need to do to get fully operational.</p><h3>Step 1: Activate Your Company Email</h3><p>You will receive an activation link at your personal email. Follow the prompts to set up your company email account and enable two-factor authentication.</p><h3>Step 2: Access Company Tools</h3><ul><li><strong>Slack</strong> — Download and join the company workspace using your company email.</li><li><strong>Google Workspace</strong> — Your Drive, Docs, and Calendar are ready to use.</li><li><strong>Project Management Tool</strong> — Request access from your team lead.</li></ul><h3>Step 3: Secure Your Devices</h3><ul><li>Enable full-disk encryption on your laptop.</li><li>Install the company VPN before accessing internal systems.</li><li>Never share your credentials with anyone.</li></ul>',
            ],
            // HR Essentials
            [
                'title' => 'HR Essentials: Your First 30 Days',
                'slug' => 'hr-essentials-first-30-days',
                'category' => 'hr-essentials',
                'requires_acknowledgement' => false,
                'body' => '<h2>Your HR Essentials Checklist</h2><p>Within your first 30 days, please complete the following HR-related tasks. Reach out to HR at any point if you need assistance.</p><h3>Week 1</h3><ul><li>Submit your signed employment contract to HR.</li><li>Complete your tax and payroll forms.</li><li>Provide valid ID and bank account details for payroll setup.</li></ul><h3>Week 2</h3><ul><li>Enrol in the company health insurance plan.</li><li>Set up your employee profile on the HR platform.</li><li>Schedule your 2-week check-in with your line manager.</li></ul><h3>Week 3–4</h3><ul><li>Complete all mandatory online training courses.</li><li>Acknowledge all required policy documents.</li><li>Attend the monthly all-hands meeting.</li></ul>',
            ],
        ];

        foreach ($pages as $pageData) {
            $category = $categoryModels[$pageData['category']] ?? null;
            if (! $category) {
                continue;
            }

            ContentPage::firstOrCreate(
                ['slug' => $pageData['slug']],
                [
                    'title' => $pageData['title'],
                    'body' => $pageData['body'],
                    'category_id' => $category->id,
                    'stage_visibility' => ['joiner', 'performer', 'leader'],
                    'is_published' => true,
                    'published_at' => now(),
                    'author_id' => $adminUser->id,
                    'requires_acknowledgement' => $pageData['requires_acknowledgement'],
                    'acknowledgement_deadline' => null,
                    'attachments' => [],
                ]
            );
        }

        // ─── Default Joiner Checklist Template ───────────────────────────────

        $template = ChecklistTemplate::firstOrCreate(
            ['title' => 'First Week Onboarding'],
            [
                'description' => 'Complete these tasks during your first week to get fully settled in.',
                'stage' => 'joiner',
                'is_default' => true,
            ]
        );

        if ($template->items()->count() === 0) {
            $items = [
                ['title' => 'Set up your official company email',          'description' => 'Activate your account and enable two-factor authentication.',          'sort_order' => 0, 'is_required' => true],
                ['title' => 'Complete IT access request form',             'description' => 'Submit the form to get access to all required systems and tools.',      'sort_order' => 1, 'is_required' => true],
                ['title' => 'Read the Employee Handbook',                   'description' => 'Familiarise yourself with company policies and values.',                 'sort_order' => 2, 'is_required' => true],
                ['title' => 'Acknowledge the Code of Conduct',             'description' => 'Review and sign off on the Code of Conduct policy.',                    'sort_order' => 3, 'is_required' => true],
                ['title' => 'Meet your team lead and direct manager',      'description' => 'Schedule a 1-on-1 intro meeting in your first two days.',               'sort_order' => 4, 'is_required' => true],
                ['title' => 'Set up your development environment',         'description' => 'Install required software, clone repos, and run local setup.',          'sort_order' => 5, 'is_required' => false],
                ['title' => 'Complete all mandatory training courses',     'description' => 'Log in to the Learning Hub and complete all assigned mandatory courses.','sort_order' => 6, 'is_required' => true],
                ['title' => 'Submit your profile photo to HR',             'description' => 'Upload a professional headshot through your profile settings.',         'sort_order' => 7, 'is_required' => false],
            ];

            foreach ($items as $item) {
                $template->items()->create($item);
            }
        }

        // Auto-assign the default joiner checklist to all existing joiner users
        $joinerUsers = User::where('employee_stage', 'joiner')->where('status', 'active')->get();
        foreach ($joinerUsers as $joiner) {
            \App\Models\UserChecklist::firstOrCreate([
                'user_id' => $joiner->id,
                'checklist_template_id' => $template->id,
            ]);
        }

        // ─── Sample Courses ──────────────────────────────────────────────────

        $courses = [
            [
                'title' => 'Company Security Basics',
                'description' => 'Learn the fundamentals of keeping company data and systems secure. Covers password hygiene, phishing awareness, VPN usage, and incident reporting procedures.',
                'type' => 'mandatory',
                'stage_visibility' => ['joiner', 'performer', 'leader'],
                'category' => 'Security',
                'duration_minutes' => 45,
                'is_published' => true,
                'content' => '<h2>Why Security Matters</h2><p>Every employee plays a critical role in maintaining the security of our systems, data, and customers. This course will help you understand common threats and the steps you must take to stay safe.</p><h3>Module 1: Password Hygiene</h3><ul><li>Use a unique, strong password for every account (minimum 12 characters).</li><li>Enable two-factor authentication on all company accounts.</li><li>Use the company-approved password manager — never store passwords in a browser.</li><li>Never share your credentials with anyone, including IT support.</li></ul><h3>Module 2: Phishing Awareness</h3><p>Phishing emails are designed to trick you into revealing credentials or installing malware. Warning signs include:</p><ul><li>Unexpected urgency ("Your account will be locked!")</li><li>Mismatched sender addresses (support@company.co vs support@c0mpany.co)</li><li>Requests to click links or download attachments from unknown sources</li></ul><p>When in doubt, report the email to IT immediately — do not click any links.</p><h3>Module 3: VPN & Remote Access</h3><p>Always connect through the company VPN when accessing internal systems from outside the office. Never use public Wi-Fi without the VPN active.</p><h3>Module 4: Incident Reporting</h3><p>If you suspect a security incident — lost device, phishing click, unusual account activity — report it to IT within <strong>1 hour</strong>. Prompt reporting minimises damage significantly.</p>',
            ],
            [
                'title' => 'Advanced Git Workflows',
                'description' => 'Deep-dive into branching strategies, rebase workflows, conflict resolution, and team collaboration patterns used by senior engineers.',
                'type' => 'optional',
                'stage_visibility' => ['performer', 'leader'],
                'category' => 'Engineering',
                'duration_minutes' => 90,
                'is_published' => true,
                'content' => '<h2>Git for Professionals</h2><p>This course assumes you are already comfortable with basic Git commands. We will cover advanced workflows that make collaboration cleaner and code history more meaningful.</p><h3>Module 1: Branching Strategies</h3><p>There are several popular strategies — choose the right one for your team:</p><ul><li><strong>Git Flow</strong> — Feature branches, release branches, hotfix branches. Good for versioned releases.</li><li><strong>Trunk-Based Development</strong> — Short-lived feature branches merged frequently to main. Better for CI/CD pipelines.</li><li><strong>GitHub Flow</strong> — Simplified: branch off main, open PR, merge. Ideal for web apps with continuous deployment.</li></ul><h3>Module 2: Rebase vs Merge</h3><p>Use <code>git rebase</code> to maintain a clean, linear history. Use <code>git merge</code> when you want to preserve the full branching history. The golden rule: <strong>never rebase shared branches</strong>.</p><h3>Module 3: Conflict Resolution</h3><p>Conflicts happen. The key is resolving them systematically:</p><ol><li>Understand both sides of the conflict before choosing a resolution.</li><li>Use a proper merge tool (VS Code, IntelliJ, or vimdiff).</li><li>Test after resolving — conflicts can introduce subtle bugs.</li></ol><h3>Module 4: Interactive Rebase</h3><p>Use <code>git rebase -i HEAD~N</code> to clean up commit history before opening a PR. Common actions: squash noisy commits, reword messages, drop accidental commits.</p>',
            ],
            [
                'title' => 'Project Management Fundamentals',
                'description' => 'A practical introduction to project planning, stakeholder communication, risk management, and delivery frameworks (Agile, Scrum, Kanban). Required for certification.',
                'type' => 'certification',
                'stage_visibility' => ['joiner', 'performer', 'leader'],
                'category' => 'Management',
                'duration_minutes' => 120,
                'is_published' => true,
                'content' => '<h2>Managing Projects That Deliver</h2><p>Whether you manage projects formally or informally as part of your role, understanding project management fundamentals will make you dramatically more effective.</p><h3>Module 1: The Project Lifecycle</h3><p>Every project moves through four key phases:</p><ol><li><strong>Initiation</strong> — Define scope, goals, and success criteria.</li><li><strong>Planning</strong> — Break work into tasks, assign owners, estimate effort, identify risks.</li><li><strong>Execution</strong> — Deliver the work, track progress, manage changes.</li><li><strong>Closure</strong> — Review outcomes, document lessons learned, celebrate the win.</li></ol><h3>Module 2: Agile vs Waterfall</h3><p><strong>Waterfall</strong> works well for projects with fixed, well-understood requirements. <strong>Agile</strong> is better when requirements evolve and fast feedback is needed. Most modern teams use a hybrid approach.</p><h3>Module 3: Scrum in Practice</h3><p>Scrum organises work into time-boxed sprints (typically 2 weeks). Key ceremonies:</p><ul><li><strong>Sprint Planning</strong> — What will we build this sprint?</li><li><strong>Daily Standup</strong> — What did I do? What will I do? Any blockers?</li><li><strong>Sprint Review</strong> — Demo the increment to stakeholders.</li><li><strong>Retrospective</strong> — What went well? What can we improve?</li></ul><h3>Module 4: Risk Management</h3><p>Identify risks early using a simple risk register. For each risk, assess: <em>likelihood × impact</em>. Mitigation strategies: avoid, transfer, reduce, accept.</p><h3>Assessment</h3><p>Complete the end-of-course quiz to earn your Project Management Fundamentals certification. A minimum score of <strong>70%</strong> is required to pass.</p>',
            ],
        ];

        foreach ($courses as $courseData) {
            Course::firstOrCreate(
                ['title' => $courseData['title']],
                $courseData
            );
        }

        // Auto-assign the mandatory course to all joiner users
        $mandatoryCourse = Course::where('title', 'Company Security Basics')->first();
        if ($mandatoryCourse) {
            $allActiveUsers = User::where('status', 'active')->get();
            foreach ($allActiveUsers as $user) {
                CourseEnrollment::firstOrCreate(
                    ['user_id' => $user->id, 'course_id' => $mandatoryCourse->id],
                    ['status' => 'assigned', 'progress' => 0]
                );
            }
        }
    }
}
