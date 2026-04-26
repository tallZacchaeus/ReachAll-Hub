<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class HrDocument extends Model
{
    protected $fillable = [
        'user_id',
        'category_id',
        'title',
        'file_path',
        'disk',
        'file_size',
        'mime_type',
        'version',
        'status',
        'requires_signature',
        'uploaded_by_id',
        'effective_date',
        'expires_at',
        'notes',
    ];

    protected $casts = [
        'file_size' => 'integer',
        'version' => 'integer',
        'requires_signature' => 'boolean',
        'effective_date' => 'date',
        'expires_at' => 'date',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(DocumentCategory::class, 'category_id');
    }

    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by_id');
    }

    public function signatures(): HasMany
    {
        return $this->hasMany(DocumentSignature::class, 'document_id');
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function isPendingSignatureFrom(int $userId): bool
    {
        if (! $this->requires_signature) {
            return false;
        }

        return $this->signatures()
            ->where('signee_id', $userId)
            ->where('status', 'pending')
            ->exists();
    }

    /** Supersede this version and return the incremented version number. */
    public function supersede(): int
    {
        $this->update(['status' => 'superseded']);

        return $this->version + 1;
    }

    /** Serve the file through the configured private disk. */
    public function temporaryUrl(int $minutes = 5): ?string
    {
        try {
            $disk = Storage::disk($this->disk);

            return method_exists($disk, 'temporaryUrl')
                ? $disk->temporaryUrl($this->file_path, now()->addMinutes($minutes))
                : null;
        } catch (\Throwable) {
            return null;
        }
    }
}
