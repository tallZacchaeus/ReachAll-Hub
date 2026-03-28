<?php

namespace App\Http\Controllers;

use App\Models\ProfileChangeRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ProfileController extends Controller
{
    /**
     * Submit a profile change request.
     */
    public function submitRequest(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|max:255|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:20',
            'location' => 'nullable|string|max:255',
            'role' => 'sometimes|string|max:255',
            'department' => 'sometimes|string|max:255',
        ]);

        // Check if user already has a pending request
        $existingRequest = ProfileChangeRequest::where('user_id', $user->id)
            ->where('status', 'pending')
            ->first();

        if ($existingRequest) {
            $existingRequest->update([
                'changes' => array_merge($existingRequest->changes, $validated),
            ]);
        } else {
            ProfileChangeRequest::create([
                'user_id' => $user->id,
                'changes' => $validated,
                'status' => 'pending',
            ]);
        }

        return back()->with('success', 'Your profile change request has been submitted for approval.');
    }

    /**
     * Admin view of pending requests.
     */
    public function adminIndex()
    {
        $this->authorizeAdmin();

        $requests = ProfileChangeRequest::with('user')
            ->where('status', 'pending')
            ->latest()
            ->get();

        return Inertia::render('Admin/ProfileRequests', [
            'requests' => $requests,
        ]);
    }

    /**
     * Approve a profile change request.
     */
    public function approveRequest(Request $request, $id)
    {
        $this->authorizeAdmin();

        $changeRequest = ProfileChangeRequest::findOrFail($id);
        
        if ($changeRequest->status !== 'pending') {
            return back()->with('error', 'This request has already been processed.');
        }

        $user = User::findOrFail($changeRequest->user_id);
        
        // Apply changes to the user
        $user->update($changeRequest->changes);

        // Update the request status
        $changeRequest->update([
            'status' => 'approved',
            'reviewed_by' => Auth::id(),
            'reviewed_at' => now(),
            'review_notes' => $request->review_notes,
        ]);

        return back()->with('success', 'Profile change request approved and applied.');
    }

    /**
     * Reject a profile change request.
     */
    public function rejectRequest(Request $request, $id)
    {
        $this->authorizeAdmin();

        $changeRequest = ProfileChangeRequest::findOrFail($id);

        if ($changeRequest->status !== 'pending') {
            return back()->with('error', 'This request has already been processed.');
        }

        $changeRequest->update([
            'status' => 'rejected',
            'reviewed_by' => Auth::id(),
            'reviewed_at' => now(),
            'review_notes' => $request->review_notes,
        ]);

        return back()->with('success', 'Profile change request rejected.');
    }

    /**
     * Helper to authorize admin access.
     */
    private function authorizeAdmin()
    {
        $user = Auth::user();
        if (!in_array($user->role, ['superadmin', 'hr'])) {
            abort(403, 'Unauthorized action.');
        }
    }
}
