<?php

namespace Database\Seeders;

use App\Models\FaqEntry;
use Illuminate\Database\Seeder;

class FaqSeeder extends Seeder
{
    public function run(): void
    {
        $faqs = [
            // General
            ['category' => 'General', 'sort_order' => 1, 'question' => 'What are the office working hours?', 'answer' => 'Standard working hours are Monday to Friday, 8:00 AM – 5:00 PM. Flexible arrangements may be available depending on your team and role — speak with your line manager.'],
            ['category' => 'General', 'sort_order' => 2, 'question' => 'Where can I find the company calendar and public holidays?', 'answer' => 'The company calendar is accessible via the Announcements section. Public holidays for the current year are published at the start of each year and can also be found in the Policies section under "Leave Policy".'],
            ['category' => 'General', 'sort_order' => 3, 'question' => 'How do I update my personal details like phone number or address?', 'answer' => 'Navigate to Settings → Profile, then submit a profile change request. HR will review and apply the update within 2 business days.'],

            // IT & Access
            ['category' => 'IT & Access', 'sort_order' => 1, 'question' => 'How do I reset my platform password?', 'answer' => 'Click "Forgot Password" on the login page and follow the email instructions. If you do not receive the reset email within 5 minutes, check your spam folder or contact IT support.'],
            ['category' => 'IT & Access', 'sort_order' => 2, 'question' => 'I can\'t log in — what should I do?', 'answer' => 'First, ensure you are using your registered work email address. If the issue persists, contact IT support via the #it-help channel in Chat or email it@company.com with your employee ID.'],
            ['category' => 'IT & Access', 'sort_order' => 3, 'question' => 'How do I request access to a new system or tool?', 'answer' => 'Submit an Equipment/Access request via the Requests page. Provide the name of the system, your justification, and your line manager\'s name for approval. IT will process within 3 business days.'],
            ['category' => 'IT & Access', 'sort_order' => 4, 'question' => 'What devices are supported for remote access?', 'answer' => 'Company-issued laptops are the primary supported device. Personal devices may be used for accessing the HR platform only — core business systems require a company device. Contact IT for VPN setup assistance.'],

            // Leave & Benefits
            ['category' => 'Leave & Benefits', 'sort_order' => 1, 'question' => 'How many days of annual leave am I entitled to?', 'answer' => 'Full-time employees receive 20 days of annual leave per year. This is pro-rated for employees who join mid-year. Leave balances reset on January 1st and unused days (up to 5) may be carried forward.'],
            ['category' => 'Leave & Benefits', 'sort_order' => 2, 'question' => 'How do I request leave?', 'answer' => 'Go to Leave Requests in the sidebar, click "New Request", select your leave type and dates, then submit. Your line manager will receive an automatic notification and will approve or decline within 2 business days.'],
            ['category' => 'Leave & Benefits', 'sort_order' => 3, 'question' => 'What is the sick leave policy?', 'answer' => 'Employees are entitled to up to 10 days of paid sick leave per year. For absences longer than 3 consecutive days, a medical certificate is required. Notify your manager on the first day of illness.'],
            ['category' => 'Leave & Benefits', 'sort_order' => 4, 'question' => 'When is payday?', 'answer' => 'Salaries are processed on the last working day of each month. If payday falls on a weekend or public holiday, payment is made on the preceding working day. Contact HR for any payslip queries.'],

            // HR Processes
            ['category' => 'HR Processes', 'sort_order' => 1, 'question' => 'How does the performance evaluation process work?', 'answer' => 'Evaluations are conducted quarterly. You will receive a notification to cast your peer votes. Self-assessments and manager reviews are completed in the same cycle. Results are shared within 2 weeks of the evaluation period closing.'],
            ['category' => 'HR Processes', 'sort_order' => 2, 'question' => 'How do I apply for an internal job posting?', 'answer' => 'Open positions are listed under Job Openings in the sidebar. Click "View & Apply", read the description and requirements, then click "Apply Now" and submit your cover letter. Your application will be reviewed by HR and the hiring manager.'],
            ['category' => 'HR Processes', 'sort_order' => 3, 'question' => 'How do I submit a resource or budget request?', 'answer' => 'Navigate to Requests in the sidebar and click "New Request". Select the appropriate type (Invoice, Funds, Equipment, Budget Approval, or Procurement), fill in the details, and submit. Requests are reviewed by management within 3–5 business days.'],
        ];

        foreach ($faqs as $faq) {
            FaqEntry::firstOrCreate(
                ['question' => $faq['question']],
                array_merge($faq, ['is_published' => true])
            );
        }
    }
}
