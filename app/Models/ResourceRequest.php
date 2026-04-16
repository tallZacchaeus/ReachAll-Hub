<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ResourceRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'reviewed_by_user_id',
        'type',
        'title',
        'description',
        'amount',
        'project',
        'status',
        'tagged_person',
        'attachments',
        'receipts',
        'reviewed_at',
        'approval_chain',
        'approval_level',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'attachments' => 'array',
            'receipts' => 'array',
            'reviewed_at' => 'datetime',
            'approval_chain' => 'array',
            'approval_level' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by_user_id');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(ResourceRequestComment::class)->latest();
    }
}
