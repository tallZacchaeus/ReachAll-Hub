<?php

namespace App\Http\Controllers;

use App\Models\DocumentSignature;
use App\Models\HrDocument;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DocumentSignatureController extends Controller
{
    /** Record a signed signature for the authenticated employee. */
    public function sign(Request $request, HrDocument $hrDocument): RedirectResponse
    {
        $user = Auth::user();

        abort_unless($user?->hasPermission('documents.sign'), 403);

        $signature = DocumentSignature::where('document_id', $hrDocument->id)
            ->where('signee_id', $user->id)
            ->where('status', 'pending')
            ->first();

        abort_unless($signature !== null, 403, 'No pending signature request found.');

        $signature->update([
            'status' => 'signed',
            'signed_at' => now(),
            'ip_address' => $request->ip(),
            'user_agent' => substr($request->userAgent() ?? '', 0, 500),
        ]);

        return back()->with('success', 'Document signed successfully.');
    }

    /** Record a declined signature with an optional reason. */
    public function decline(Request $request, HrDocument $hrDocument): RedirectResponse
    {
        $user = Auth::user();

        abort_unless($user?->hasPermission('documents.sign'), 403);

        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:1000'],
        ]);

        $signature = DocumentSignature::where('document_id', $hrDocument->id)
            ->where('signee_id', $user->id)
            ->where('status', 'pending')
            ->first();

        abort_unless($signature !== null, 403, 'No pending signature request found.');

        $signature->update([
            'status' => 'declined',
            'declined_at' => now(),
            'decline_reason' => $validated['reason'] ?? null,
            'ip_address' => $request->ip(),
            'user_agent' => substr($request->userAgent() ?? '', 0, 500),
        ]);

        return back()->with('success', 'Signature declined.');
    }
}
