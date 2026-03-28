<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ResourceRequestComment extends Model
{
    use HasFactory;

    protected $fillable = [
        'resource_request_id',
        'user_id',
        'content',
    ];

    public function request(): BelongsTo
    {
        return $this->belongsTo(ResourceRequest::class, 'resource_request_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
