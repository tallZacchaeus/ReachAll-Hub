<?php

use App\Http\Controllers\PageController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\LeaveRequestController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\ResourceRequestController;
use App\Http\Controllers\StaffEnrollmentController;
use App\Http\Controllers\TaskController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    if (Auth::check()) {
        return redirect()->route('dashboard');
    }

    return redirect()->route('login');
})->name('home');

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', [PageController::class, 'dashboard'])->name('dashboard');
    Route::get('evaluation', [PageController::class, 'evaluation'])->name('evaluation');
    Route::get('tasks', [TaskController::class, 'index'])->name('tasks');
    Route::post('tasks', [TaskController::class, 'store'])->name('tasks.store');
    Route::put('tasks/{task}', [TaskController::class, 'update'])->name('tasks.update');
    Route::patch('tasks/{task}/status', [TaskController::class, 'updateStatus'])->name('tasks.status');
    Route::post('tasks/{task}/comments', [TaskController::class, 'storeComment'])->name('tasks.comments.store');
    Route::delete('tasks/{task}', [TaskController::class, 'destroy'])->name('tasks.destroy');
    Route::get('chat', [PageController::class, 'chat'])->name('chat');
    Route::get('attendance-upload', [PageController::class, 'attendanceUpload'])->name('attendance-upload');
    Route::get('results', [PageController::class, 'results'])->name('results');
    Route::get('leaderboard', [PageController::class, 'leaderboard'])->name('leaderboard');
    Route::get('profile', [PageController::class, 'profile'])->name('profile');
    Route::get('leave', [LeaveRequestController::class, 'index'])->name('leave');
    Route::post('leave', [LeaveRequestController::class, 'store'])->name('leave.store');
    Route::patch('leave/{leaveRequest}/status', [LeaveRequestController::class, 'updateStatus'])->name('leave.status');
    Route::get('notifications', [PageController::class, 'notifications'])->name('notifications');
    Route::get('announcements', [PageController::class, 'announcements'])->name('announcements');
    Route::get('performance-review', [PageController::class, 'performanceReview'])->name('performance-review');
    Route::get('peer-review', [PageController::class, 'peerReview'])->name('peer-review');
    Route::get('reports', [ReportController::class, 'index'])->name('reports');
    Route::get('department-analytics', [PageController::class, 'departmentAnalytics'])->name('department-analytics');
    Route::get('staff-overview', [PageController::class, 'staffOverview'])->name('staff-overview');
    Route::get('progress-report', [PageController::class, 'progressReport'])->name('progress-report');
    Route::get('projects', [PageController::class, 'projects'])->name('projects');
    Route::get('requests', [ResourceRequestController::class, 'index'])->name('requests');
    Route::post('requests', [ResourceRequestController::class, 'store'])->name('requests.store');
    Route::post('requests/{resourceRequest}/comments', [ResourceRequestController::class, 'storeComment'])->name('requests.comments.store');
    Route::patch('requests/{resourceRequest}/status', [ResourceRequestController::class, 'updateStatus'])->name('requests.status');
    Route::get('attendance', [AttendanceController::class, 'index'])->name('attendance');
    Route::get('staff-enrollment', [StaffEnrollmentController::class, 'index'])->name('staff-enrollment');
    Route::post('staff-enrollment', [StaffEnrollmentController::class, 'store'])->name('staff-enrollment.store');
    Route::put('staff-enrollment/{user}', [StaffEnrollmentController::class, 'update'])->name('staff-enrollment.update');
    Route::patch('staff-enrollment/{user}/status', [StaffEnrollmentController::class, 'toggleStatus'])->name('staff-enrollment.toggle-status');
    Route::delete('staff-enrollment/{user}', [StaffEnrollmentController::class, 'destroy'])->name('staff-enrollment.destroy');
    Route::get('settings-overview', [PageController::class, 'settings'])->name('settings-overview');
    
    // Chat API routes
    Route::prefix('api/chat')->group(function () {
        Route::get('conversations', [\App\Http\Controllers\ChatController::class, 'getConversations']);
        Route::get('conversations/{conversationId}/messages', [\App\Http\Controllers\ChatController::class, 'getMessages']);
        Route::post('conversations/{conversationId}/messages', [\App\Http\Controllers\ChatController::class, 'sendMessage']);
        Route::get('direct-messages', [\App\Http\Controllers\ChatController::class, 'getDirectMessages']);
        Route::post('conversations', [\App\Http\Controllers\ChatController::class, 'createConversation']);
        
        // Message reactions
        Route::post('messages/{messageId}/reactions', [\App\Http\Controllers\ChatController::class, 'addReaction']);
        
        // Message editing and deletion
        Route::put('messages/{messageId}', [\App\Http\Controllers\ChatController::class, 'editMessage']);
        Route::delete('messages/{messageId}', [\App\Http\Controllers\ChatController::class, 'deleteMessage']);
        
        // Typing indicator
        Route::post('conversations/{conversationId}/typing', [\App\Http\Controllers\ChatController::class, 'typing']);
        
        // Search
        Route::get('conversations/{conversationId}/search', [\App\Http\Controllers\ChatController::class, 'searchMessages']);
        
        // File upload
        Route::post('conversations/{conversationId}/upload', [\App\Http\Controllers\ChatController::class, 'uploadFile']);
    });

    // Report Exports
    Route::prefix('reports')->group(function () {
        Route::get('/export-pdf', [ReportController::class, 'exportPDF'])->name('reports.export-pdf');
        Route::get('/export-csv', [ReportController::class, 'exportCSV'])->name('reports.export-csv');
        Route::get('/progress/export-pdf', [ReportController::class, 'exportProgressPDF'])->name('reports.progress.export-pdf');
        Route::get('/progress/export-csv', [ReportController::class, 'exportProgressCSV'])->name('reports.progress.export-csv');
    });

    // Employee Directory
    Route::get('directory', [\App\Http\Controllers\DirectoryController::class, 'index'])->name('directory');

    // Content pages (CMS)
    Route::get('content', [\App\Http\Controllers\ContentController::class, 'index'])->name('content.index');
    Route::get('content/{slug}', [\App\Http\Controllers\ContentController::class, 'show'])->name('content.show');

    // Admin content management
    Route::get('admin/content', [\App\Http\Controllers\ContentController::class, 'adminIndex'])->name('admin.content.index');
    Route::get('admin/content/create', [\App\Http\Controllers\ContentController::class, 'create'])->name('admin.content.create');
    Route::post('admin/content', [\App\Http\Controllers\ContentController::class, 'store'])->name('admin.content.store');
    Route::get('admin/content/{id}/edit', [\App\Http\Controllers\ContentController::class, 'edit'])->name('admin.content.edit');
    Route::put('admin/content/{id}', [\App\Http\Controllers\ContentController::class, 'update'])->name('admin.content.update');
    Route::delete('admin/content/{id}', [\App\Http\Controllers\ContentController::class, 'destroy'])->name('admin.content.destroy');

    // Newsletters (staff)
    Route::get('newsletters', [\App\Http\Controllers\NewsletterController::class, 'index'])->name('newsletters.index');
    Route::get('newsletters/{id}', [\App\Http\Controllers\NewsletterController::class, 'show'])->name('newsletters.show');

    // Newsletters (admin)
    Route::get('admin/newsletters', [\App\Http\Controllers\NewsletterController::class, 'adminIndex'])->name('admin.newsletters.index');
    Route::get('admin/newsletters/create', [\App\Http\Controllers\NewsletterController::class, 'create'])->name('admin.newsletters.create');
    Route::post('admin/newsletters', [\App\Http\Controllers\NewsletterController::class, 'store'])->name('admin.newsletters.store');
    Route::get('admin/newsletters/{id}/edit', [\App\Http\Controllers\NewsletterController::class, 'edit'])->name('admin.newsletters.edit');
    Route::put('admin/newsletters/{id}', [\App\Http\Controllers\NewsletterController::class, 'update'])->name('admin.newsletters.update');
    Route::post('admin/newsletters/{id}/publish', [\App\Http\Controllers\NewsletterController::class, 'publish'])->name('admin.newsletters.publish');
    Route::delete('admin/newsletters/{id}', [\App\Http\Controllers\NewsletterController::class, 'destroy'])->name('admin.newsletters.destroy');

    // Bulletins (staff)
    Route::get('bulletins', [\App\Http\Controllers\BulletinController::class, 'index'])->name('bulletins.index');

    // Bulletins (admin)
    Route::get('admin/bulletins', [\App\Http\Controllers\BulletinController::class, 'adminIndex'])->name('admin.bulletins.index');
    Route::get('admin/bulletins/create', [\App\Http\Controllers\BulletinController::class, 'create'])->name('admin.bulletins.create');
    Route::post('admin/bulletins', [\App\Http\Controllers\BulletinController::class, 'store'])->name('admin.bulletins.store');
    Route::get('admin/bulletins/{id}/edit', [\App\Http\Controllers\BulletinController::class, 'edit'])->name('admin.bulletins.edit');
    Route::put('admin/bulletins/{id}', [\App\Http\Controllers\BulletinController::class, 'update'])->name('admin.bulletins.update');
    Route::patch('admin/bulletins/{id}/pin', [\App\Http\Controllers\BulletinController::class, 'togglePin'])->name('admin.bulletins.pin');
    Route::delete('admin/bulletins/{id}', [\App\Http\Controllers\BulletinController::class, 'destroy'])->name('admin.bulletins.destroy');

    // Onboarding hub
    Route::get('onboarding', [PageController::class, 'onboarding'])->name('onboarding');

    // Checklists (staff)
    Route::get('checklists', [\App\Http\Controllers\ChecklistController::class, 'index'])->name('checklists');
    Route::post('checklists/{itemId}/toggle', [\App\Http\Controllers\ChecklistController::class, 'toggle'])->name('checklists.toggle');

    // Checklists (admin)
    Route::get('admin/checklists', [\App\Http\Controllers\ChecklistController::class, 'adminIndex'])->name('admin.checklists');
    Route::post('admin/checklists', [\App\Http\Controllers\ChecklistController::class, 'store'])->name('admin.checklists.store');
    Route::put('admin/checklists/{id}', [\App\Http\Controllers\ChecklistController::class, 'update'])->name('admin.checklists.update');

    // Acknowledgements
    Route::get('acknowledgements/pending', [\App\Http\Controllers\AcknowledgementController::class, 'pending'])->name('acknowledgements.pending');
    Route::post('acknowledgements/{contentPageId}', [\App\Http\Controllers\AcknowledgementController::class, 'acknowledge'])->name('acknowledgements.acknowledge');
    Route::get('admin/acknowledgements', [\App\Http\Controllers\AcknowledgementController::class, 'adminReport'])->name('admin.acknowledgements');

    // Job Postings (staff)
    Route::get('jobs', [\App\Http\Controllers\JobPostingController::class, 'index'])->name('jobs');
    Route::get('jobs/{id}', [\App\Http\Controllers\JobPostingController::class, 'show'])->name('jobs.show');
    Route::post('jobs/{id}/apply', [\App\Http\Controllers\JobPostingController::class, 'apply'])->name('jobs.apply');

    // Job Postings (admin)
    Route::get('admin/jobs', [\App\Http\Controllers\JobPostingController::class, 'adminIndex'])->name('admin.jobs.index');
    Route::post('admin/jobs', [\App\Http\Controllers\JobPostingController::class, 'store'])->name('admin.jobs.store');
    Route::get('admin/jobs/{id}/edit', [\App\Http\Controllers\JobPostingController::class, 'edit'])->name('admin.jobs.edit');
    Route::put('admin/jobs/{id}', [\App\Http\Controllers\JobPostingController::class, 'update'])->name('admin.jobs.update');
    Route::delete('admin/jobs/{id}', [\App\Http\Controllers\JobPostingController::class, 'destroy'])->name('admin.jobs.destroy');
    Route::patch('admin/jobs/applications/{applicationId}', [\App\Http\Controllers\JobPostingController::class, 'updateApplicationStatus'])->name('admin.jobs.applications.status');

    // Recognition
    Route::get('recognition', [\App\Http\Controllers\RecognitionController::class, 'index'])->name('recognition');
    Route::post('recognition', [\App\Http\Controllers\RecognitionController::class, 'store'])->name('recognition.store');
    Route::get('recognition/mine', [\App\Http\Controllers\RecognitionController::class, 'myRecognitions'])->name('recognition.mine');

    // Learning (staff)
    Route::get('learning', [\App\Http\Controllers\LearningController::class, 'index'])->name('learning');
    Route::get('learning/{id}', [\App\Http\Controllers\LearningController::class, 'show'])->name('learning.show');
    Route::post('learning/{id}/enroll', [\App\Http\Controllers\LearningController::class, 'enroll'])->name('learning.enroll');
    Route::post('learning/{id}/progress', [\App\Http\Controllers\LearningController::class, 'updateProgress'])->name('learning.progress');

    // Learning (admin)
    Route::get('admin/courses', [\App\Http\Controllers\LearningController::class, 'adminIndex'])->name('admin.courses.index');
    Route::get('admin/courses/create', [\App\Http\Controllers\LearningController::class, 'create'])->name('admin.courses.create');
    Route::post('admin/courses', [\App\Http\Controllers\LearningController::class, 'store'])->name('admin.courses.store');
    Route::get('admin/courses/{id}/edit', [\App\Http\Controllers\LearningController::class, 'edit'])->name('admin.courses.edit');
    Route::put('admin/courses/{id}', [\App\Http\Controllers\LearningController::class, 'update'])->name('admin.courses.update');
    Route::delete('admin/courses/{id}', [\App\Http\Controllers\LearningController::class, 'destroy'])->name('admin.courses.destroy');

    // Team Dashboard
    Route::get('team', [\App\Http\Controllers\TeamController::class, 'dashboard'])->name('team');

    // OKRs
    Route::get('okrs', [\App\Http\Controllers\OKRController::class, 'index'])->name('okrs');
    Route::post('okrs', [\App\Http\Controllers\OKRController::class, 'store'])->name('okrs.store');
    Route::get('okrs/{id}', [\App\Http\Controllers\OKRController::class, 'show'])->name('okrs.show');
    Route::put('okrs/{id}', [\App\Http\Controllers\OKRController::class, 'update'])->name('okrs.update');
    Route::patch('okrs/key-results/{id}', [\App\Http\Controllers\OKRController::class, 'updateKeyResult'])->name('okrs.kr.update');

    // FAQs (staff)
    Route::get('faqs', [\App\Http\Controllers\FaqController::class, 'index'])->name('faqs');

    // FAQs (admin)
    Route::get('admin/faqs', [\App\Http\Controllers\FaqController::class, 'adminIndex'])->name('admin.faqs.index');
    Route::post('admin/faqs', [\App\Http\Controllers\FaqController::class, 'store'])->name('admin.faqs.store');
    Route::put('admin/faqs/{id}', [\App\Http\Controllers\FaqController::class, 'update'])->name('admin.faqs.update');
    Route::delete('admin/faqs/{id}', [\App\Http\Controllers\FaqController::class, 'destroy'])->name('admin.faqs.destroy');

    // Global Search
    Route::get('search', [\App\Http\Controllers\SearchController::class, 'search'])->name('search');

    // ── Finance: Authenticated document downloads (D8-01) ─────────────────
    // All sensitive finance files live on the private 'finance' disk.
    // These endpoints enforce policy-level access before streaming the file.
    Route::prefix('finance/documents')->group(function () {
        Route::get('invoice/{invoice}',
            [\App\Http\Controllers\Finance\DocumentDownloadController::class, 'invoice'])
            ->name('finance.document.invoice');
        Route::get('goods-receipt/{receipt}',
            [\App\Http\Controllers\Finance\DocumentDownloadController::class, 'goodsReceipt'])
            ->name('finance.document.goods-receipt');
        Route::get('payment-proof/{payment}',
            [\App\Http\Controllers\Finance\DocumentDownloadController::class, 'paymentProof'])
            ->name('finance.document.payment-proof');
        Route::get('close-report/{period}',
            [\App\Http\Controllers\Finance\DocumentDownloadController::class, 'closeReport'])
            ->name('finance.document.close-report');
        Route::get('requisition/{requisition}/doc/{docIndex}',
            [\App\Http\Controllers\Finance\DocumentDownloadController::class, 'requisitionDoc'])
            ->name('finance.document.requisition-doc');
        Route::get('receipt/{transaction}',
            [\App\Http\Controllers\Finance\DocumentDownloadController::class, 'receipt'])
            ->name('finance.document.receipt');
    });

    // ── Finance: Read-only routes (no rate limit beyond auth) ───────────────
    Route::prefix('finance')->group(function () {
        // Requisitions — read
        Route::prefix('requisitions')->group(function () {
            Route::get('/',        [\App\Http\Controllers\Finance\RequisitionController::class, 'index'])->name('finance.requisitions.index');
            Route::get('/create',  [\App\Http\Controllers\Finance\RequisitionController::class, 'create'])->name('finance.requisitions.create');
            Route::get('/{id}',    [\App\Http\Controllers\Finance\RequisitionController::class, 'show'])->name('finance.requisitions.show');
        });
        // Approvals — read
        Route::prefix('approvals')->group(function () {
            Route::get('/',      [\App\Http\Controllers\Finance\ApprovalController::class, 'index'])->name('finance.approvals.index');
            Route::get('/{id}',  [\App\Http\Controllers\Finance\ApprovalController::class, 'show'])->name('finance.approvals.show');
        });
        // Petty Cash — read
        Route::get('petty-cash', [\App\Http\Controllers\Finance\PettyCashController::class, 'show'])->name('finance.petty-cash.show');
        // Reconciliation — read
        Route::prefix('reconciliation')->group(function () {
            Route::get('/',       [\App\Http\Controllers\Finance\ReconciliationController::class, 'index'])->name('finance.reconciliation.index');
            Route::get('/{id}',   [\App\Http\Controllers\Finance\ReconciliationController::class, 'show'])->name('finance.reconciliation.show');
        });
        // Matching — read
        Route::get('matching', [\App\Http\Controllers\Finance\MatchingController::class, 'index'])->name('finance.matching.index');
        // Payments — read
        Route::get('payments', [\App\Http\Controllers\Finance\PaymentController::class, 'index'])->name('finance.payments.index');
        // Dashboard, reports, help, go-live — read
        Route::get('dashboard', [\App\Http\Controllers\Finance\DashboardController::class, 'index'])->name('finance.dashboard');
        Route::prefix('reports')->group(function () {
            Route::get('/',            [\App\Http\Controllers\Finance\ReportsController::class, 'index'])->name('finance.reports.index');
            Route::get('export/excel', [\App\Http\Controllers\Finance\ReportsController::class, 'exportExcel'])->name('finance.reports.excel');
            Route::get('export/pdf',   [\App\Http\Controllers\Finance\ReportsController::class, 'exportPdf'])->name('finance.reports.pdf');
        });
        Route::get('period-close', [\App\Http\Controllers\Finance\PeriodCloseController::class, 'index'])->name('finance.period-close.index');
        Route::prefix('help')->group(function () {
            Route::get('getting-started', [\App\Http\Controllers\Finance\HelpController::class, 'gettingStarted'])->name('finance.help.getting-started');
            Route::get('approvers',       [\App\Http\Controllers\Finance\HelpController::class, 'approvers'])->name('finance.help.approvers');
            Route::get('finance-team',    [\App\Http\Controllers\Finance\HelpController::class, 'financeTeam'])->name('finance.help.finance-team');
        });
        Route::get('go-live', [\App\Http\Controllers\Finance\GoLiveController::class, 'index'])->name('finance.go-live');
        Route::get('audit-log', [\App\Http\Controllers\Finance\AuditLogController::class, 'index'])->name('finance.audit-log');
        Route::prefix('admin')->group(function () {
            Route::get('cost-centres',   [\App\Http\Controllers\Finance\CostCentreController::class, 'index'])->name('finance.cost-centres.index');
            Route::get('account-codes',  [\App\Http\Controllers\Finance\AccountCodeController::class, 'index'])->name('finance.account-codes.index');
            Route::get('vendors',        [\App\Http\Controllers\Finance\VendorController::class, 'index'])->name('finance.vendors.index');
        });
    });

    // ── Finance: State-changing routes (throttle: 30 writes/minute/user) ────
    Route::prefix('finance')->middleware('throttle:30,1')->group(function () {
        // Requisitions — write
        Route::post('requisitions',               [\App\Http\Controllers\Finance\RequisitionController::class, 'store'])->name('finance.requisitions.store');
        Route::put('requisitions/{id}',           [\App\Http\Controllers\Finance\RequisitionController::class, 'update'])->name('finance.requisitions.update');
        Route::post('requisitions/{id}/cancel',   [\App\Http\Controllers\Finance\RequisitionController::class, 'cancel'])->name('finance.requisitions.cancel');
        // Approvals — write
        Route::post('approvals/steps/{stepId}/decide', [\App\Http\Controllers\Finance\ApprovalController::class, 'decide'])->name('finance.approvals.decide');
        // Petty Cash — write
        Route::post('petty-cash/expense',        [\App\Http\Controllers\Finance\PettyCashController::class, 'expense'])->name('finance.petty-cash.expense');
        Route::post('petty-cash/reconciliation', [\App\Http\Controllers\Finance\PettyCashController::class, 'submitReconciliation'])->name('finance.petty-cash.reconciliation');
        // Reconciliation — write
        Route::post('reconciliation/{id}/approve', [\App\Http\Controllers\Finance\ReconciliationController::class, 'approve'])->name('finance.reconciliation.approve');
        Route::post('reconciliation/{id}/reject',  [\App\Http\Controllers\Finance\ReconciliationController::class, 'reject'])->name('finance.reconciliation.reject');
        // Matching — write
        Route::post('matching/{id}/upload',          [\App\Http\Controllers\Finance\MatchingController::class, 'upload'])->name('finance.matching.upload');
        Route::post('matching/{id}/match',           [\App\Http\Controllers\Finance\MatchingController::class, 'match'])->name('finance.matching.match');
        Route::post('matching/{id}/accept-variance', [\App\Http\Controllers\Finance\MatchingController::class, 'acceptVariance'])->name('finance.matching.accept-variance');
        // Payments — write
        Route::post('payments/{id}/pay',  [\App\Http\Controllers\Finance\PaymentController::class, 'pay'])->name('finance.payments.pay');
        Route::post('payments/{id}/void', [\App\Http\Controllers\Finance\PaymentController::class, 'voidPayment'])->name('finance.payments.void');
        // Period Close — write
        Route::post('period-close/initiate',    [\App\Http\Controllers\Finance\PeriodCloseController::class, 'initiate'])->name('finance.period-close.initiate');
        Route::post('period-close/waive',       [\App\Http\Controllers\Finance\PeriodCloseController::class, 'waive'])->name('finance.period-close.waive');
        Route::post('period-close/co-authorize', [\App\Http\Controllers\Finance\PeriodCloseController::class, 'coAuthorize'])->name('finance.period-close.co-authorize');
        Route::post('period-close/close',       [\App\Http\Controllers\Finance\PeriodCloseController::class, 'close'])->name('finance.period-close.close');
        Route::post('period-close/reopen',      [\App\Http\Controllers\Finance\PeriodCloseController::class, 'reopen'])->name('finance.period-close.reopen');
        // Admin — write
        Route::post('admin/cost-centres',          [\App\Http\Controllers\Finance\CostCentreController::class, 'store'])->name('finance.cost-centres.store');
        Route::put('admin/cost-centres/{id}',      [\App\Http\Controllers\Finance\CostCentreController::class, 'update'])->name('finance.cost-centres.update');
        Route::post('admin/account-codes',         [\App\Http\Controllers\Finance\AccountCodeController::class, 'store'])->name('finance.account-codes.store');
        Route::put('admin/account-codes/{id}',     [\App\Http\Controllers\Finance\AccountCodeController::class, 'update'])->name('finance.account-codes.update');
        Route::post('admin/vendors',               [\App\Http\Controllers\Finance\VendorController::class, 'store'])->name('finance.vendors.store');
        Route::put('admin/vendors/{id}',           [\App\Http\Controllers\Finance\VendorController::class, 'update'])->name('finance.vendors.update');
        // Archive (not delete) — financial entities are immutable; status='archived' instead of hard-delete
        Route::delete('admin/vendors/{id}',        [\App\Http\Controllers\Finance\VendorController::class, 'destroy'])->name('finance.vendors.destroy');
        Route::delete('admin/cost-centres/{id}',   [\App\Http\Controllers\Finance\CostCentreController::class, 'destroy'])->name('finance.cost-centres.destroy');
    });

    // Profile Change Requests
    Route::post('/profile/update', [\App\Http\Controllers\ProfileController::class, 'submitRequest'])->name('profile.request-update');
    Route::get('/admin/profile-requests', [\App\Http\Controllers\ProfileController::class, 'adminIndex'])->name('admin.profile-requests');
    Route::post('/admin/profile-requests/{id}/approve', [\App\Http\Controllers\ProfileController::class, 'approveRequest'])->name('admin.profile-requests.approve');
    Route::post('/admin/profile-requests/{id}/reject', [\App\Http\Controllers\ProfileController::class, 'rejectRequest'])->name('admin.profile-requests.reject');

    // Role & Permission Management (superadmin only)
    Route::get('/admin/roles', [\App\Http\Controllers\Admin\RoleController::class, 'index'])->name('admin.roles.index');
    Route::post('/admin/roles', [\App\Http\Controllers\Admin\RoleController::class, 'store'])->name('admin.roles.store');
    Route::put('/admin/roles/{role}', [\App\Http\Controllers\Admin\RoleController::class, 'update'])->name('admin.roles.update');
    Route::delete('/admin/roles/{role}', [\App\Http\Controllers\Admin\RoleController::class, 'destroy'])->name('admin.roles.destroy');

    // Org Structure Management (hr + superadmin)
    Route::get('/admin/org/departments', [\App\Http\Controllers\Admin\DepartmentController::class, 'index'])->name('admin.org.departments');
    Route::post('/admin/org/departments', [\App\Http\Controllers\Admin\DepartmentController::class, 'store'])->name('admin.org.departments.store');
    Route::put('/admin/org/departments/{department}', [\App\Http\Controllers\Admin\DepartmentController::class, 'update'])->name('admin.org.departments.update');
    Route::delete('/admin/org/departments/{department}', [\App\Http\Controllers\Admin\DepartmentController::class, 'destroy'])->name('admin.org.departments.destroy');

    Route::get('/admin/org/positions', [\App\Http\Controllers\Admin\JobPositionController::class, 'index'])->name('admin.org.positions');
    Route::post('/admin/org/positions', [\App\Http\Controllers\Admin\JobPositionController::class, 'store'])->name('admin.org.positions.store');
    Route::put('/admin/org/positions/{jobPosition}', [\App\Http\Controllers\Admin\JobPositionController::class, 'update'])->name('admin.org.positions.update');
    Route::delete('/admin/org/positions/{jobPosition}', [\App\Http\Controllers\Admin\JobPositionController::class, 'destroy'])->name('admin.org.positions.destroy');

    Route::get('/admin/org/locations', [\App\Http\Controllers\Admin\OfficeLocationController::class, 'index'])->name('admin.org.locations');
    Route::post('/admin/org/locations', [\App\Http\Controllers\Admin\OfficeLocationController::class, 'store'])->name('admin.org.locations.store');
    Route::put('/admin/org/locations/{officeLocation}', [\App\Http\Controllers\Admin\OfficeLocationController::class, 'update'])->name('admin.org.locations.update');
    Route::delete('/admin/org/locations/{officeLocation}', [\App\Http\Controllers\Admin\OfficeLocationController::class, 'destroy'])->name('admin.org.locations.destroy');

    // Org Chart (anyone with admin.dashboard)
    Route::get('/admin/org/chart', [\App\Http\Controllers\Admin\OrgChartController::class, 'index'])->name('admin.org.chart');

    // ── HR Document Vault (documents.manage = hr/superadmin) ──────────────
    Route::get('/admin/hr/documents', [\App\Http\Controllers\Admin\HrDocumentController::class, 'index'])->name('admin.hr.documents');
    Route::post('/admin/hr/documents', [\App\Http\Controllers\Admin\HrDocumentController::class, 'store'])->name('admin.hr.documents.store');
    Route::put('/admin/hr/documents/{hrDocument}', [\App\Http\Controllers\Admin\HrDocumentController::class, 'update'])->name('admin.hr.documents.update');
    Route::delete('/admin/hr/documents/{hrDocument}', [\App\Http\Controllers\Admin\HrDocumentController::class, 'destroy'])->name('admin.hr.documents.destroy');

    // Authenticated private download (replaces any public URL)
    Route::get('/admin/hr/documents/{hrDocument}/download', [\App\Http\Controllers\Admin\HrDocumentDownloadController::class, 'show'])->name('admin.hr.documents.download');

    // ── Employee: My Documents + E-Sign ───────────────────────────────────
    Route::get('/my-documents', [\App\Http\Controllers\HrDocumentSelfController::class, 'index'])->name('my.documents');
    Route::post('/my-documents/{hrDocument}/sign', [\App\Http\Controllers\DocumentSignatureController::class, 'sign'])->name('my.documents.sign');
    Route::post('/my-documents/{hrDocument}/decline', [\App\Http\Controllers\DocumentSignatureController::class, 'decline'])->name('my.documents.decline');
    Route::get('/my-documents/{hrDocument}/download', [\App\Http\Controllers\HrDocumentSelfController::class, 'download'])->name('my.documents.download');

    // ── Benefits Administration ───────────────────────────────────────────
    Route::prefix('benefits')->name('benefits.')->group(function () {
        // Plan catalog (benefits.manage)
        Route::get('/plans', [\App\Http\Controllers\Benefits\BenefitPlanController::class, 'index'])->name('plans.index');
        Route::post('/plans', [\App\Http\Controllers\Benefits\BenefitPlanController::class, 'store'])->name('plans.store');
        Route::put('/plans/{benefitPlan}', [\App\Http\Controllers\Benefits\BenefitPlanController::class, 'update'])->name('plans.update');
        Route::delete('/plans/{benefitPlan}', [\App\Http\Controllers\Benefits\BenefitPlanController::class, 'destroy'])->name('plans.destroy');

        // Enrollment management (benefits.manage)
        Route::get('/enrollments', [\App\Http\Controllers\Benefits\BenefitEnrollmentController::class, 'index'])->name('enrollments.index');
        Route::post('/enrollments', [\App\Http\Controllers\Benefits\BenefitEnrollmentController::class, 'store'])->name('enrollments.store');
        Route::post('/enrollments/{employeeBenefitEnrollment}/terminate', [\App\Http\Controllers\Benefits\BenefitEnrollmentController::class, 'terminate'])->name('enrollments.terminate');

        // Enrollment windows (benefits.manage)
        Route::post('/windows', [\App\Http\Controllers\Benefits\EnrollmentWindowController::class, 'store'])->name('windows.store');
        Route::post('/windows/{benefitEnrollmentWindow}/open', [\App\Http\Controllers\Benefits\EnrollmentWindowController::class, 'open'])->name('windows.open');
        Route::post('/windows/{benefitEnrollmentWindow}/process', [\App\Http\Controllers\Benefits\EnrollmentWindowController::class, 'process'])->name('windows.process');
        Route::delete('/windows/{benefitEnrollmentWindow}', [\App\Http\Controllers\Benefits\EnrollmentWindowController::class, 'destroy'])->name('windows.destroy');

        // Employee self-service (benefits.self-enroll)
        Route::get('/my-benefits', [\App\Http\Controllers\Benefits\BenefitSelfController::class, 'index'])->name('my');
        Route::post('/my-benefits/election', [\App\Http\Controllers\Benefits\BenefitSelfController::class, 'saveElection'])->name('my.election');
        Route::post('/my-benefits/submit', [\App\Http\Controllers\Benefits\BenefitSelfController::class, 'submitElections'])->name('my.submit');
        Route::post('/my-benefits/dependents', [\App\Http\Controllers\Benefits\BenefitSelfController::class, 'storeDependent'])->name('my.dependents.store');
        Route::put('/my-benefits/dependents/{employeeDependent}', [\App\Http\Controllers\Benefits\BenefitSelfController::class, 'updateDependent'])->name('my.dependents.update');
        Route::delete('/my-benefits/dependents/{employeeDependent}', [\App\Http\Controllers\Benefits\BenefitSelfController::class, 'removeDependent'])->name('my.dependents.remove');
    });

    // ── Payroll: Runs + Salaries (payroll.manage / payroll.view) ─────────
    Route::prefix('payroll')->name('payroll.')->group(function () {
        // Payroll runs
        Route::get('/runs', [\App\Http\Controllers\Payroll\PayrollRunController::class, 'index'])->name('runs.index');
        Route::post('/runs', [\App\Http\Controllers\Payroll\PayrollRunController::class, 'store'])->name('runs.store');
        Route::get('/runs/{payrollRun}', [\App\Http\Controllers\Payroll\PayrollRunController::class, 'show'])->name('runs.show');
        Route::post('/runs/{payrollRun}/approve', [\App\Http\Controllers\Payroll\PayrollRunController::class, 'approve'])->name('runs.approve');
        Route::post('/runs/{payrollRun}/mark-paid', [\App\Http\Controllers\Payroll\PayrollRunController::class, 'markPaid'])->name('runs.mark-paid');
        Route::post('/runs/{payrollRun}/generate-payslips', [\App\Http\Controllers\Payroll\PayrollRunController::class, 'generatePayslips'])->name('runs.generate-payslips');
        Route::get('/runs/{payrollRun}/export-bank', [\App\Http\Controllers\Payroll\PayrollRunController::class, 'exportBankFile'])->name('runs.export-bank');

        // Salary management
        Route::get('/salaries', [\App\Http\Controllers\Payroll\SalaryController::class, 'index'])->name('salaries.index');
        Route::post('/salaries', [\App\Http\Controllers\Payroll\SalaryController::class, 'store'])->name('salaries.store');
        Route::delete('/salaries/{employeeSalary}', [\App\Http\Controllers\Payroll\SalaryController::class, 'destroy'])->name('salaries.destroy');

        // Employee self-service payslips
        Route::get('/my-payslips', [\App\Http\Controllers\Payroll\PayslipController::class, 'index'])->name('my-payslips');
        Route::get('/payslip/{payrollEntry}/download', [\App\Http\Controllers\Payroll\PayslipController::class, 'download'])->name('payslip.download');
    });

    // ── Compensation Management ───────────────────────────────────────────
    Route::prefix('compensation')->name('compensation.')->group(function () {
        // Salary bands (compensation.manage)
        Route::get('/bands', [\App\Http\Controllers\Compensation\CompensationBandController::class, 'index'])->name('bands.index');
        Route::post('/bands', [\App\Http\Controllers\Compensation\CompensationBandController::class, 'store'])->name('bands.store');
        Route::put('/bands/{compensationBand}', [\App\Http\Controllers\Compensation\CompensationBandController::class, 'update'])->name('bands.update');
        Route::delete('/bands/{compensationBand}', [\App\Http\Controllers\Compensation\CompensationBandController::class, 'destroy'])->name('bands.destroy');

        // Review cycles (compensation.manage)
        Route::get('/reviews', [\App\Http\Controllers\Compensation\CompensationReviewController::class, 'index'])->name('reviews.index');
        Route::post('/reviews', [\App\Http\Controllers\Compensation\CompensationReviewController::class, 'store'])->name('reviews.store');
        Route::get('/reviews/{compensationReviewCycle}', [\App\Http\Controllers\Compensation\CompensationReviewController::class, 'show'])->name('reviews.show');
        Route::post('/reviews/{compensationReviewCycle}/activate', [\App\Http\Controllers\Compensation\CompensationReviewController::class, 'activate'])->name('reviews.activate');
        Route::post('/reviews/{compensationReviewCycle}/close', [\App\Http\Controllers\Compensation\CompensationReviewController::class, 'close'])->name('reviews.close');
        Route::put('/review-entries/{compensationReviewEntry}', [\App\Http\Controllers\Compensation\CompensationReviewController::class, 'updateEntry'])->name('review-entries.update');
        Route::post('/review-entries/{compensationReviewEntry}/approve', [\App\Http\Controllers\Compensation\CompensationReviewController::class, 'approveEntry'])->name('review-entries.approve');
        Route::post('/review-entries/{compensationReviewEntry}/reject', [\App\Http\Controllers\Compensation\CompensationReviewController::class, 'rejectEntry'])->name('review-entries.reject');

        // Bonus plans (compensation.manage)
        Route::get('/bonus', [\App\Http\Controllers\Compensation\BonusPlanController::class, 'index'])->name('bonus.index');
        Route::post('/bonus', [\App\Http\Controllers\Compensation\BonusPlanController::class, 'store'])->name('bonus.store');
        Route::post('/bonus/{bonusPlan}/activate', [\App\Http\Controllers\Compensation\BonusPlanController::class, 'activate'])->name('bonus.activate');
        Route::post('/bonus/{bonusPlan}/close', [\App\Http\Controllers\Compensation\BonusPlanController::class, 'close'])->name('bonus.close');
        Route::post('/bonus/{bonusPlan}/awards', [\App\Http\Controllers\Compensation\BonusPlanController::class, 'addAward'])->name('bonus.awards.add');
        Route::post('/bonus-awards/{bonusAward}/approve', [\App\Http\Controllers\Compensation\BonusPlanController::class, 'approveAward'])->name('bonus.awards.approve');
        Route::post('/bonus-awards/{bonusAward}/mark-paid', [\App\Http\Controllers\Compensation\BonusPlanController::class, 'markPaid'])->name('bonus.awards.mark-paid');
        Route::delete('/bonus-awards/{bonusAward}', [\App\Http\Controllers\Compensation\BonusPlanController::class, 'removeAward'])->name('bonus.awards.remove');

        // Employee self-service total rewards (compensation.self)
        Route::get('/my-rewards', [\App\Http\Controllers\Compensation\TotalRewardsController::class, 'index'])->name('my-rewards');
    });

    // ── Recruitment / ATS ─────────────────────────────────────────────────
    Route::prefix('recruitment')->name('recruitment.')->group(function () {
        // Job requisitions (recruitment.manage | recruitment.view)
        Route::get('/requisitions', [\App\Http\Controllers\Recruitment\JobRequisitionController::class, 'index'])->name('requisitions.index');
        Route::post('/requisitions', [\App\Http\Controllers\Recruitment\JobRequisitionController::class, 'store'])->name('requisitions.store');
        Route::post('/requisitions/{jobRequisition}/approve', [\App\Http\Controllers\Recruitment\JobRequisitionController::class, 'approve'])->name('requisitions.approve');
        Route::post('/requisitions/{jobRequisition}/reject', [\App\Http\Controllers\Recruitment\JobRequisitionController::class, 'reject'])->name('requisitions.reject');
        Route::post('/requisitions/{jobRequisition}/link-posting', [\App\Http\Controllers\Recruitment\JobRequisitionController::class, 'linkPosting'])->name('requisitions.link-posting');

        // Candidate pool (recruitment.manage | recruitment.view)
        Route::get('/candidates', [\App\Http\Controllers\Recruitment\CandidateController::class, 'index'])->name('candidates.index');
        Route::post('/candidates', [\App\Http\Controllers\Recruitment\CandidateController::class, 'store'])->name('candidates.store');
        Route::put('/candidates/{candidate}', [\App\Http\Controllers\Recruitment\CandidateController::class, 'update'])->name('candidates.update');
        Route::get('/candidates/{candidate}/resume', [\App\Http\Controllers\Recruitment\CandidateController::class, 'downloadResume'])->name('candidates.resume');

        // Application pipeline (recruitment.manage | recruitment.view | recruitment.interview)
        Route::get('/pipeline', [\App\Http\Controllers\Recruitment\ApplicationPipelineController::class, 'index'])->name('pipeline.index');
        Route::get('/pipeline/{jobApplication}', [\App\Http\Controllers\Recruitment\ApplicationPipelineController::class, 'show'])->name('pipeline.show');
        Route::post('/pipeline/{jobApplication}/stage', [\App\Http\Controllers\Recruitment\ApplicationPipelineController::class, 'advanceStage'])->name('pipeline.stage');
        Route::post('/pipeline/add-external', [\App\Http\Controllers\Recruitment\ApplicationPipelineController::class, 'addExternalApplication'])->name('pipeline.add-external');

        // Interview scheduling (recruitment.manage | recruitment.interview)
        Route::post('/pipeline/{jobApplication}/interviews', [\App\Http\Controllers\Recruitment\InterviewController::class, 'schedule'])->name('interviews.schedule');
        Route::put('/interviews/{interviewSchedule}/status', [\App\Http\Controllers\Recruitment\InterviewController::class, 'updateStatus'])->name('interviews.status');
        Route::post('/interviews/{interviewSchedule}/scorecards', [\App\Http\Controllers\Recruitment\InterviewController::class, 'submitScorecard'])->name('interviews.scorecards.submit');
        Route::delete('/scorecards/{interviewScorecard}', [\App\Http\Controllers\Recruitment\InterviewController::class, 'destroyScorecard'])->name('scorecards.destroy');

        // Offer letters (recruitment.manage)
        Route::post('/pipeline/{jobApplication}/offer', [\App\Http\Controllers\Recruitment\OfferLetterController::class, 'store'])->name('offers.store');
        Route::post('/offers/{offerLetter}/send', [\App\Http\Controllers\Recruitment\OfferLetterController::class, 'send'])->name('offers.send');
        Route::post('/offers/{offerLetter}/respond', [\App\Http\Controllers\Recruitment\OfferLetterController::class, 'respond'])->name('offers.respond');
        Route::post('/offers/{offerLetter}/withdraw', [\App\Http\Controllers\Recruitment\OfferLetterController::class, 'withdraw'])->name('offers.withdraw');
        Route::get('/offers/{offerLetter}/download', [\App\Http\Controllers\Recruitment\OfferLetterController::class, 'download'])->name('offers.download');
    });

    // ── Employee Relations / Case Management ──────────────────────────────
    Route::prefix('employee-relations')->name('er.')->group(function () {
        // HR admin + investigator: case list and detail
        Route::get('/cases', [\App\Http\Controllers\EmployeeRelations\HrCaseController::class, 'index'])->name('cases.index');
        Route::get('/cases/{hrCase}', [\App\Http\Controllers\EmployeeRelations\HrCaseController::class, 'show'])->name('cases.show');
        Route::post('/cases', [\App\Http\Controllers\EmployeeRelations\HrCaseController::class, 'store'])->name('cases.store');
        Route::put('/cases/{hrCase}', [\App\Http\Controllers\EmployeeRelations\HrCaseController::class, 'update'])->name('cases.update');
        Route::post('/cases/{hrCase}/parties', [\App\Http\Controllers\EmployeeRelations\HrCaseController::class, 'addParty'])->name('cases.parties.add');
        Route::delete('/cases/{hrCase}/parties/{party}', [\App\Http\Controllers\EmployeeRelations\HrCaseController::class, 'removeParty'])->name('cases.parties.remove');

        // Notes (HR + investigator + reporter)
        Route::post('/cases/{hrCase}/notes', [\App\Http\Controllers\EmployeeRelations\HrCaseNoteController::class, 'store'])->name('cases.notes.store');
        Route::delete('/cases/{hrCase}/notes/{note}', [\App\Http\Controllers\EmployeeRelations\HrCaseNoteController::class, 'destroy'])->name('cases.notes.destroy');

        // Employee self-service: submit and track own cases
        Route::get('/my-cases', [\App\Http\Controllers\EmployeeRelations\HrCaseSelfController::class, 'index'])->name('my-cases.index');
        Route::post('/my-cases', [\App\Http\Controllers\EmployeeRelations\HrCaseSelfController::class, 'store'])->name('my-cases.store');
        Route::get('/my-cases/{hrCase}', [\App\Http\Controllers\EmployeeRelations\HrCaseSelfController::class, 'show'])->name('my-cases.show');
        Route::post('/my-cases/{hrCase}/notes', [\App\Http\Controllers\EmployeeRelations\HrCaseSelfController::class, 'addNote'])->name('my-cases.notes.store');
    });
});

