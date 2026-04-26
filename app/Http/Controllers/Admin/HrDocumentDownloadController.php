<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\HrDocument;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class HrDocumentDownloadController extends Controller
{
    /**
     * Serve an HR document through an authenticated stream.
     *
     * HR admins (documents.manage) can download any document.
     * Employees (documents.sign) can only download their own.
     */
    public function show(HrDocument $hrDocument): StreamedResponse
    {
        $user = Auth::user();

        $canManage = $user?->hasPermission('documents.manage');
        $isOwner = $hrDocument->user_id === $user?->id;

        abort_unless($canManage || $isOwner, 403);

        abort_unless(
            Storage::disk($hrDocument->disk)->exists($hrDocument->file_path),
            404,
            'File not found on storage.'
        );

        $filename = basename($hrDocument->file_path);
        $mime = $hrDocument->mime_type ?? 'application/octet-stream';

        return Storage::disk($hrDocument->disk)->download(
            $hrDocument->file_path,
            $filename,
            ['Content-Type' => $mime]
        );
    }
}
