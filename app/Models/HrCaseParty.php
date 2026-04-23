<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HrCaseParty extends Model
{
    protected $fillable = [
        'hr_case_id',
        'user_id',
        'role',
    ];

    public function case(): BelongsTo
    {
        return $this->belongsTo(HrCase::class, 'hr_case_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
