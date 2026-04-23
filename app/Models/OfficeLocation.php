<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OfficeLocation extends Model
{
    protected $fillable = [
        'code', 'name', 'address', 'city', 'state', 'country', 'is_active',
    ];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function employees(): HasMany
    {
        return $this->hasMany(User::class, 'office_location_id');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
