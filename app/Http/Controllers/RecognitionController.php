<?php

namespace App\Http\Controllers;

use App\Models\Recognition;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RecognitionController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $query = Recognition::with([
            'sender:id,name,department,position',
            'receiver:id,name,department,position',
        ])->where('is_public', true)->latest();

        if ($request->filled('badge_type') && $request->badge_type !== 'all') {
            $query->where('badge_type', $request->badge_type);
        }

        $recognitions = $query->paginate(15)->withQueryString();

        // Active users for the "Give Recognition" dialog (excluding self)
        $users = User::where('status', 'active')
            ->where('id', '!=', $user->id)
            ->orderBy('name')
            ->get(['id', 'name', 'department', 'position']);

        return Inertia::render('RecognitionFeedPage', [
            'recognitions' => $recognitions->through(fn ($r) => $this->transform($r)),
            'users' => $users->map(fn ($u) => [
                'id' => $u->id,
                'name' => $u->name,
                'department' => $u->department,
                'position' => $u->position,
                'initials' => $this->initials($u->name),
            ]),
            'filters' => [
                'badge_type' => $request->badge_type ?? 'all',
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'to_user_id' => ['required', 'integer', 'exists:users,id', 'different:' . ($user?->id ?? 0)],
            'message'    => ['required', 'string', 'max:500'],
            'badge_type' => ['required', 'in:shoutout,teamwork,innovation,leadership,above_and_beyond'],
        ]);

        if ((int) $validated['to_user_id'] === $user->id) {
            return back()->withErrors(['to_user_id' => 'You cannot recognise yourself.']);
        }

        Recognition::create([
            'from_user_id' => $user->id,
            'to_user_id'   => $validated['to_user_id'],
            'message'      => $validated['message'],
            'badge_type'   => $validated['badge_type'],
            'is_public'    => true,
        ]);

        return back()->with('success', 'Recognition sent!');
    }

    public function myRecognitions(Request $request): Response
    {
        $user = $request->user();

        $received = Recognition::with('sender:id,name,department,position')
            ->where('to_user_id', $user->id)
            ->latest()
            ->get()
            ->map(fn ($r) => [
                'id'         => $r->id,
                'badge_type' => $r->badge_type,
                'message'    => $r->message,
                'created_at' => $r->created_at->toDateString(),
                'sender'     => [
                    'name'       => $r->sender?->name ?? 'Unknown',
                    'department' => $r->sender?->department,
                    'initials'   => $this->initials($r->sender?->name ?? '?'),
                ],
            ]);

        $sent = Recognition::with('receiver:id,name,department,position')
            ->where('from_user_id', $user->id)
            ->latest()
            ->get()
            ->map(fn ($r) => [
                'id'         => $r->id,
                'badge_type' => $r->badge_type,
                'message'    => $r->message,
                'created_at' => $r->created_at->toDateString(),
                'receiver'   => [
                    'name'       => $r->receiver?->name ?? 'Unknown',
                    'department' => $r->receiver?->department,
                    'initials'   => $this->initials($r->receiver?->name ?? '?'),
                ],
            ]);

        return Inertia::render('RecognitionMinePage', [
            'received' => $received,
            'sent'     => $sent,
        ]);
    }

    // ─── Helpers ────────────────────────────────────────────────────────────────

    /** @return array<string, mixed> */
    private function transform(Recognition $r): array
    {
        return [
            'id'         => $r->id,
            'badge_type' => $r->badge_type,
            'message'    => $r->message,
            'is_public'  => $r->is_public,
            'created_at' => $r->created_at->diffForHumans(),
            'sender' => [
                'name'       => $r->sender?->name ?? 'Unknown',
                'department' => $r->sender?->department,
                'position'   => $r->sender?->position,
                'initials'   => $this->initials($r->sender?->name ?? '?'),
            ],
            'receiver' => [
                'name'       => $r->receiver?->name ?? 'Unknown',
                'department' => $r->receiver?->department,
                'position'   => $r->receiver?->position,
                'initials'   => $this->initials($r->receiver?->name ?? '?'),
            ],
        ];
    }

    private function initials(string $name): string
    {
        $parts = explode(' ', trim($name));
        if (count($parts) >= 2) {
            return strtoupper(substr($parts[0], 0, 1) . substr(end($parts), 0, 1));
        }

        return strtoupper(substr($name, 0, 2));
    }
}
