<?php

namespace App\Notifications\Auth;

use App\Models\User;
use App\Services\Auth\EmailVerificationCodeService;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\URL;

class VerifyEmailWithCode extends Notification
{
    use Queueable;

    public function __construct(
        public readonly string $code,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        if (! $notifiable instanceof User) {
            throw new \InvalidArgumentException('VerifyEmailWithCode expects a User notifiable.');
        }

        $verificationUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            [
                'id' => $notifiable->getKey(),
                'hash' => sha1($notifiable->getEmailForVerification()),
            ]
        );

        return (new MailMessage)
            ->subject('Verify your email for '.config('app.name'))
            ->greeting('Welcome to '.config('app.name'))
            ->line('Use either the verification button below or the 6-digit code to verify your email address.')
            ->line('Verification code: '.$this->code)
            ->line('This code expires in '.EmailVerificationCodeService::EXPIRY_MINUTES.' minutes.')
            ->action('Verify Email Address', $verificationUrl)
            ->line('If you did not create this account, you can ignore this email.');
    }
}
