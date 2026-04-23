<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HelpController extends Controller
{
    /** Available to all authenticated finance-module users. */
    public function gettingStarted(Request $request): Response
    {
        abort_unless($request->user() !== null, 403);
        return Inertia::render('Finance/Help/GettingStartedPage');
    }

    /** Available to approvers and above. */
    public function approvers(Request $request): Response
    {
        $user = $request->user();

        abort_unless(
            $user?->hasPermission('requests.review') || $user?->hasPermission('finance.admin'),
            403
        );
        return Inertia::render('Finance/Help/ApproversPage');
    }

    /**
     * CAT1-01: Finance team operational guide — restricted to finance roles only.
     * Prevents staff from reading internal process documentation.
     */
    public function financeTeam(Request $request): Response
    {
        abort_unless(
            $request->user()?->hasPermission('finance.admin'),
            403
        );
        return Inertia::render('Finance/Help/FinanceTeamPage');
    }
}
