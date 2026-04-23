<?php

namespace App\Http\Controllers\Compliance;

use App\Http\Controllers\Controller;
use App\Models\CompliancePolicy;
use App\Models\CompliancePolicyAcknowledgement;
use App\Models\CompliancePolicyVersion;
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
            'filters'    => $request->only('category'),
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
