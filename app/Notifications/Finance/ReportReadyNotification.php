<?php

namespace App\Notifications\Finance;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * CAT6-04: Sent when a queued report export finishes.
 * Delivers the download link via both email and database notification.
 */
class ReportReadyNotification extends Notification
{
    use Queueable;

    public function __construct(
        public readonly string $downloadUrl,
        public readonly string $filename,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Your finance report is ready')
            ->line("Your export **{$this->filename}** is ready for download.")
            ->action('Download Report', $this->downloadUrl)
            ->line('This link will expire when the file is removed from storage.');
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'type' => 'report_ready',
            'title' => 'Report Export Ready',
            'body' => "Your export {$this->filename} is ready for download.",
            'url' => $this->downloadUrl,
            'filename' => $this->filename,
        ];
    }
}
