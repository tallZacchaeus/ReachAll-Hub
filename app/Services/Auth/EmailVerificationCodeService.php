<?php

namespace App\Services\Auth;

use App\Models\EmailVerificationCode;
use App\Models\User;

class EmailVerificationCodeService
{
    public const CODE_LENGTH = 6;
    public const EXPIRY_MINUTES = 15;
    public const MAX_ATTEMPTS = 5;

    public function issue(User $user): string
    {
        $code = str_pad((string) random_int(0, 999999), self::CODE_LENGTH, '0', STR_PAD_LEFT);

        EmailVerificationCode::updateOrCreate(
            ['user_id' => $user->id],
            [
                'code_hash' => $this->hashFor($user, $code),
                'attempts' => 0,
                'expires_at' => now()->addMinutes(self::EXPIRY_MINUTES),
            ]
        );

        return $code;
    }

    public function verify(User $user, string $code): string
    {
        $record = EmailVerificationCode::query()->where('user_id', $user->id)->first();

        if (!$record) {
            return 'missing';
        }

        if ($record->expires_at->isPast()) {
            $record->delete();

            return 'expired';
        }

        if ($record->attempts >= self::MAX_ATTEMPTS) {
            $record->delete();

            return 'too_many_attempts';
        }

        if (!hash_equals($record->code_hash, $this->hashFor($user, $code))) {
            $record->increment('attempts');
            $record->refresh();

            if ($record->attempts >= self::MAX_ATTEMPTS) {
                $record->delete();

                return 'too_many_attempts';
            }

            return 'invalid';
        }

        $record->delete();

        return 'verified';
    }

    private function hashFor(User $user, string $code): string
    {
        return hash('sha256', implode('|', [
            $user->getKey(),
            trim($code),
            (string) config('app.key'),
        ]));
    }
}
