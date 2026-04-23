<?php

namespace App\Http\Controllers;

use App\Models\HrDocument;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class HrDocumentSelfController extends Controller
{
    /** Show the employee's own documents. */
    public function index(): Response
    {
        $user = Auth::user();

        $documents = HrDocument::with(['category:id,name,code'])
            ->forUser($user->id)
            ->active()
            ->orderByDesc('created_at')
            ->get()
            ->map(function (HrDocument $doc) use ($user) {
                $sig = $doc->signatures()
                    ->where('signee_id', $user->id)
                    ->first();

                return [
                    'id'                  => $doc->id,
                    'title'               => $doc->title,
                    'category'            => $doc->category?->name,
                    'category_code'       => $doc->category?->code,
                    'version'             => $doc->version,
                    'effective_date'      => $doc->effective_date?->toDateString(),
                    'expires_at'          => $doc->expires_at?->toDateString(),
                    'requires_signature'  => $doc->requires_signature,
                    'signature_status'    => $sig?->status,
                    'signed_at'           => $sig?->signed_at?->toDateTimeString(),
                    'download_url'        => route('my.documents.download', $doc->id),
                ];
            });

        return Inertia::render('MyDocumentsPage', [
            'documents' => $documents,
        ]);
    }

    /** Stream-download an employee's own document. */
    public function download(HrDocument $hrDocument): StreamedResponse
    {
        $user = Auth::user();

        abort_unless($hrDocument->user_id === $user?->id, 403);

        abort_unless(
            Storage::disk($hrDocument->disk)->exists($hrDocument->file_path),
            404,
            'File not found on storage.'
        );

        return Storage::disk($hrDocument->disk)->download(
            $hrDocument->file_path,
            basename($hrDocument->file_path),
            ['Content-Type' => $hrDocument->mime_type ?? 'application/octet-stream']
        );
    }
}
