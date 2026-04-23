<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\JobLevel;
use App\Models\JobPosition;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class JobPositionController extends Controller
{
    private function authorise(Request $request): void
    {
        abort_unless(
            $request->user()?->hasPermission('org.manage'),
            403,
            'You do not have permission to manage org structure.'
        );
    }

    public function index(Request $request): Response
    {
        $this->authorise($request);

        $levels = JobLevel::ordered()->get(['id', 'code', 'name', 'sort_order']);

        $positions = JobPosition::with(['department:id,name', 'level:id,code,name'])
            ->orderBy('title')
            ->get()
            ->map(fn (JobPosition $p) => [
                'id'              => $p->id,
                'code'            => $p->code,
                'title'           => $p->title,
                'department_id'   => $p->department_id,
                'department_name' => $p->department?->name,
                'job_level_id'    => $p->job_level_id,
                'level_name'      => $p->level?->name,
                'level_code'      => $p->level?->code,
                'description'     => $p->description,
                'is_active'       => $p->is_active,
                'employee_count'  => $p->employees()->count(),
            ]);

        $departments = Department::active()->orderBy('name')->get(['id', 'name']);

        return Inertia::render('Admin/OrgStructurePage', [
            'tab'         => 'positions',
            'levels'      => $levels,
            'positions'   => $positions,
            'departments' => $departments,
        ]);
    }

    public function store(Request $request)
    {
        $this->authorise($request);

        $data = $request->validate([
            'code'          => ['required', 'string', 'max:30', 'alpha_dash', 'unique:job_positions,code'],
            'title'         => ['required', 'string', 'max:200'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'job_level_id'  => ['nullable', 'exists:job_levels,id'],
            'description'   => ['nullable', 'string', 'max:1000'],
            'is_active'     => ['boolean'],
        ]);

        $pos = JobPosition::create([
            ...$data,
            'created_by' => $request->user()->id,
        ]);

        return back()->with('success', "Position \"{$pos->title}\" created.");
    }

    public function update(Request $request, JobPosition $jobPosition)
    {
        $this->authorise($request);

        $data = $request->validate([
            'code'          => ['required', 'string', 'max:30', 'alpha_dash', Rule::unique('job_positions', 'code')->ignore($jobPosition->id)],
            'title'         => ['required', 'string', 'max:200'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'job_level_id'  => ['nullable', 'exists:job_levels,id'],
            'description'   => ['nullable', 'string', 'max:1000'],
            'is_active'     => ['boolean'],
        ]);

        $jobPosition->update($data);

        return back()->with('success', "Position \"{$jobPosition->title}\" updated.");
    }

    public function destroy(Request $request, JobPosition $jobPosition)
    {
        $this->authorise($request);

        abort_if(
            $jobPosition->employees()->exists(),
            422,
            "Cannot delete \"{$jobPosition->title}\" — employees are currently assigned to this position."
        );

        $jobPosition->delete();

        return back()->with('success', "Position \"{$jobPosition->title}\" deleted.");
    }
}
