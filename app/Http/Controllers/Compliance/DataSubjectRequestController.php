<?php

namespace App\Http\Controllers\Compliance;

use App\Http\Controllers\Controller;
use App\Models\DataSubjectRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DataSubjectRequestController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()->hasPermission('compliance.manage'), 403);

        $dsrs = DataSubjectRequest::with('user', 'handledBy')
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->when($request->type, fn ($q, $t) => $q->where('type', $t))
            ->orderBy('created_at', 'desc')
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('Compliance/DataSubjectRequestsPage', [
            'dsrs'    => $dsrs,
            'filters' => $request->only('status', 'type'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        abort_unless($request->user()->hasPermission('compliance.self'), 403);

        $data = $request->validate([
            'type'        => ['required', 'in:access,rectification,erasure,restriction,portability,objection'],
            'description' => ['required', 'string', 'max:2000'],
        ]);

        DataSubjectRequest::create([
            'user_id'     => $request->user()->id,
            'type'        => $data['type'],
            'description' => $data['description'],
        ]);

        return back()->with('success', 'Data subject request submitted. You will receive a response within 30 days.');
    }

    public function acknowledge(Request $request, DataSubjectRequest $dsr): RedirectResponse
    {
        abort_unless($request->user()->hasPermission('compliance.manage'), 403);

        $dsr->update([
            'status'           => 'acknowledged',
            'handled_by_id'    => $request->user()->id,
            'acknowledged_at'  => now(),
        ]);

        return back()->with('success', 'DSR acknowledged.');
    }

    public function update(Request $request, DataSubjectRequest $dsr): RedirectResponse
    {
        abort_unless($request->user()->hasPermission('compliance.manage'), 403);

        $data = $request->validate([
            'status'   => ['required', 'in:acknowledged,in_progress,completed,rejected'],
            'response' => ['nullable', 'string', 'max:5000'],
        ]);

        $update = [
            'status'        => $data['status'],
            'response'      => $data['response'] ?? $dsr->response,
            'handled_by_id' => $request->user()->id,
        ];

        if ($data['status'] === 'completed' && $dsr->completed_at === null) {
            $update['completed_at'] = now();
        }

        $dsr->update($update);

        return back()->with('success', 'DSR updated.');
    }

    public function withdraw(Request $request, DataSubjectRequest $dsr): RedirectResponse
    {
        abort_unless($request->user()->id === $dsr->user_id, 403);
        abort_unless(in_array($dsr->status, ['pending', 'acknowledged']), 422);

        $dsr->update(['status' => 'withdrawn']);

        return back()->with('success', 'Request withdrawn.');
    }
}
