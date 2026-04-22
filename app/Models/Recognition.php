<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Recognition extends Model
{
    protected $fillable = [
        'from_user_id',
        'to_user_id',
        'message',
        'badge_type',
        'is_public',
    ];

    protected $casts = [
        'is_public' => 'boolean',
    ];

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'from_user_id');
    }

    public function receiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'to_user_id');
    }
}
