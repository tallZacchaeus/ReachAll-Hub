<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// LeaveType and coverUser relationships added in Phase 4

class LeaveRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'reviewed_by_user_id',
        'type',
        'leave_type_id',
        'cover_user_id',
        'start_date',
        'end_date',
        'days',
        'working_days',
        'reason',
        'status',
        'hr_comment',
        'reviewed_at',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'reviewed_at' => 'datetime',
            'working_days' => 'decimal:1',
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

    public function leaveType(): BelongsTo
    {
        return $this->belongsTo(LeaveType::class);
    }

    public function coverUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cover_user_id');
    }
}
