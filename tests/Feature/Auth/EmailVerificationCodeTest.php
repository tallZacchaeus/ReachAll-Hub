<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use App\Services\Auth\EmailVerificationCodeService;
use Illuminate\Auth\Events\Verified;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class EmailVerificationCodeTest extends TestCase
{
    use RefreshDatabase;

    public function test_email_can_be_verified_with_a_valid_code(): void
    {
        $user = User::factory()->unverified()->create();
        $code = app(EmailVerificationCodeService::class)->issue($user);

        Event::fake();

        $this->actingAs($user)
            ->post(route('verification.code.store'), [
                'code' => $code,
            ])
            ->assertRedirect(route('my-reachall', absolute: false).'?verified=1');

        $this->assertTrue($user->fresh()->hasVerifiedEmail());
        $this->assertDatabaseMissing('email_verification_codes', [
            'user_id' => $user->id,
        ]);
        Event::assertDispatched(Verified::class);
    }

    public function test_invalid_code_does_not_verify_email(): void
    {
        $user = User::factory()->unverified()->create();
        app(EmailVerificationCodeService::class)->issue($user);

        $this->actingAs($user)
            ->from(route('verification.notice'))
            ->post(route('verification.code.store'), [
                'code' => '000000',
            ])
            ->assertRedirect(route('verification.notice'))
            ->assertSessionHasErrors(['code']);

        $this->assertFalse($user->fresh()->hasVerifiedEmail());
        $this->assertDatabaseHas('email_verification_codes', [
            'user_id' => $user->id,
            'attempts' => 1,
        ]);
    }
}
