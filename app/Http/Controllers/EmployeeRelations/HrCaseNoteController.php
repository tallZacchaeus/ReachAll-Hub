<?php

namespace App\Http\Controllers\EmployeeRelations;

use App\Http\Controllers\Controller;
use App\Models\HrCase;
use App\Models\HrCaseNote;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class HrCaseNoteController extends Controller
{
    public function store(Request $request, HrCase $hrCase): RedirectResponse
    {
        $user      = $request->user();
        $canManage = $user->hasPermission('er.manage');

        $isAssignedInvestigator = $hrCase->assigned_to_id === $user->id &&
                                  $user->hasPermission('er.investigate');

        // Reporter can add public notes to their own non-confidential case
        $isReporter = $hrCase->reported_by_id === $user->id &&
                      !$hrCase->confidential &&
                      $user->hasPermission('er.self');

        abort_unless($canManage || $isAssignedInvestigator || $isReporter, 403);

        $data = $request->validate([
            'content'     => 'required|string|max:5000',
            'is_internal' => 'boolean',
        ]);

        // Only HR managers may add internal notes
        if (!$canManage) {
            $data['is_internal'] = false;
        }

        HrCaseNote::create([
            'hr_case_id'  => $hrCase->id,
            'author_id'   => $user->id,
            'content'     => $data['content'],
            'is_internal' => $data['is_internal'] ?? false,
        ]);

        return back()->with('success', 'Note added.');
    }

    public function destroy(Request $request, HrCase $hrCase, HrCaseNote $note): RedirectResponse
    {
        abort_unless($request->user()->hasPermission('er.manage'), 403);
        abort_unless($note->hr_case_id === $hrCase->id, 404);

        $note->delete();

        return back()->with('success', 'Note deleted.');
    }
}