// ── Compliance ────────────────────────────────────────────────────────────────
Route::middleware('auth')->prefix('compliance')->name('compliance.')->group(function () {
    // Compliance documents (HR manage)
    Route::get('/documents', [\App\Http\Controllers\Compliance\ComplianceDocumentController::class, 'index'])->name('documents.index');
    Route::post('/documents', [\App\Http\Controllers\Compliance\ComplianceDocumentController::class, 'store'])->name('documents.store');
    Route::post('/documents/{doc}/verify', [\App\Http\Controllers\Compliance\ComplianceDocumentController::class, 'verify'])->name('documents.verify');
    Route::post('/documents/{doc}/reject', [\App\Http\Controllers\Compliance\ComplianceDocumentController::class, 'reject'])->name('documents.reject');
    Route::get('/documents/{doc}/download', [\App\Http\Controllers\Compliance\ComplianceDocumentController::class, 'download'])->name('documents.download');

    // Data subject requests
    Route::get('/dsr', [\App\Http\Controllers\Compliance\DataSubjectRequestController::class, 'index'])->name('dsr.index');
    Route::post('/dsr', [\App\Http\Controllers\Compliance\DataSubjectRequestController::class, 'store'])->name('dsr.store');
    Route::post('/dsr/{dsr}/acknowledge', [\App\Http\Controllers\Compliance\DataSubjectRequestController::class, 'acknowledge'])->name('dsr.acknowledge');
    Route::put('/dsr/{dsr}', [\App\Http\Controllers\Compliance\DataSubjectRequestController::class, 'update'])->name('dsr.update');
    Route::post('/dsr/{dsr}/withdraw', [\App\Http\Controllers\Compliance\DataSubjectRequestController::class, 'withdraw'])->name('dsr.withdraw');

    // Compliance trainings
    Route::get('/trainings', [\App\Http\Controllers\Compliance\ComplianceTrainingController::class, 'index'])->name('trainings.index');
    Route::post('/trainings', [\App\Http\Controllers\Compliance\ComplianceTrainingController::class, 'store'])->name('trainings.store');
    Route::put('/trainings/{training}', [\App\Http\Controllers\Compliance\ComplianceTrainingController::class, 'update'])->name('trainings.update');
    Route::post('/trainings/{training}/assign', [\App\Http\Controllers\Compliance\ComplianceTrainingController::class, 'assign'])->name('trainings.assign');
    Route::post('/trainings/{training}/complete', [\App\Http\Controllers\Compliance\ComplianceTrainingController::class, 'complete'])->name('trainings.complete');

    // Compliance policies
    Route::get('/policies', [\App\Http\Controllers\Compliance\CompliancePolicyController::class, 'index'])->name('policies.index');
    Route::post('/policies', [\App\Http\Controllers\Compliance\CompliancePolicyController::class, 'store'])->name('policies.store');
    Route::put('/policies/{policy}', [\App\Http\Controllers\Compliance\CompliancePolicyController::class, 'update'])->name('policies.update');
    Route::post('/policies/{policy}/versions', [\App\Http\Controllers\Compliance\CompliancePolicyController::class, 'publishVersion'])->name('policies.versions.store');
    Route::post('/policies/{policy}/acknowledge', [\App\Http\Controllers\Compliance\CompliancePolicyController::class, 'acknowledge'])->name('policies.acknowledge');

    // Employee self-service
    Route::get('/my', [\App\Http\Controllers\Compliance\MyComplianceController::class, 'index'])->name('my');
    Route::post('/my/documents', [\App\Http\Controllers\Compliance\MyComplianceController::class, 'storeDocument'])->name('my.documents.store');
    Route::post('/my/dsr', [\App\Http\Controllers\Compliance\MyComplianceController::class, 'storeDsr'])->name('my.dsr.store');
    Route::post('/my/dsr/{dsr}/withdraw', [\App\Http\Controllers\Compliance\MyComplianceController::class, 'withdrawDsr'])->name('my.dsr.withdraw');
});

require __DIR__.'/settings.php';
// require __DIR__.'/auth.php';

Route::post('/logout', function (Request $request) {
    Auth::guard('web')->logout();
    $request->session()->invalidate();
    $request->session()->regenerateToken();

    return redirect('/');
})->name('logout');
