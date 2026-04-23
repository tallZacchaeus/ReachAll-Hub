<?php

namespace App\Http\Middleware;

use App\Models\Finance\PettyCashFloat;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                // CAT8-01: Expose only the fields the frontend needs — never leak
                // hashed passwords, remember_tokens, or internal timestamps.
                'user' => $request->user() ? [
                    ...$request->user()->only(['id', 'employee_id', 'name', 'email', 'role', 'employee_stage']),
                    'permissions' => $request->user()->getPermissions(),
                ] : null,
            ],
            'has_petty_cash_float' => $request->user()?->hasPermission('finance.access')
                ? \Illuminate\Support\Facades\Cache::remember(
                    "pcf_exists_{$request->user()->id}",
                    60,
                    fn () => PettyCashFloat::where('custodian_id', $request->user()->id)
                        ->where('status', 'active')
                        ->exists()
                )
                : false,
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],
        ];
    }
}
