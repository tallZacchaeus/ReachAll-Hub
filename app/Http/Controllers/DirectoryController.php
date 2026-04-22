<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DirectoryController extends Controller
{
    private const DEPARTMENTS = [
        'Video & Production',
        'Project Management',
        'Product Team',
        'Content & Brand Comms',
        'Interns',
        'Incubator Team',
        'Skillup Team',
        'DAF Team',
        'Graphics Design',
        'Accounting',
        'Business Development',
    ];

    public function index(Request $request): Response
    {
        $query = User::query()
            ->where('status', 'active')
            ->orderBy('name');

        if ($request->filled('search') && mb_strlen($request->search) >= 2) {
            $term = '%'.$request->search.'%';
            $query->where(function ($q) use ($term) {
                $q->where('name', 'like', $term)
                    ->orWhere('email', 'like', $term)
                    ->orWhere('employee_id', 'like', $term);
            });
        }

        if ($request->filled('department')) {
            $query->where('department', $request->department);
        }

        if ($request->filled('stage')) {
            $query->where('employee_stage', $request->stage);
        }

        $users = $query->paginate(20)->withQueryString();

        return Inertia::render('DirectoryPage', [
            'users' => $users->through(fn (User $user) => $this->transform($user)),
            'departments' => self::DEPARTMENTS,
            'stages' => ['joiner', 'performer', 'leader'],
            'filters' => [
                'search' => $request->search ?? '',
                'department' => $request->department ?? '',
                'stage' => $request->stage ?? '',
            ],
        ]);
    }

    /** @return array<string, mixed> */
    private function transform(User $user): array
    {
        return [
            'id' => $user->id,
            'employee_id' => $user->employee_id ?? '',
            'name' => $user->name,
            'email' => $user->email,
            'department' => $user->department ?? '',
            'position' => $user->position ?? '',
            'employee_stage' => $user->employee_stage ?? 'performer',
            'joined' => $user->created_at?->toDateString() ?? '',
        ];
    }
}
