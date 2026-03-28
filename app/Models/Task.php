<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Task extends Model
{
    protected $fillable = [
        'title',
        'assigned_to_user_id',
        'assigned_by_user_id',
        'priority',
        'due_date',
        'status',
        'progress',
        'description',
        'department',
        'project',
        'subtasks',
        'tags',
        'attachments',
    ];

    protected $casts = [
        'due_date' => 'date',
        'subtasks' => 'array',
        'tags' => 'array',
        'attachments' => 'array',
    ];

    public function assignedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to_user_id');
    }

    public function assignedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by_user_id');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(TaskComment::class)->latest();
    }
}
