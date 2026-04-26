<?php

namespace App\Http\Controllers\Compliance;

use App\Http\Controllers\Controller;
use App\Models\CompliancePolicy;
use App\Models\CompliancePolicyAcknowledgement;
use App\Models\CompliancePolicyVersion;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CompliancePolicyController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()->hasPermission('compliance.self'), 403);

        $canManage = $request->user()->hasPermission('compliance.manage');

        $policies = CompliancePolicy::withCount('versions')
            ->when(! $canManage, fn ($q) => $q->where('is_active', true))
            ->when($request->category, fn ($q, $c) => $q->where('category', $c))
            ->orderBy('title')
            ->paginate(25)
            ->withQueryString();

        // Tag each policy with whether the current user has acknowledged the current version
        $user = $request->user();
        $policies->getCollection()->transform(function (CompliancePolicy $policy) use ($user) {
            $policy->acknowledged = $policy->isAcknowledgedBy($user);
            return $policy;
        });

        return Inertia::render('Compliance/CompliancePoliciesPage', [
            'policies'   => $policies,
            'can_manage' => $canManage,
            'can_report' => $request->user()->hasPermission('compliance.report'),
            'filters'    => $request->only('category'),
        ]);
    }

    public function policyReport(Request $request): Response
    {
        abort_unless($request->user()->hasPermission('compliance.report'), 403);

        $activeUsers  = User::where('status', 'active')->get(['id', 'name', 'employee_id']);
        $totalActive  = $activeUsers->count();
        $activeIds    = $activeUsers->pluck('id')->all();

        $activePolicies = CompliancePolicy::where('is_active', true)
            ->whereNotNull('current_version')
            ->with(['versions' => function ($q) {
                $q->orderBy('published_at', 'desc');
            }])
            ->orderBy('title')
            ->get();

        $report = $activePolicies->map(function (CompliancePolicy $policy) use ($activeUsers, $activeIds, $totalActive) {
            $currentVersionRecord = $policy->versions->firstWhere('version', $policy->current_version);

            if (! $currentVersionRecord) {
                return null;
            }

            // Users who have acknowledged the current version (real acknowledgements only).
            $acknowledgedIds = CompliancePolicyAcknowledgement::where('policy_version_id', $currentVersionRecord->id)
                ->whereIn('user_id', $activeIds)
                ->whereNotNull('acknowledged_at')
                ->pluck('user_id')
                ->toArray();

            $outstandingUsers = $activeUsers
                ->filter(fn ($u) => ! in_array($u->id, $acknowledgedIds))
                ->values()
                ->map(fn ($u) => ['id' => $u->id, 'name' => $u->name, 'employee_id' => $u->employee_id]);

            return [
                'id'                  => $policy->id,
                'title'               => $policy->title,
                'category'            => $policy->category,
                'current_version'     => $policy->current_version,
                'published_at'        => $currentVersionRecord->published_at?->toISOString(),
                'total_employees'     => $totalActive,
                'acknowledged_count'  => count($acknowledgedIds),
                'outstanding_count'   => $totalActive - count($acknowledgedIds),
                'acknowledgement_pct' => $totalActive > 0
                    ? round((count($acknowledgedIds) / $totalActive) * 100, 1)
                    : 0,
                'outstanding_users'   => $outstandingUsers,
            ];
        })->filter()->values();

        return Inertia::render('Compliance/PolicyComplianceReportPage', [
            'report' => $report,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        abort_unless($request->user()->hasPermission('compliance.manage'), 403);

        $data = $request->validate([
            'title'                    => ['required', 'string', 'max:200'],
            'category'                 => ['required', 'in:hr,it,finance,safety,ethics,general'],
            'description'              => ['nullable', 'string'],
            'requires_acknowledgement' => ['boolean'],
        ]);

        CompliancePolicy::create([
            'title'                    => $data['title'],
            'slug'                     => Str::slug($data['title']) . '-' . Str::random(6),
            'category'                 => $data['category'],
            'description'              => $data['description'] ?? null,
            'requires_acknowledgement' => $data['requires_acknowledgement'] ?? true,
        ]);

        return back()->with('success', 'Policy created. Publish a version to activate it.');
    }

    public function update(Request $request, CompliancePolicy $policy): RedirectResponse
    {
        abort_unless($request->user()->hasPermission('compliance.manage'), 403);

        $data = $request->validate([
            'title'                    => ['required', 'string', 'max:200'],
            'category'                 => ['required', 'in:hr,it,finance,safety,ethics,general'],
            'description'              => ['nullable', 'string'],
            'requires_acknowledgement' => ['boolean'],
            'is_active'                => ['boolean'],
        ]);

        $policy->update($data);

        return back()->with('success', 'Policy updated.');
    }

    public function publishVersion(Request $request, CompliancePolicy $policy): RedirectResponse
    {
        abort_unless($request->user()->hasPermission('compliance.manage'), 403);

        $data = $request->validate([
            'version' => ['required', 'string', 'max:20'],
            'content' => ['required', 'string', 'min:10'],
        ]);

        $version = CompliancePolicyVersion::firstOrCreate(
            ['policy_id' => $policy->id, 'version' => $data['version']],
            [
                'content'         => $data['content'],
                'published_by_id' => $request->user()->id,
                'published_at'    => now(),
            ]
        );

        $policy->update([
            'current_version' => $version->version,
            'is_active'       => true,
            'published_at'    => now(),
        ]);

        return back()->with('success', "Version {$version->version} published.");
    }

    public function acknowledge(Request $request, CompliancePolicy $policy): RedirectResponse
    {
        abort_unless($request->user()->hasPermission('compliance.self'), 403);
        abort_if(! $policy->current_version, 422);

        $versionRecord = CompliancePolicyVersion::where('policy_id', $policy->id)
            ->where('version', $policy->current_version)
            ->firstOrFail();

        CompliancePolicyAcknowledgement::firstOrCreate(
            [
                'policy_version_id' => $versionRecord->id,
                'user_id'           => $request->user()->id,
            ],
            [
                'policy_id'       => $policy->id,
                'acknowledged_at' => now(),
                'ip_address'      => $request->ip(),
            ]
        );

        return back()->with('success', 'Policy acknowledged.');
    }
}
