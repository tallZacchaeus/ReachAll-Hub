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
});

require __DIR__.'/settings.php';
// require __DIR__.'/auth.php';

Route::post('/logout', function (Request $request) {
    Auth::guard('web')->logout();
    $request->session()->invalidate();
    $request->session()->regenerateToken();

    return redirect('/');
})->name('logout');
