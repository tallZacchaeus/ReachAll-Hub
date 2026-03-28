<?php

namespace App\Http\Controllers;

use App\Models\AttendanceRecord;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $selectedMonth = $this->normalizeMonth($request->input('month'));
        $monthStart = Carbon::createFromFormat('Y-m', $selectedMonth)->startOfMonth();
        $monthEnd = $monthStart->copy()->endOfMonth();

        $records = AttendanceRecord::query()
            ->where('user_id', $user->id)
            ->whereBetween('date', [$monthStart->toDateString(), $monthEnd->toDateString()])
            ->orderBy('date')
            ->get();

        $monthOptions = AttendanceRecord::query()
            ->where('user_id', $user->id)
            ->orderByDesc('date')
            ->get(['date'])
            ->map(fn (AttendanceRecord $record) => $record->date?->format('Y-m'))
            ->unique()
            ->filter()
            ->values();

        if ($monthOptions->isEmpty()) {
            $monthOptions = collect([$selectedMonth]);
        } elseif (! $monthOptions->contains($selectedMonth)) {
            $monthOptions = $monthOptions->prepend($selectedMonth)->unique()->values();
        }

        $presentDays = $records->filter(function (AttendanceRecord $record): bool {
            return in_array($record->status, ['present', 'late'], true);
        })->count();
        $lateDays = $records->where('status', 'late')->count();
        $absentDays = $records->where('status', 'absent')->count();
        $totalHours = (float) $records->sum('total_hours');
        $totalDays = $records->count();

        return Inertia::render('AttendancePage', [
            'userRole' => $user->role,
            'selectedMonth' => $selectedMonth,
            'monthOptions' => $monthOptions->map(function (string $month): array {
                return [
                    'value' => $month,
                    'label' => Carbon::createFromFormat('Y-m', $month)->format('F Y'),
                ];
            })->all(),
            'attendanceRecords' => $records->map(function (AttendanceRecord $record): array {
                return [
                    'id' => (string) $record->id,
                    'date' => $record->date?->toDateString() ?? '',
                    'clockIn' => $record->clock_in_at?->format('h:i A') ?? '-',
                    'clockOut' => $record->clock_out_at?->format('h:i A') ?? '-',
                    'totalHours' => (float) $record->total_hours,
                    'status' => $record->status,
                    'notes' => $record->notes,
                ];
            })->all(),
            'summary' => [
                'totalDays' => $totalDays,
                'presentDays' => $presentDays,
                'lateDays' => $lateDays,
                'absentDays' => $absentDays,
                'totalHours' => $totalHours,
                'attendanceRate' => $totalDays > 0 ? round(($presentDays / $totalDays) * 100, 1) : 0,
            ],
        ]);
    }

    private function normalizeMonth(?string $month): string
    {
        if (is_string($month) && preg_match('/^\d{4}-\d{2}$/', $month) === 1) {
            return $month;
        }

        return now()->format('Y-m');
    }
}
