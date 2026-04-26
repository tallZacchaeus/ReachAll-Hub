<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Response;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class ReportController extends Controller
{
    public function index(Request $request): InertiaResponse
    {
        $reportPeriod = $this->normalizePeriod($request->input('period'));
        $reportType = $this->normalizeType($request->input('type'));

        return Inertia::render('ReportsPage', [
            'reportPeriod' => $reportPeriod,
            'reportType' => $reportType,
            'reportData' => $this->buildReportData($reportPeriod),
        ]);
    }

    public function exportPDF(Request $request)
    {
        $reportPeriod = $this->normalizePeriod($request->input('period'));
        $reportType = $this->normalizeType($request->input('type'));
        $data = $this->buildReportData($reportPeriod);

        $pdf = Pdf::loadView('reports.pdf', [
            'data' => $data,
            'period' => $reportPeriod,
            'type' => $reportType,
            'generatedAt' => now()->format('F j, Y g:i A'),
        ]);

        return $pdf->download('report_'.$reportType.'_'.date('Y-m-d').'.pdf');
    }

    public function exportCSV(Request $request)
    {
        $reportPeriod = $this->normalizePeriod($request->input('period'));
        $reportType = $this->normalizeType($request->input('type'));
        $data = $this->buildReportData($reportPeriod);
        $filename = 'report_'.$reportType.'_'.date('Y-m-d').'.csv';

        $callback = function () use ($data, $reportType): void {
            $file = fopen('php://output', 'w');

            fputcsv($file, ['Report Type', ucfirst($reportType)]);
            fputcsv($file, []);

            fputcsv($file, ['Summary']);
            fputcsv($file, ['Metric', 'Value', 'Context']);
            foreach ($data['summaryCards'] as $card) {
                fputcsv($file, [$card['label'], $card['value'], $card['meta']]);
            }

            if (in_array($reportType, ['comprehensive', 'tasks', 'performance'], true)) {
                fputcsv($file, []);
                fputcsv($file, ['Task Trend']);
                fputcsv($file, ['Month', 'Created', 'Completed', 'Overdue']);
                foreach ($data['taskTrend'] as $month) {
                    fputcsv($file, [
                        $month['month'],
                        $month['created'],
                        $month['completed'],
                        $month['overdue'],
                    ]);
                }

                fputcsv($file, []);
                fputcsv($file, ['Task Status Distribution']);
                fputcsv($file, ['Status', 'Count']);
                foreach ($data['statusDistribution'] as $status) {
                    fputcsv($file, [$status['name'], $status['value']]);
                }

                fputcsv($file, []);
                fputcsv($file, ['Priority Distribution']);
                fputcsv($file, ['Priority', 'Count']);
                foreach ($data['priorityDistribution'] as $priority) {
                    fputcsv($file, [$priority['label'], $priority['count']]);
                }
            }

            if (in_array($reportType, ['comprehensive', 'staff', 'performance'], true)) {
                fputcsv($file, []);
                fputcsv($file, ['Department Distribution']);
                fputcsv($file, ['Department', 'Staff Count']);
                foreach ($data['departmentData'] as $department) {
                    fputcsv($file, [$department['name'], $department['value']]);
                }

                fputcsv($file, []);
                fputcsv($file, ['Top Performers']);
                fputcsv($file, ['Rank', 'Staff ID', 'Name', 'Score', 'Completed Tasks', 'Assigned Tasks']);
                foreach ($data['topPerformers'] as $performer) {
                    fputcsv($file, [
                        $performer['rank'],
                        $performer['staffId'],
                        $performer['name'],
                        $performer['score'].'%',
                        $performer['completedTasks'],
                        $performer['assignedTasks'],
                    ]);
                }

                fputcsv($file, []);
                fputcsv($file, ['Department Workload']);
                fputcsv($file, ['Department', 'Total Tasks', 'Completed', 'Open']);
                foreach ($data['departmentWorkload'] as $department) {
                    fputcsv($file, [
                        $department['department'],
                        $department['total'],
                        $department['completed'],
                        $department['open'],
                    ]);
                }
            }

            fclose($file);
        };

        return Response::stream($callback, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
        ]);
    }

    public function exportProgressPDF(Request $request)
    {
        $staffId = $request->input('staff_id');
        $year = $request->input('year', date('Y'));

        $data = $this->getProgressReportData($staffId, $year);

        $pdf = Pdf::loadView('reports.progress-pdf', [
            'data' => $data,
            'year' => $year,
            'generatedAt' => now()->format('F j, Y g:i A'),
        ]);

        return $pdf->download('progress_report_'.$data['staff']['name'].'_'.$year.'.pdf');
    }

    public function exportProgressCSV(Request $request)
    {
        $staffId = $request->input('staff_id');
        $year = $request->input('year', date('Y'));
        $data = $this->getProgressReportData($staffId, $year);

        $callback = function () use ($data): void {
            $file = fopen('php://output', 'w');

            fputcsv($file, ['Staff Information']);
            fputcsv($file, ['Name', $data['staff']['name']]);
            fputcsv($file, ['Position', $data['staff']['position']]);
            fputcsv($file, ['Department', $data['staff']['department']]);
            fputcsv($file, []);

            fputcsv($file, ['Summary Statistics']);
            fputcsv($file, ['Avg Tasks/Month', $data['summary']['avgTasks']]);
            fputcsv($file, ['Avg Attendance', $data['summary']['avgAttendance'].'%']);
            fputcsv($file, ['Avg Engagement', $data['summary']['avgEngagement'].'%']);
            fputcsv($file, ['Overall Score', $data['summary']['avgScore'].'%']);
            fputcsv($file, []);

            fputcsv($file, ['Month', 'Tasks Completed', 'Attendance %', 'Engagement %', 'Score %']);
            foreach ($data['monthlyPerformance'] as $month) {
                fputcsv($file, [
                    $month['month'],
                    $month['tasksCompleted'],
                    $month['attendance'],
                    $month['engagement'],
                    $month['score'],
                ]);
            }

            fclose($file);
        };

        return Response::stream($callback, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="progress_report_'.$data['staff']['name'].'_'.$year.'.csv"',
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function buildReportData(string $period): array
    {
        $users = User::query()
            ->orderBy('name')
            ->get(['id', 'employee_id', 'name', 'department', 'role', 'status']);

        $tasks = $this->taskQueryForPeriod($period)
            ->with(['assignedTo:id,employee_id,name,department'])
            ->withCount('comments')
            ->get();

        $totalStaff = $users->count();
        $activeStaff = $users->filter(fn (User $user) => $user->status !== 'inactive')->count();
        $totalTasks = $tasks->count();
        $completedTasks = $tasks->where('status', 'completed')->count();
        $overdueTasks = $tasks->filter(function (Task $task): bool {
            return $task->status !== 'completed'
                && $task->due_date !== null
                && $task->due_date->isPast();
        })->count();
        $commentActivity = $tasks->sum('comments_count');
        $completionRate = $totalTasks > 0
            ? round(($completedTasks / $totalTasks) * 100)
            : 0;
        $discussedTasks = $tasks->filter(fn (Task $task) => $task->comments_count > 0)->count();

        return [
            'summaryCards' => [
                [
                    'label' => 'Total Staff',
                    'value' => (string) $totalStaff,
                    'meta' => $activeStaff.' active staff',
                ],
                [
                    'label' => 'Tasks In Period',
                    'value' => (string) $totalTasks,
                    'meta' => $completedTasks.' completed tasks',
                ],
                [
                    'label' => 'Completion Rate',
                    'value' => $completionRate.'%',
                    'meta' => $overdueTasks.' overdue tasks',
                ],
                [
                    'label' => 'Comment Activity',
                    'value' => (string) $commentActivity,
                    'meta' => $discussedTasks.' discussed tasks',
                ],
            ],
            'taskTrend' => $this->buildTaskTrend(),
            'departmentData' => $this->buildDepartmentDistribution($users),
            'statusDistribution' => $this->buildStatusDistribution($tasks),
            'priorityDistribution' => $this->buildPriorityDistribution($tasks),
            'departmentWorkload' => $this->buildDepartmentWorkload($tasks),
            'topPerformers' => $this->buildTopPerformers($tasks),
        ];
    }

    private function taskQueryForPeriod(string $period)
    {
        [$start, $end] = $this->resolvePeriod($period);

        $query = Task::query();
        if ($start && $end) {
            $query->whereBetween('created_at', [$start, $end]);
        }

        return $query->orderByDesc('created_at');
    }

    /**
     * @return array<int, array<string, int|string>>
     */
    private function buildTaskTrend(): array
    {
        $baseline = Carbon::now()->subMonths(5)->startOfMonth();
        $tasks = Task::query()
            ->where('created_at', '>=', $baseline)
            ->get(['status', 'due_date', 'created_at']);

        return collect(range(0, 5))
            ->map(function (int $offset) use ($tasks): array {
                $monthStart = Carbon::now()->subMonths(5 - $offset)->startOfMonth();
                $monthEnd = $monthStart->copy()->endOfMonth();
                $monthlyTasks = $tasks->filter(function (Task $task) use ($monthStart, $monthEnd): bool {
                    return $task->created_at !== null
                        && $task->created_at->betweenIncluded($monthStart, $monthEnd);
                });

                return [
                    'month' => $monthStart->format('M'),
                    'created' => $monthlyTasks->count(),
                    'completed' => $monthlyTasks->where('status', 'completed')->count(),
                    'overdue' => $monthlyTasks->filter(function (Task $task): bool {
                        return $task->status !== 'completed'
                            && $task->due_date !== null
                            && $task->due_date->isPast();
                    })->count(),
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @param  Collection<int, User>  $users
     * @return array<int, array<string, int|string>>
     */
    private function buildDepartmentDistribution(Collection $users): array
    {
        return $users
            ->filter(fn (User $user) => $user->status !== 'inactive')
            ->groupBy(fn (User $user) => $user->department ?: 'Unassigned')
            ->map(fn (Collection $departmentUsers, string $department): array => [
                'name' => $department,
                'value' => $departmentUsers->count(),
            ])
            ->sortByDesc('value')
            ->values()
            ->all();
    }

    /**
     * @param  Collection<int, Task>  $tasks
     * @return array<int, array<string, int|string>>
     */
    private function buildStatusDistribution(Collection $tasks): array
    {
        $statuses = [
            'todo' => 'To Do',
            'in-progress' => 'In Progress',
            'blocked' => 'Blocked',
            'completed' => 'Completed',
        ];

        return collect($statuses)
            ->map(fn (string $label, string $status): array => [
                'name' => $label,
                'value' => $tasks->where('status', $status)->count(),
            ])
            ->values()
            ->all();
    }

    /**
     * @param  Collection<int, Task>  $tasks
     * @return array<int, array<string, int|string>>
     */
    private function buildPriorityDistribution(Collection $tasks): array
    {
        $labels = [
            'high' => 'High Priority',
            'medium' => 'Medium Priority',
            'low' => 'Low Priority',
        ];

        return collect($labels)
            ->map(fn (string $label, string $priority): array => [
                'label' => $label,
                'count' => $tasks->where('priority', $priority)->count(),
            ])
            ->values()
            ->all();
    }

    /**
     * @param  Collection<int, Task>  $tasks
     * @return array<int, array<string, int|string>>
     */
    private function buildDepartmentWorkload(Collection $tasks): array
    {
        return $tasks
            ->groupBy(function (Task $task): string {
                return $task->department ?: $task->assignedTo?->department ?: 'Unassigned';
            })
            ->map(fn (Collection $departmentTasks, string $department): array => [
                'department' => $department,
                'total' => $departmentTasks->count(),
                'completed' => $departmentTasks->where('status', 'completed')->count(),
                'open' => $departmentTasks->where('status', '!=', 'completed')->count(),
            ])
            ->sortByDesc('total')
            ->values()
            ->take(6)
            ->all();
    }

    /**
     * @param  Collection<int, Task>  $tasks
     * @return array<int, array<string, int|string>>
     */
    private function buildTopPerformers(Collection $tasks): array
    {
        $performers = $tasks
            ->groupBy('assigned_to_user_id')
            ->map(function (Collection $userTasks): ?array {
                /** @var Task|null $firstTask */
                $firstTask = $userTasks->first();
                $user = $firstTask?->assignedTo;

                if (! $user) {
                    return null;
                }

                $assignedTasks = $userTasks->count();
                $completedTasks = $userTasks->where('status', 'completed')->count();

                return [
                    'staffId' => $user->employee_id ?: 'N/A',
                    'name' => $user->name,
                    'score' => $assignedTasks > 0
                        ? (int) round(($completedTasks / $assignedTasks) * 100)
                        : 0,
                    'completedTasks' => $completedTasks,
                    'assignedTasks' => $assignedTasks,
                ];
            })
            ->filter()
            ->sort(function (array $left, array $right): int {
                return [$right['score'], $right['completedTasks']] <=> [$left['score'], $left['completedTasks']];
            })
            ->values()
            ->take(5)
            ->map(function (array $performer, int $index): array {
                $performer['rank'] = $index + 1;

                return $performer;
            });

        return $performers->all();
    }

    /**
     * Keep progress exports functional until the progress-report UI is rewritten.
     *
     * @return array<string, mixed>
     */
    private function getProgressReportData(?string $staffId, string $year): array
    {
        $staff = User::query()
            ->when($staffId, fn ($query) => $query->where('employee_id', $staffId))
            ->orderBy('name')
            ->first();

        if (! $staff) {
            return [
                'staff' => [
                    'id' => 'unknown',
                    'name' => 'Unknown Staff',
                    'position' => 'N/A',
                    'department' => 'N/A',
                ],
                'summary' => [
                    'avgTasks' => 0,
                    'avgAttendance' => 0,
                    'avgEngagement' => 0,
                    'avgScore' => 0,
                ],
                'monthlyPerformance' => [],
            ];
        }

        $tasks = Task::query()
            ->where('assigned_to_user_id', $staff->id)
            ->whereYear('created_at', $year)
            ->get();

        $monthlyPerformance = collect(range(1, 12))
            ->map(function (int $monthNumber) use ($tasks): array {
                $monthTasks = $tasks->filter(function (Task $task) use ($monthNumber): bool {
                    return $task->created_at !== null && (int) $task->created_at->format('n') === $monthNumber;
                });

                $total = $monthTasks->count();
                $completed = $monthTasks->where('status', 'completed')->count();
                $inProgress = $monthTasks->where('status', 'in-progress')->count();
                $score = $total > 0 ? (int) round(($completed / $total) * 100) : 0;

                return [
                    'month' => Carbon::createFromDate(null, $monthNumber, 1)->format('M'),
                    'tasksCompleted' => $completed,
                    'attendance' => $total > 0 ? min(100, 80 + ($completed * 5)) : 0,
                    'engagement' => $total > 0 ? min(100, 70 + (($completed + $inProgress) * 5)) : 0,
                    'score' => $score,
                ];
            })
            ->values();

        $avgTasks = (int) round($monthlyPerformance->avg('tasksCompleted') ?: 0);
        $avgAttendance = (int) round($monthlyPerformance->avg('attendance') ?: 0);
        $avgEngagement = (int) round($monthlyPerformance->avg('engagement') ?: 0);
        $avgScore = (int) round($monthlyPerformance->avg('score') ?: 0);

        return [
            'staff' => [
                'id' => $staff->employee_id ?: (string) $staff->id,
                'name' => $staff->name,
                'position' => $staff->position ?: 'N/A',
                'department' => $staff->department ?: 'Unassigned',
            ],
            'summary' => [
                'avgTasks' => $avgTasks,
                'avgAttendance' => $avgAttendance,
                'avgEngagement' => $avgEngagement,
                'avgScore' => $avgScore,
            ],
            'monthlyPerformance' => $monthlyPerformance->all(),
        ];
    }

    /**
     * @return array{0: Carbon|null, 1: Carbon|null}
     */
    private function resolvePeriod(string $period): array
    {
        $now = Carbon::now();

        return match ($period) {
            'last' => [
                $now->copy()->subMonthNoOverflow()->startOfMonth(),
                $now->copy()->subMonthNoOverflow()->endOfMonth(),
            ],
            'quarter' => [$now->copy()->startOfQuarter(), $now->copy()->endOfQuarter()],
            'year' => [$now->copy()->startOfYear(), $now->copy()->endOfYear()],
            'all' => [null, null],
            default => [$now->copy()->startOfMonth(), $now->copy()->endOfMonth()],
        };
    }

    private function normalizePeriod(?string $period): string
    {
        return in_array($period, ['current', 'last', 'quarter', 'year', 'all'], true)
            ? $period
            : 'current';
    }

    private function normalizeType(?string $type): string
    {
        return in_array($type, ['comprehensive', 'tasks', 'staff', 'performance'], true)
            ? $type
            : 'comprehensive';
    }
}
