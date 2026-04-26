<?php

namespace Database\Seeders;

use App\Models\Bulletin;
use App\Models\ChecklistTemplate;
use App\Models\ContentPage;
use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\FaqEntry;
use App\Models\JobApplication;
use App\Models\JobPosting;
use App\Models\Newsletter;
use App\Models\Objective;
use App\Models\PolicyAcknowledgement;
use App\Models\Recognition;
use App\Models\Task;
use App\Models\User;
use App\Models\UserChecklist;
use App\Models\UserChecklistProgress;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class MasterSeeder extends Seeder
{
    public function run(): void
    {
        // ── 1. Additional Users ─────────────────────────────────────────────────

        $additionalUsers = [
            // Second superadmin
            [
                'employee_id' => 'EMP009',
                'name' => 'Chioma Obi',
                'email' => 'chioma.obi@example.com',
                'department' => 'Project Management',
                'position' => 'Senior Project Manager',
                'role' => 'superadmin',
                'status' => 'active',
                'employee_stage' => 'leader',
            ],
            // Second HR
            [
                'employee_id' => 'EMP010',
                'name' => 'Bola Adewale',
                'email' => 'bola.adewale@example.com',
                'department' => 'Project Management',
                'position' => 'HR Associate',
                'role' => 'hr',
                'status' => 'active',
                'employee_stage' => 'leader',
            ],
            // Second management
            [
                'employee_id' => 'EMP011',
                'name' => 'Seun Falola',
                'email' => 'seun.falola@example.com',
                'department' => 'Content & Brand Comms',
                'position' => 'Brand Manager',
                'role' => 'management',
                'status' => 'active',
                'employee_stage' => 'leader',
            ],
            // Third joiner
            [
                'employee_id' => 'EMP012',
                'name' => 'Kemi Ojo',
                'email' => 'kemi.ojo@example.com',
                'department' => 'Graphics Design',
                'position' => 'Junior Designer',
                'role' => 'staff',
                'status' => 'active',
                'employee_stage' => 'joiner',
            ],
            // Fourth & fifth performers
            [
                'employee_id' => 'EMP013',
                'name' => 'Emeka Nwosu',
                'email' => 'emeka.nwosu@example.com',
                'department' => 'Product Team',
                'position' => 'Business Analyst',
                'role' => 'staff',
                'status' => 'active',
                'employee_stage' => 'performer',
            ],
            [
                'employee_id' => 'EMP014',
                'name' => 'Fatima Abdullahi',
                'email' => 'fatima.abdullahi@example.com',
                'department' => 'Business Development',
                'position' => 'Sales Executive',
                'role' => 'staff',
                'status' => 'active',
                'employee_stage' => 'performer',
            ],
            // Leader (staff role, leader stage)
            [
                'employee_id' => 'EMP015',
                'name' => 'Adaeze Okonkwo',
                'email' => 'adaeze.okonkwo@example.com',
                'department' => 'Video & Production',
                'position' => 'Production Lead',
                'role' => 'management',
                'status' => 'active',
                'employee_stage' => 'leader',
            ],
        ];

        foreach ($additionalUsers as $u) {
            User::firstOrCreate(
                ['email' => $u['email']],
                array_merge($u, [
                    'password' => Hash::make('password'),
                    'email_verified_at' => now(),
                ])
            );
        }

        // Convenient handles
        $admin = User::where('role', 'superadmin')->first();
        $hr = User::where('role', 'hr')->first();
        $mgmt = User::where('role', 'management')->first();
        $joiners = User::where('employee_stage', 'joiner')->where('status', 'active')->get();
        $performers = User::where('employee_stage', 'performer')->where('status', 'active')->get();
        $leaders = User::where('employee_stage', 'leader')->where('status', 'active')->get();
        $allActive = User::where('status', 'active')->get();

        // ── 2. Bulletins ────────────────────────────────────────────────────────

        $bulletins = [
            [
                'title' => 'URGENT: Platform Maintenance Window — Saturday 2 AM',
                'body' => '<p>The HR platform will be unavailable from <strong>Saturday 2:00 AM – 4:00 AM</strong> for scheduled maintenance. Please save your work before then. Any submissions during this window will not be recorded. Contact IT if you have urgent tasks that cannot wait.</p>',
                'priority' => 'urgent',
                'is_pinned' => true,
                'expires_at' => now()->addDays(5)->toDateString(),
                'is_published' => true,
                'published_at' => now()->subHours(2),
            ],
            [
                'title' => 'Q2 Evaluation Period Opens April 20th',
                'body' => '<p>The Q2 performance evaluation cycle opens on <strong>April 20th</strong>. All staff must complete peer reviews and self-assessments by <strong>April 30th</strong>. Results will be shared within two weeks of the closing date. Log in to the Evaluation section to get started once the period opens.</p>',
                'priority' => 'important',
                'is_pinned' => false,
                'expires_at' => now()->addDays(20)->toDateString(),
                'is_published' => true,
                'published_at' => now()->subDay(),
            ],
            [
                'title' => 'Updated Leave Request Process — Effective Immediately',
                'body' => '<p>Effective immediately, all leave requests must be submitted via the HR platform at least <strong>5 business days</strong> in advance (previously 3 days). Emergency leave remains exempt from this requirement. Please update your workflows accordingly. Questions? Reach out to HR.</p>',
                'priority' => 'important',
                'is_pinned' => false,
                'expires_at' => null,
                'is_published' => true,
                'published_at' => now()->subDays(3),
            ],
            [
                'title' => 'Monthly Team Lunch — Friday, April 18th',
                'body' => '<p>Join us for the monthly team lunch this <strong>Friday, April 18th</strong> at 12:30 PM in the main conference room. Lunch will be provided. RSVPs are not required — just show up! It\'s a great opportunity to connect with colleagues across departments.</p>',
                'priority' => 'info',
                'is_pinned' => false,
                'expires_at' => now()->addDays(4)->toDateString(),
                'is_published' => true,
                'published_at' => now()->subHours(12),
            ],
            [
                'title' => 'New Coffee Machine in the Break Room',
                'body' => '<p>We\'ve upgraded the break room coffee machine to a bean-to-cup model. Please take a moment to read the instructions posted on the wall before use. Capsules from the old machine are no longer compatible. The IT team will run a quick orientation session on Friday afternoon for anyone who wants a walkthrough.</p>',
                'priority' => 'info',
                'is_pinned' => false,
                'expires_at' => null,
                'is_published' => true,
                'published_at' => now()->subDays(2),
            ],
            // Expired bulletin (should not show in active scope)
            [
                'title' => 'Office Closed — Public Holiday (March 29)',
                'body' => '<p>The office will be closed on Friday, March 29th in observance of the public holiday. Normal operations resume Monday, April 1st. Enjoy the long weekend!</p>',
                'priority' => 'info',
                'is_pinned' => false,
                'expires_at' => now()->subDays(10)->toDateString(),
                'is_published' => true,
                'published_at' => now()->subDays(20),
            ],
        ];

        foreach ($bulletins as $b) {
            Bulletin::firstOrCreate(
                ['title' => $b['title']],
                array_merge($b, ['author_id' => $admin->id])
            );
        }

        // ── 3. Newsletters ──────────────────────────────────────────────────────

        $newsletters = [
            [
                'title' => 'April Company Newsletter — Q2 Kickoff',
                'body' => '<h2>Welcome to Q2 2026!</h2><p>As we kick off Q2, we want to take a moment to celebrate what we\'ve achieved and look ahead to what\'s coming. Q1 was an outstanding quarter — we exceeded our revenue targets by 12%, onboarded 8 new team members, and launched two major product features.</p><h3>Team Spotlight: Video & Production</h3><p>A huge congratulations to the Video & Production team for delivering the brand refresh campaign on time and under budget. The new brand assets have already been adopted across all channels and received tremendous client feedback.</p><h3>Upcoming Events</h3><ul><li><strong>April 20</strong> — Q2 Evaluation cycle opens</li><li><strong>April 25</strong> — All-hands meeting (in-person + virtual)</li><li><strong>April 30</strong> — Evaluation deadline</li></ul><h3>HR Updates</h3><p>A reminder that the annual benefits review is now open. Log in to the HR platform to review your health insurance and pension options. Changes must be submitted by April 28th.</p>',
                'target_audience' => ['all'],
                'status' => 'published',
                'published_at' => now()->subDays(7),
            ],
            [
                'title' => 'Product Team Bulletin — Sprint 14 Retrospective',
                'body' => '<h2>Sprint 14 Wrap-Up</h2><p>Another great sprint in the books. Here\'s a summary of what the Product Team shipped:</p><ul><li>User profile change request flow — fully implemented and QA approved</li><li>OKR management module — leader tools complete</li><li>Global search — now live across all content types</li><li>FAQ system — 14 entries seeded and published</li></ul><h3>What\'s Next — Sprint 15</h3><p>Sprint 15 focus areas: analytics dashboard improvements, push notification infrastructure, and the mobile app proof-of-concept. Kickoff is Monday at 10 AM.</p><h3>Shoutouts</h3><p>Big shoutout to Emeka for going above and beyond during the search feature testing. Your attention to edge cases saved us from at least three post-launch bugs.</p>',
                'target_audience' => ['Product Team'],
                'status' => 'published',
                'published_at' => now()->subDays(3),
            ],
            [
                'title' => 'New Joiners Welcome Pack — April 2026',
                'body' => '<h2>Welcome to the Family!</h2><p>We\'re thrilled to welcome our newest team members who joined us this month. This newsletter is your guide to getting started on the right foot.</p><h3>Your First Week Checklist</h3><p>Log in to the HR platform and navigate to Checklists to see your personalised onboarding checklist. Complete each item at your own pace — your manager will check in with you at the end of Week 1 and Week 2.</p><h3>Key People to Know</h3><ul><li><strong>HR</strong> — For onboarding questions, payroll setup, and policy queries.</li><li><strong>IT Support</strong> — For system access, device issues, and software requests.</li><li><strong>Your Line Manager</strong> — For day-to-day direction and feedback.</li></ul><h3>Platform Quick Links</h3><p>Explore: <em>Dashboard → Onboarding Hub → Checklists → Learning Hub → FAQs</em></p><p>Don\'t hesitate to reach out to HR via the Chat feature if you have any questions. We\'re here to help!</p>',
                'target_audience' => ['joiner'],
                'status' => 'published',
                'published_at' => now()->subDays(5),
            ],
            [
                'title' => 'May Newsletter — Draft',
                'body' => '<h2>May 2026 Preview</h2><p>This newsletter is in draft — content coming soon.</p>',
                'target_audience' => ['all'],
                'status' => 'draft',
                'published_at' => null,
            ],
        ];

        foreach ($newsletters as $n) {
            Newsletter::firstOrCreate(
                ['title' => $n['title']],
                array_merge($n, ['author_id' => $admin->id])
            );
        }

        // ── 4. IT Setup Checklist Template ──────────────────────────────────────

        $itTemplate = ChecklistTemplate::firstOrCreate(
            ['title' => 'IT Setup'],
            [
                'description' => 'Get your devices and access configured before starting your first project.',
                'stage' => 'joiner',
                'is_default' => true,
            ]
        );

        if ($itTemplate->items()->count() === 0) {
            $itItems = [
                ['title' => 'Activate company email account',            'description' => 'Click the activation link sent to your personal email and set a strong password.',        'sort_order' => 0, 'is_required' => true],
                ['title' => 'Enable two-factor authentication',          'description' => 'Install an authenticator app and enable 2FA on your company email and Slack.',           'sort_order' => 1, 'is_required' => true],
                ['title' => 'Install and configure the company VPN',     'description' => 'Download the VPN client from the IT portal and connect before accessing internal tools.', 'sort_order' => 2, 'is_required' => true],
                ['title' => 'Join the company Slack workspace',          'description' => 'Use your company email to join Slack and introduce yourself in #introductions.',          'sort_order' => 3, 'is_required' => true],
                ['title' => 'Request access to required tools',          'description' => 'Submit an access request via the Requests page listing the tools you need.',             'sort_order' => 4, 'is_required' => false],
            ];
            foreach ($itItems as $item) {
                $itTemplate->items()->create($item);
            }
        }

        // Auto-assign IT Setup checklist to all joiners
        foreach ($joiners as $joiner) {
            UserChecklist::firstOrCreate([
                'user_id' => $joiner->id,
                'checklist_template_id' => $itTemplate->id,
            ]);
        }

        // Record some progress on checklists for each joiner
        $onboardingTemplate = ChecklistTemplate::where('title', 'First Week Onboarding')->first();

        foreach ($joiners as $index => $joiner) {
            // Progress on First Week Onboarding (3–4 items)
            if ($onboardingTemplate) {
                $uc = UserChecklist::where('user_id', $joiner->id)
                    ->where('checklist_template_id', $onboardingTemplate->id)
                    ->first();

                if ($uc) {
                    $items = $onboardingTemplate->items()->orderBy('sort_order')->get();
                    $completedCount = $index === 0 ? 5 : ($index === 1 ? 3 : 4);
                    foreach ($items->take($completedCount) as $item) {
                        UserChecklistProgress::firstOrCreate(
                            ['user_checklist_id' => $uc->id, 'checklist_item_id' => $item->id],
                            ['completed_at' => now()->subDays(rand(1, 5))]
                        );
                    }
                }
            }

            // Progress on IT Setup (2 items for each joiner)
            $ucIT = UserChecklist::where('user_id', $joiner->id)
                ->where('checklist_template_id', $itTemplate->id)
                ->first();

            if ($ucIT) {
                $itItems = $itTemplate->items()->orderBy('sort_order')->get();
                foreach ($itItems->take(2) as $item) {
                    UserChecklistProgress::firstOrCreate(
                        ['user_checklist_id' => $ucIT->id, 'checklist_item_id' => $item->id],
                        ['completed_at' => now()->subDays(rand(1, 3))]
                    );
                }
            }
        }

        // ── 5. Additional Courses ───────────────────────────────────────────────

        $additionalCourses = [
            [
                'title' => 'Communication & Presentation Skills',
                'description' => 'Master the art of clear written and verbal communication. Learn to craft compelling presentations, run effective meetings, and communicate across cultures and seniority levels.',
                'type' => 'mandatory',
                'stage_visibility' => ['joiner', 'performer', 'leader'],
                'category' => 'Soft Skills',
                'duration_minutes' => 60,
                'is_published' => true,
                'content' => '<h2>Communicate to Connect and Convince</h2><p>Clear, concise communication is one of the most valuable skills in any workplace. This course covers writing, presenting, and facilitating discussions with confidence.</p><h3>Module 1: Writing Clearly</h3><p>Use the BLUF principle — Bottom Line Up Front. State your main point in the first sentence, then provide supporting details. Avoid jargon and write for your reader, not for yourself.</p><h3>Module 2: Presentation Structure</h3><p>Every good presentation follows a three-part structure: hook (grab attention), narrative (build the case), and call to action (tell them what to do). Use visuals to support, not replace, your words.</p><h3>Module 3: Meeting Facilitation</h3><p>Every meeting must have a clear agenda and owner. Start on time, end on time, summarise decisions made, and distribute action items within 24 hours.</p>',
            ],
            [
                'title' => 'Leadership Fundamentals',
                'description' => 'A practical guide to leading teams, providing feedback, managing performance, and building psychological safety.',
                'type' => 'optional',
                'stage_visibility' => ['leader'],
                'category' => 'Leadership',
                'duration_minutes' => 75,
                'is_published' => true,
                'content' => '<h2>Leadership is a Practice, Not a Title</h2><p>The best leaders are not the loudest in the room — they are the ones who bring out the best in those around them. This course covers the core disciplines of effective people leadership.</p><h3>Module 1: Setting Clear Expectations</h3><p>Use SMART goals to give your team clarity on what success looks like. Review expectations monthly, not just at annual reviews.</p><h3>Module 2: Giving Feedback</h3><p>Use the SBI model: Situation → Behaviour → Impact. Be specific, be timely, and separate feedback on behaviour from judgements about character.</p><h3>Module 3: Building Psychological Safety</h3><p>Teams that feel safe to speak up, disagree, and admit mistakes outperform those that don\'t. Create safety through modelling vulnerability, rewarding honesty, and never punishing well-intentioned failure.</p>',
            ],
        ];

        foreach ($additionalCourses as $c) {
            Course::firstOrCreate(['title' => $c['title']], $c);
        }

        // ── 6. Course Enrollments with Progress ─────────────────────────────────

        $securityCourse = Course::where('title', 'Company Security Basics')->first();
        $commsCourse = Course::where('title', 'Communication & Presentation Skills')->first();
        $pmCourse = Course::where('title', 'Project Management Fundamentals')->first();
        $gitCourse = Course::where('title', 'Advanced Git Workflows')->first();
        $leaderCourse = Course::where('title', 'Leadership Fundamentals')->first();

        // Joiners: assigned mandatory courses, some in_progress
        foreach ($joiners as $index => $joiner) {
            if ($securityCourse) {
                CourseEnrollment::firstOrCreate(
                    ['user_id' => $joiner->id, 'course_id' => $securityCourse->id],
                    ['status' => $index === 0 ? 'completed' : 'in_progress', 'progress' => $index === 0 ? 100 : rand(20, 60)]
                );
            }
            if ($commsCourse) {
                CourseEnrollment::firstOrCreate(
                    ['user_id' => $joiner->id, 'course_id' => $commsCourse->id],
                    ['status' => 'assigned', 'progress' => 0]
                );
            }
        }

        // Performers: mixed progress
        $performerCourses = array_filter([$securityCourse, $pmCourse, $gitCourse, $commsCourse]);
        foreach ($performers as $index => $performer) {
            foreach ($performerCourses as $course) {
                if (! $course) {
                    continue;
                }
                $statuses = ['completed', 'in_progress', 'in_progress', 'completed', 'assigned'];
                $progresses = [100, rand(30, 80), rand(10, 50), 100, 0];
                $s = $statuses[$index % 5];
                $p = $progresses[$index % 5];
                CourseEnrollment::firstOrCreate(
                    ['user_id' => $performer->id, 'course_id' => $course->id],
                    ['status' => $s, 'progress' => $p]
                );
            }
        }

        // Leaders: leadership course
        foreach ($leaders as $leader) {
            if ($leaderCourse) {
                CourseEnrollment::firstOrCreate(
                    ['user_id' => $leader->id, 'course_id' => $leaderCourse->id],
                    ['status' => 'in_progress', 'progress' => rand(40, 80)]
                );
            }
            if ($securityCourse) {
                CourseEnrollment::firstOrCreate(
                    ['user_id' => $leader->id, 'course_id' => $securityCourse->id],
                    ['status' => 'completed', 'progress' => 100]
                );
            }
        }

        // ── 7. Policy Acknowledgements ──────────────────────────────────────────

        $codeOfConductPage = ContentPage::where('slug', 'code-of-conduct')->first();
        $dataPrivacyPage = ContentPage::where('slug', 'data-privacy-policy')->first();

        // All leaders and admins have acknowledged both
        $acknowledgers = $leaders->merge($allActive->where('role', 'superadmin'))->merge($allActive->where('role', 'hr'));
        foreach ($acknowledgers as $u) {
            if ($codeOfConductPage) {
                PolicyAcknowledgement::firstOrCreate([
                    'user_id' => $u->id,
                    'content_page_id' => $codeOfConductPage->id,
                ], ['acknowledged_at' => now()->subDays(rand(5, 30))]);
            }
            if ($dataPrivacyPage) {
                PolicyAcknowledgement::firstOrCreate([
                    'user_id' => $u->id,
                    'content_page_id' => $dataPrivacyPage->id,
                ], ['acknowledged_at' => now()->subDays(rand(5, 30))]);
            }
        }

        // First performer has acknowledged code of conduct; second has neither (shows pending count)
        $firstPerformer = $performers->first();
        if ($firstPerformer && $codeOfConductPage) {
            PolicyAcknowledgement::firstOrCreate([
                'user_id' => $firstPerformer->id,
                'content_page_id' => $codeOfConductPage->id,
            ], ['acknowledged_at' => now()->subDays(10)]);
        }

        // ── 8. Recognitions ─────────────────────────────────────────────────────

        $badgeTypes = ['star', 'rocket', 'heart', 'lightning', 'trophy', 'thumbs_up', 'fire', 'gem'];
        $recognitionData = [
            [
                'from' => $mgmt,
                'to' => $performers->first(),
                'badge_type' => 'star',
                'message' => 'Exceptional work on the Q1 client deliverable. Your attention to detail and ownership of the project made all the difference. The client specifically called you out by name — well done!',
            ],
            [
                'from' => $performers->get(1) ?? $performers->first(),
                'to' => $performers->first(),
                'badge_type' => 'heart',
                'message' => 'Thank you for staying late to help me debug that critical issue before the deadline. You didn\'t have to, but you did anyway. That\'s true teamwork.',
            ],
            [
                'from' => $admin,
                'to' => $mgmt,
                'badge_type' => 'trophy',
                'message' => 'Outstanding leadership this quarter. Your team\'s performance metrics were consistently above target, and the morale in your department speaks for itself. Keep setting the standard.',
            ],
            [
                'from' => $hr,
                'to' => $performers->get(2) ?? $performers->first(),
                'badge_type' => 'rocket',
                'message' => 'Your contribution to the newsletter series this month was brilliant. The engagement rates were the highest we\'ve ever seen. Creative, relevant, and delivered on time — exactly what we needed.',
            ],
            [
                'from' => $mgmt,
                'to' => $performers->get(1) ?? $performers->first(),
                'badge_type' => 'fire',
                'message' => 'Three major tasks completed this week, all ahead of schedule. You\'re setting the pace for the whole team. Keep up this incredible momentum!',
            ],
            [
                'from' => $performers->first(),
                'to' => $performers->get(3) ?? $performers->first(),
                'badge_type' => 'lightning',
                'message' => 'Your quick thinking during the client call saved a potentially awkward situation. You handled it with real professionalism and composure. Genuinely impressed.',
            ],
            [
                'from' => $admin,
                'to' => $hr,
                'badge_type' => 'gem',
                'message' => 'The new onboarding process you designed has received fantastic feedback from our last three joiners. Thoughtful, thorough, and exactly the kind of HR initiative that makes a real difference.',
            ],
            [
                'from' => $hr,
                'to' => $performers->get(4) ?? $performers->first(),
                'badge_type' => 'thumbs_up',
                'message' => 'Consistently positive attitude and willingness to take on new challenges. You\'re a pleasure to work with and your contributions don\'t go unnoticed.',
            ],
            [
                'from' => $performers->get(2) ?? $performers->first(),
                'to' => $performers->get(1) ?? $performers->first(),
                'badge_type' => 'heart',
                'message' => 'You always make time to answer questions and share your knowledge, even when you\'re busy. The way you mentor others is genuinely appreciated by everyone on the team.',
            ],
            [
                'from' => $mgmt,
                'to' => $performers->get(4) ?? $performers->first(),
                'badge_type' => 'star',
                'message' => 'Brilliant job on the new business pitch. The research was thorough and the presentation was polished. We landed the client — and a huge part of that is because of your preparation.',
            ],
            [
                'from' => $admin,
                'to' => $performers->first(),
                'badge_type' => 'rocket',
                'message' => 'Your proactive communication on the project status kept stakeholders aligned and reduced our escalations to zero this month. This is exactly the kind of ownership we need more of.',
            ],
            [
                'from' => $hr,
                'to' => $joiners->first(),
                'badge_type' => 'star',
                'message' => 'Impressive start to your journey here. You\'ve asked great questions, completed your onboarding checklist faster than most, and already made a noticeable contribution to the team. Welcome aboard — we\'re glad you\'re here.',
            ],
        ];

        foreach ($recognitionData as $r) {
            if (! $r['from'] || ! $r['to']) {
                continue;
            }
            Recognition::create([
                'from_user_id' => $r['from']->id,
                'to_user_id' => $r['to']->id,
                'badge_type' => $r['badge_type'],
                'message' => $r['message'],
                'is_public' => true,
            ]);
        }

        // ── 9. Job Postings ─────────────────────────────────────────────────────

        $jobPostings = [
            [
                'title' => 'Senior Video Editor',
                'department' => 'Video & Production',
                'description' => '<h3>About the Role</h3><p>We are looking for a talented Senior Video Editor to join our Video & Production team. You will lead the post-production process for brand campaigns, social media content, and internal communications videos.</p><h3>Responsibilities</h3><ul><li>Edit and deliver high-quality video content across multiple formats</li><li>Manage the post-production pipeline from rough cut to final delivery</li><li>Collaborate with producers, designers, and brand team</li><li>Mentor junior editors and establish best practices</li></ul>',
                'requirements' => '<h3>Requirements</h3><ul><li>5+ years of professional video editing experience</li><li>Expert-level proficiency in Premiere Pro and After Effects</li><li>Strong portfolio of brand and campaign work</li><li>Experience with colour grading and audio mixing</li><li>Ability to work under tight deadlines</li></ul>',
                'status' => 'open',
                'closes_at' => now()->addDays(21)->toDateString(),
            ],
            [
                'title' => 'Content Writer',
                'department' => 'Content & Brand Comms',
                'description' => '<h3>About the Role</h3><p>We need a sharp, versatile Content Writer to produce compelling copy across all our channels — from long-form articles and newsletters to social media and email campaigns.</p><h3>Responsibilities</h3><ul><li>Write and edit content for blogs, newsletters, and social media</li><li>Maintain brand voice consistency across all written materials</li><li>Conduct research and interviews to produce informative long-form pieces</li><li>Collaborate with the design team on content-led campaigns</li></ul>',
                'requirements' => '<h3>Requirements</h3><ul><li>3+ years of content writing or journalism experience</li><li>Strong command of English grammar and storytelling</li><li>Portfolio demonstrating range and versatility</li><li>SEO knowledge is a plus</li></ul>',
                'status' => 'open',
                'closes_at' => now()->addDays(14)->toDateString(),
            ],
            [
                'title' => 'Business Development Associate',
                'department' => 'Business Development',
                'description' => '<h3>About the Role</h3><p>Join our Business Development team to identify, pursue, and close new business opportunities. You will work directly with the BD lead to build our client pipeline and manage key accounts.</p><h3>Responsibilities</h3><ul><li>Identify and qualify new business leads</li><li>Develop pitch presentations and proposals</li><li>Manage CRM entries and pipeline reporting</li><li>Support the BD lead in client negotiations</li></ul>',
                'requirements' => '<h3>Requirements</h3><ul><li>2+ years in business development, sales, or account management</li><li>Strong communication and negotiation skills</li><li>Experience with CRM tools (HubSpot preferred)</li><li>Self-starter mentality with ability to work independently</li></ul>',
                'status' => 'open',
                'closes_at' => now()->addDays(10)->toDateString(),
            ],
            [
                'title' => 'Graphic Design Intern',
                'department' => 'Graphics Design',
                'description' => '<h3>About the Role</h3><p>A 3-month paid internship in our Graphics Design team. You will assist with social media assets, presentations, and internal brand materials.</p>',
                'requirements' => '<h3>Requirements</h3><ul><li>Final year student or recent graduate in Design or related field</li><li>Proficiency in Adobe Creative Suite</li><li>Strong portfolio of design work</li></ul>',
                'status' => 'closed',
                'closes_at' => now()->subDays(5)->toDateString(),
            ],
        ];

        foreach ($jobPostings as $jp) {
            JobPosting::firstOrCreate(
                ['title' => $jp['title']],
                array_merge($jp, ['posted_by_user_id' => $hr->id])
            );
        }

        // Applications from performers
        $openPostings = JobPosting::where('status', 'open')->get();
        if ($openPostings->isNotEmpty() && $performers->isNotEmpty()) {
            // First performer applies to first open posting
            $firstPosting = $openPostings->first();
            $firstPerformer = $performers->first();
            JobApplication::firstOrCreate(
                ['job_posting_id' => $firstPosting->id, 'user_id' => $firstPerformer->id],
                [
                    'cover_letter' => 'I am very excited about this opportunity and believe my experience aligns well with the role requirements. I have been with the company for over a year and have consistently delivered strong results in my current position. I am eager to take on new challenges and grow within the organisation.',
                    'status' => 'under_review',
                    'applied_at' => now()->subDays(3),
                ]
            );

            // Second performer applies to second posting (if exists)
            if ($openPostings->count() > 1 && $performers->count() > 1) {
                $secondPosting = $openPostings->get(1);
                $secondPerformer = $performers->get(1);
                JobApplication::firstOrCreate(
                    ['job_posting_id' => $secondPosting->id, 'user_id' => $secondPerformer->id],
                    [
                        'cover_letter' => 'Having spent two years in my current role developing my skills, I feel ready to step up and take on the responsibilities outlined in this posting. I am a strong communicator, highly organised, and passionate about the work we do here.',
                        'status' => 'applied',
                        'applied_at' => now()->subDays(1),
                    ]
                );
            }
        }

        // ── 10. OKRs & Key Results ──────────────────────────────────────────────

        $currentPeriod = 'Q2-2026';

        $okrData = [
            [
                'title' => 'Grow Our Client Base and Revenue',
                'description' => 'Expand the company\'s revenue streams by closing new clients and growing existing accounts.',
                'department' => 'Business Development',
                'period' => $currentPeriod,
                'status' => 'active',
                'progress' => 0,
                'owner' => $mgmt,
                'key_results' => [
                    ['title' => 'Close 5 new enterprise clients',          'target_value' => 5,   'current_value' => 2,   'unit' => 'clients',  'status' => 'on_track'],
                    ['title' => 'Achieve Q2 revenue target of ₦25M',      'target_value' => 25,  'current_value' => 9,   'unit' => 'million ₦', 'status' => 'on_track'],
                    ['title' => 'Increase upsell revenue by 20%',         'target_value' => 20,  'current_value' => 6,   'unit' => '% growth', 'status' => 'at_risk'],
                ],
            ],
            [
                'title' => 'Deliver World-Class Content Production',
                'description' => 'Raise the quality bar across all video and written content outputs this quarter.',
                'department' => 'Video & Production',
                'period' => $currentPeriod,
                'status' => 'active',
                'progress' => 0,
                'owner' => User::where('email', 'adaeze.okonkwo@example.com')->first() ?? $admin,
                'key_results' => [
                    ['title' => 'Deliver 12 brand campaign videos on time', 'target_value' => 12,  'current_value' => 7,   'unit' => 'videos',    'status' => 'on_track'],
                    ['title' => 'Achieve client satisfaction score ≥ 4.5', 'target_value' => 4.5, 'current_value' => 4.2, 'unit' => '/5 rating', 'status' => 'at_risk'],
                    ['title' => 'Reduce average production cycle to 5 days', 'target_value' => 5,   'current_value' => 6.5, 'unit' => 'days avg',  'status' => 'behind'],
                ],
            ],
            [
                'title' => 'Build a High-Performance Team Culture',
                'description' => 'Strengthen team engagement, learning, and recognition across all departments.',
                'department' => 'Project Management',
                'period' => $currentPeriod,
                'status' => 'active',
                'progress' => 0,
                'owner' => $admin,
                'key_results' => [
                    ['title' => 'Achieve ≥ 85% staff satisfaction score',    'target_value' => 85,  'current_value' => 72,  'unit' => '% score',    'status' => 'at_risk'],
                    ['title' => 'Complete 100% of mandatory training by EOQ', 'target_value' => 100, 'current_value' => 68,  'unit' => '% completed', 'status' => 'on_track'],
                    ['title' => 'Send 50+ peer recognitions this quarter',    'target_value' => 50,  'current_value' => 12,  'unit' => 'recognitions', 'status' => 'on_track'],
                ],
            ],
        ];

        foreach ($okrData as $okr) {
            $owner = $okr['owner'];
            if (! $owner) {
                continue;
            }

            $objective = Objective::firstOrCreate(
                ['title' => $okr['title'], 'period' => $okr['period']],
                [
                    'description' => $okr['description'],
                    'owner_user_id' => $owner->id,
                    'department' => $okr['department'],
                    'status' => $okr['status'],
                    'progress' => 0,
                    'parent_id' => null,
                ]
            );

            if ($objective->keyResults()->count() === 0) {
                foreach ($okr['key_results'] as $kr) {
                    $objective->keyResults()->create($kr);
                }
            }

            // Calculate actual progress from KRs
            $objective->recalculateProgress();
        }

        // ── 11. Attendance Records ──────────────────────────────────────────────

        $statusOptions = ['present', 'present', 'present', 'late', 'present', 'present', 'absent', 'present'];
        $workDays = collect();
        $current = now()->startOfMonth();
        $today = now();
        while ($current->lte($today) && $workDays->count() < 15) {
            if ($current->isWeekday()) {
                $workDays->push($current);
            }
            $current = $current->addDay(); // Carbon immutable: must reassign
        }

        $now = now();
        foreach ($allActive->take(8) as $user) {
            foreach ($workDays as $day) {
                $statusIdx = rand(0, count($statusOptions) - 1);
                $status = $statusOptions[$statusIdx];
                $clockIn = $status === 'late'
                    ? $day->copy()->setTime(9, rand(15, 45))
                    : $day->copy()->setTime(8, rand(0, 15));
                $clockOut = $day->copy()->setTime(17, rand(0, 30));
                $hours = $clockIn->diffInMinutes($clockOut) / 60;

                // insertOrIgnore bypasses Eloquent date-cast issues (SQLite stores date as datetime string)
                \Illuminate\Support\Facades\DB::table('attendance_records')->insertOrIgnore([
                    'user_id' => $user->id,
                    'date' => $day->toDateString(),
                    'clock_in_at' => $clockIn->format('Y-m-d H:i:s'),
                    'clock_out_at' => $clockOut->format('Y-m-d H:i:s'),
                    'total_hours' => round($hours, 2),
                    'status' => $status,
                    'notes' => $status === 'absent' ? 'Unplanned absence' : null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }

        // ── 12. Tasks ───────────────────────────────────────────────────────────

        $taskData = [
            [
                'title' => 'Complete Q2 client proposal for Acme Corp',
                'description' => 'Prepare a comprehensive proposal including scope, timeline, budget breakdown, and team allocation for the Acme Corp account renewal.',
                'assigned_to' => $performers->first(),
                'priority' => 'high',
                'status' => 'in_progress',
                'progress' => 60,
                'due_date' => now()->addDays(3)->toDateString(),
                'department' => 'Business Development',
            ],
            [
                'title' => 'Review and update onboarding checklist templates',
                'description' => 'Review the current onboarding checklist templates for joiners and update items that are outdated or missing based on recent process changes.',
                'assigned_to' => $hr,
                'priority' => 'medium',
                'status' => 'todo',
                'progress' => 0,
                'due_date' => now()->addDays(7)->toDateString(),
                'department' => 'Project Management',
            ],
            [
                'title' => 'Edit and deliver brand campaign video — Apex client',
                'description' => 'Final cut of the 90-second brand video for Apex Financial. Incorporate all feedback from the last review session. Deliver by end of week.',
                'assigned_to' => $performers->get(0),
                'priority' => 'urgent',
                'status' => 'in_progress',
                'progress' => 80,
                'due_date' => now()->addDays(1)->toDateString(),
                'department' => 'Video & Production',
            ],
            [
                'title' => 'Write three LinkedIn articles for brand awareness campaign',
                'description' => 'Produce three 700-word LinkedIn articles aligned to the Q2 brand campaign themes: leadership, innovation, and sustainability. Submit drafts to Brand Manager for review.',
                'assigned_to' => $performers->get(2),
                'priority' => 'medium',
                'status' => 'todo',
                'progress' => 0,
                'due_date' => now()->addDays(10)->toDateString(),
                'department' => 'Content & Brand Comms',
            ],
            [
                'title' => 'Conduct mid-quarter OKR check-ins with all team leads',
                'description' => 'Schedule and conduct 30-minute check-in meetings with each team lead to review OKR progress, identify blockers, and update key result values.',
                'assigned_to' => $admin,
                'priority' => 'high',
                'status' => 'in_progress',
                'progress' => 40,
                'due_date' => now()->addDays(5)->toDateString(),
                'department' => 'Project Management',
            ],
            [
                'title' => 'Create graphic assets for May newsletter',
                'description' => 'Design header banner, section dividers, and featured image assets for the May company newsletter. Use the new brand guidelines.',
                'assigned_to' => $performers->get(1) ?? $performers->first(),
                'priority' => 'low',
                'status' => 'todo',
                'progress' => 0,
                'due_date' => now()->addDays(14)->toDateString(),
                'department' => 'Graphics Design',
            ],
            [
                'title' => 'Research and shortlist CRM platforms for BD team',
                'description' => 'Evaluate at least 3 CRM platforms (HubSpot, Salesforce, Pipedrive). Prepare a comparison report with pricing, features, and integration capabilities.',
                'assigned_to' => $performers->get(3) ?? $performers->first(),
                'priority' => 'medium',
                'status' => 'completed',
                'progress' => 100,
                'due_date' => now()->subDays(2)->toDateString(),
                'department' => 'Business Development',
            ],
            [
                'title' => 'Set up new joiner workstations for April intake',
                'description' => 'Configure three laptops with required software, VPN access, and email setup for the April joiners. Complete before their start date.',
                'assigned_to' => $admin,
                'priority' => 'high',
                'status' => 'completed',
                'progress' => 100,
                'due_date' => now()->subDays(5)->toDateString(),
                'department' => 'Project Management',
            ],
        ];

        foreach ($taskData as $t) {
            $assignedTo = $t['assigned_to'];
            if (! $assignedTo) {
                continue;
            }
            Task::firstOrCreate(
                ['title' => $t['title']],
                [
                    'assigned_to_user_id' => $assignedTo->id,
                    'assigned_by_user_id' => $admin->id,
                    'priority' => $t['priority'],
                    'status' => $t['status'],
                    'progress' => $t['progress'],
                    'due_date' => $t['due_date'],
                    'description' => $t['description'],
                    'department' => $t['department'],
                    'subtasks' => [],
                    'tags' => [],
                    'attachments' => [],
                ]
            );
        }

        // ── 13. Extra FAQ entries ───────────────────────────────────────────────

        $extraFaqs = [
            ['category' => 'General', 'sort_order' => 4, 'question' => 'Who do I contact for payroll discrepancies?', 'answer' => 'Contact HR directly via the Chat feature or email hr@company.com. Include your employee ID, the discrepancy amount, and the payroll period in question. Discrepancies are investigated and resolved within 5 business days.'],
            ['category' => 'IT & Access', 'sort_order' => 5, 'question' => 'How do I set up my company email on my phone?', 'answer' => 'Download the Microsoft Outlook app and use your company email as the login. Select "Work or School Account" when prompted. If you encounter issues, contact IT support for device-specific configuration help.'],
            ['category' => 'Leave & Benefits', 'sort_order' => 5, 'question' => 'Can I carry over unused leave to next year?', 'answer' => 'Up to 5 days of unused annual leave can be carried over to the following year. Any excess is forfeited unless you have received written approval from your line manager and HR. Carry-over leave must be used by March 31st of the new year.'],
        ];

        foreach ($extraFaqs as $faq) {
            FaqEntry::firstOrCreate(
                ['question' => $faq['question']],
                array_merge($faq, ['is_published' => true])
            );
        }
    }
}
