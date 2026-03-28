<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Models\User;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules, ProfileValidationRules;

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        Validator::make($input, [
            ...$this->profileRules(),
            'password' => $this->passwordRules(),
        ])->validate();

        return User::create([
            'employee_id' => $this->generateEmployeeId(),
            'name' => $input['name'],
            'email' => $input['email'],
            'password' => $input['password'],
        ]);
    }

    private function generateEmployeeId(): string
    {
        $latestEmployeeId = User::query()
            ->whereNotNull('employee_id')
            ->where('employee_id', 'like', 'EMP%')
            ->pluck('employee_id')
            ->filter(fn (?string $employeeId): bool => $employeeId !== null)
            ->map(fn (string $employeeId): int => (int) Str::of($employeeId)->after('EMP'))
            ->max() ?? 0;

        do {
            $latestEmployeeId++;
            $employeeId = 'EMP'.str_pad((string) $latestEmployeeId, 4, '0', STR_PAD_LEFT);
        } while (User::query()->where('employee_id', $employeeId)->exists());

        return $employeeId;
    }
}
