<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\Auth\EmailVerificationCodeService;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class EmailVerificationCodeController extends Controller
{
    public function store(Request $request, EmailVerificationCodeService $codes): RedirectResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'digits:6'],
        ]);

        $user = $request->user();

        if (! $user) {
            abort(401);
        }

        if ($user->hasVerifiedEmail()) {
            return redirect()->intended(route('my-reachall', absolute: false));
        }

        $result = $codes->verify($user, $validated['code']);

        if ($result !== 'verified') {
            return back()->withErrors([
                'code' => $this->messageFor($result),
            ]);
        }

        if ($user->markEmailAsVerified()) {
            event(new Verified($user));
        }

        return redirect()->intended(route('my-reachall', absolute: false).'?verified=1');
    }

    private function messageFor(string $result): string
    {
        return match ($result) {
            'expired' => 'This verification code has expired. Request a new email and try again.',
            'too_many_attempts' => 'Too many incorrect attempts. Request a new verification email and try again.',
            'missing' => 'No active verification code was found. Request a new verification email and try again.',
            default => 'That verification code is invalid.',
        };
    }
}
