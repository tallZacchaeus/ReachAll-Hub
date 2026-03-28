<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class StaffEnrollmentController extends Controller
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

    private const POSITIONS = [
        'Video Editor',
        'Producer',
        'Project Manager',
        'Product Manager',
        'Content Writer',
        'Brand Manager',
        'Intern',
        'Tech Trainer',
        'Programs Coordinator',
        'Graphic Designer',
        'Accountant',
        'Business Developer',
    ];

    private const ROLE_LABELS = [
        'staff' => 'Staff',
        'management' => 'Management',
        'hr' => 'HR',
        'superadmin' => 'Super Admin',
    ];

    private const STATUS_LABELS = [
        'active' => 'Active',
        'inactive' => 'Inactive',
        'pending' => 'Pending',
    ];

    public function index(Request $request): Response
    {
        $this->authorizeAdmin($request);

        $staffMembers = User::query()
            ->orderBy('name')
            ->get()
            ->map(fn (User $user) => $this->transformUser($user));

        return Inertia::render('StaffEnrollmentPage', [
            'userRole' => $request->user()->role,
            'staffMembers' => $staffMembers,
            'departments' => self::DEPARTMENTS,
            'positions' => self::POSITIONS,
            'roles' => ['Staff', 'Management', 'HR'],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorizeAdmin($request);

        $validated = $request->validate($this->rules());

        User::create([
            'employee_id' => $validated['employeeId'],
            'name' => trim($validated['firstName'].' '.$validated['lastName']),
            'email' => $validated['email'],
            'department' => $validated['department'],
            'position' => $validated['position'],
            'role' => $this->normalizeRole($validated['role']),
            'status' => 'active',
            'password' => Hash::make($validated['password']),
            'email_verified_at' => now(),
        ]);

        return back()->with('success', $validated['firstName'].' '.$validated['lastName'].' has been enrolled successfully.');
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $this->authorizeAdmin($request);

        $validated = $request->validate($this->rules($user, false));

        $user->update([
            'employee_id' => $validated['employeeId'],
            'name' => trim($validated['firstName'].' '.$validated['lastName']),
            'email' => $validated['email'],
            'department' => $validated['department'],
            'position' => $validated['position'],
            'role' => $this->normalizeRole($validated['role']),
        ]);

        return back()->with('success', 'Staff information updated successfully.');
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        $this->authorizeAdmin($request);

        if ($request->user()->is($user)) {
            return back()->with('error', 'You cannot remove your own account.');
        }

        $user->delete();

        return back()->with('success', 'Staff member removed successfully.');
    }

    public function toggleStatus(Request $request, User $user): RedirectResponse
    {
        $this->authorizeAdmin($request);

        $nextStatus = $user->status === 'active' ? 'inactive' : 'active';
        $user->update(['status' => $nextStatus]);

        return back()->with('success', 'Status updated successfully.');
    }

    /**
     * @return array<string, mixed>
     */
    private function rules(?User $user = null, bool $requirePassword = true): array
    {
        return [
            'employeeId' => [
                'required',
                'string',
                'max:255',
                Rule::unique(User::class, 'employee_id')->ignore($user?->id),
            ],
            'firstName' => ['required', 'string', 'max:255'],
            'lastName' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique(User::class, 'email')->ignore($user?->id),
            ],
            'password' => $requirePassword ? ['required', 'string', 'min:8'] : ['nullable', 'string', 'min:8'],
            'department' => ['required', 'string', Rule::in(self::DEPARTMENTS)],
            'position' => ['required', 'string', Rule::in(self::POSITIONS)],
            'role' => ['required', 'string', Rule::in(['Staff', 'Management', 'HR'])],
        ];
    }

    /**
     * @return array<string, string>
     */
    private function transformUser(User $user): array
    {
        [$firstName, $lastName] = $this->splitName($user->name);

        return [
            'id' => (string) $user->id,
            'employeeId' => $user->employee_id ?? '',
            'firstName' => $firstName,
            'lastName' => $lastName,
            'email' => $user->email,
            'department' => $user->department ?? 'Unassigned',
            'role' => self::ROLE_LABELS[$user->role] ?? ucfirst((string) $user->role),
            'position' => $user->position ?? 'Unassigned',
            'enrollmentDate' => $user->created_at?->toDateString() ?? '',
            'status' => self::STATUS_LABELS[$user->status ?? 'active'] ?? 'Active',
        ];
    }

    /**
     * @return array{0: string, 1: string}
     */
    private function splitName(string $name): array
    {
        $parts = preg_split('/\s+/', trim($name)) ?: [];
        $firstName = $parts[0] ?? '';
        $lastName = count($parts) > 1 ? implode(' ', array_slice($parts, 1)) : '';

        return [$firstName, $lastName];
    }

    private function normalizeRole(string $role): string
    {
        return match ($role) {
            'Management' => 'management',
            'HR' => 'hr',
            default => 'staff',
        };
    }

    private function authorizeAdmin(Request $request): void
    {
        if (! in_array($request->user()?->role, ['superadmin', 'hr'], true)) {
            abort(403, 'Unauthorized action.');
        }
    }
}
