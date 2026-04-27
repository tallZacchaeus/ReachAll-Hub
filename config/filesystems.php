<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Filesystem Disk
    |--------------------------------------------------------------------------
    |
    | Here you may specify the default filesystem disk that should be used
    | by the framework. The "local" disk, as well as a variety of cloud
    | based disks are available to your application for file storage.
    |
    */

    'default' => env('FILESYSTEM_DISK', 'local'),

    /*
    |--------------------------------------------------------------------------
    | Filesystem Disks
    |--------------------------------------------------------------------------
    |
    | Below you may configure as many filesystem disks as necessary, and you
    | may even configure multiple disks for the same driver. Examples for
    | most supported storage drivers are configured here for reference.
    |
    | Supported drivers: "local", "ftp", "sftp", "s3"
    |
    */

    'disks' => [

        'local' => [
            'driver' => 'local',
            'root' => storage_path('app/private'),
            'serve' => true,
            'throw' => false,
            'report' => false,
        ],

        'public' => [
            'driver' => 'local',
            'root' => storage_path('app/public'),
            'url' => rtrim(env('APP_URL'), '/').'/storage',
            'visibility' => 'public',
            'throw' => false,
            'report' => false,
        ],

        // D8-01: Private disk for all sensitive finance documents.
        // Files here are NOT publicly accessible — served only through
        // the authenticated DocumentDownloadController.
        // In production, set FINANCE_DISK=s3 and configure AWS credentials
        // to swap to S3 without changing any upload/download code.
        'finance' => [
            'driver' => env('FINANCE_DISK', 'local'),
            'root' => storage_path('app/finance'),
            'visibility' => 'private',
            'throw' => false,
            'report' => false,
            // S3 passthrough keys (ignored when driver=local)
            'key' => env('AWS_ACCESS_KEY_ID'),
            'secret' => env('AWS_SECRET_ACCESS_KEY'),
            'region' => env('AWS_DEFAULT_REGION'),
            'bucket' => env('AWS_FINANCE_BUCKET', env('AWS_BUCKET')),
            'url' => env('AWS_URL'),
        ],

        // HR document vault — private disk mirroring the finance disk pattern.
        // Files are never publicly accessible; served only through authenticated
        // HrDocumentDownloadController. Set HR_DISK=s3 in production to swap
        // to S3 without touching upload/download logic.
        'hr' => [
            'driver' => env('HR_DISK', 'local'),
            'root' => storage_path('app/hr'),
            'visibility' => 'private',
            'throw' => false,
            'report' => false,
            // S3 passthrough keys (ignored when driver=local)
            'key' => env('AWS_ACCESS_KEY_ID'),
            'secret' => env('AWS_SECRET_ACCESS_KEY'),
            'region' => env('AWS_DEFAULT_REGION'),
            'bucket' => env('AWS_HR_BUCKET', env('AWS_BUCKET')),
            'url' => env('AWS_URL'),
        ],

        // SEC-02: Chat attachments — private disk. Authenticated streaming only,
        // scoped to active conversation participants. Confidential conversations
        // (Conversation::is_confidential) inherit the same path; ex-participants
        // are revoked immediately when removed from the conversation.
        // Set CHAT_DISK=s3 in production for persistent backed-up storage.
        'chat' => [
            'driver' => env('CHAT_DISK', 'local'),
            'root' => storage_path('app/chat'),
            'visibility' => 'private',
            'throw' => false,
            'report' => false,
            // S3 passthrough keys (ignored when driver=local)
            'key' => env('AWS_ACCESS_KEY_ID'),
            'secret' => env('AWS_SECRET_ACCESS_KEY'),
            'region' => env('AWS_DEFAULT_REGION'),
            'bucket' => env('AWS_CHAT_BUCKET', env('AWS_BUCKET')),
            'url' => env('AWS_URL'),
        ],

        's3' => [
            'driver' => 's3',
            'key' => env('AWS_ACCESS_KEY_ID'),
            'secret' => env('AWS_SECRET_ACCESS_KEY'),
            'region' => env('AWS_DEFAULT_REGION'),
            'bucket' => env('AWS_BUCKET'),
            'url' => env('AWS_URL'),
            'endpoint' => env('AWS_ENDPOINT'),
            'use_path_style_endpoint' => env('AWS_USE_PATH_STYLE_ENDPOINT', false),
            'throw' => false,
            'report' => false,
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Symbolic Links
    |--------------------------------------------------------------------------
    |
    | Here you may configure the symbolic links that will be created when the
    | `storage:link` Artisan command is executed. The array keys should be
    | the locations of the links and the values should be their targets.
    |
    */

    'links' => [
        public_path('storage') => storage_path('app/public'),
    ],

];
