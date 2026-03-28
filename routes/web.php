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
use Inertia\Inertia;

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

    // Profile Change Requests
    Route::post('/profile/update', [\App\Http\Controllers\ProfileController::class, 'submitRequest'])->name('profile.request-update');
    Route::get('/admin/profile-requests', [\App\Http\Controllers\ProfileController::class, 'adminIndex'])->name('admin.profile-requests');
    Route::post('/admin/profile-requests/{id}/approve', [\App\Http\Controllers\ProfileController::class, 'approveRequest'])->name('admin.profile-requests.approve');
    Route::post('/admin/profile-requests/{id}/reject', [\App\Http\Controllers\ProfileController::class, 'rejectRequest'])->name('admin.profile-requests.reject');
});

require __DIR__.'/settings.php';
// require __DIR__.'/auth.php';

Route::post('/logout', function (Request $request) {
    Auth::guard('web')->logout();
    $request->session()->invalidate();
    $request->session()->regenerateToken();

    return redirect('/');
})->name('logout');
