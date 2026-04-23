<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>ReachAll Hub - {{ ucfirst($type) }} Report</title>
    <style>
        body {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            color: #1F2937;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #1F6E4A;
            padding-bottom: 20px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #1F6E4A;
            margin-bottom: 5px;
        }
        .subtitle {
            color: #6b7280;
            font-size: 12px;
        }
        .report-info {
            background: #f5f7f8;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .report-info table {
            width: 100%;
        }
        .report-info td {
            padding: 5px;
            font-size: 12px;
        }
        .report-info td:first-child {
            font-weight: bold;
            width: 150px;
        }
        h2 {
            color: #1F6E4A;
            border-bottom: 2px solid #FFD400;
            padding-bottom: 10px;
            margin-top: 30px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th {
            background: #1F6E4A;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: bold;
        }
        td {
            padding: 10px 12px;
            border-bottom: 1px solid #e5e7eb;
        }
        tr:nth-child(even) {
            background: #f9fafb;
        }
        .kpi-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin: 20px 0;
        }
        .kpi-card {
            background: #f5f7f8;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #1F6E4A;
        }
        .kpi-label {
            font-size: 12px;
            color: #6b7280;
            margin-bottom: 5px;
        }
        .kpi-value {
            font-size: 24px;
            font-weight: bold;
            color: #1F6E4A;
        }
        .kpi-change {
            font-size: 12px;
            color: #1F6E4A;
            font-weight: bold;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            font-size: 10px;
            color: #6b7280;
        }
        .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: bold;
        }
        .badge-gold {
            background: linear-gradient(135deg, #FFD700, #FFA500);
            color: #1F2937;
        }
        .badge-silver {
            background: linear-gradient(135deg, #C0C0C0, #808080);
            color: white;
        }
        .badge-bronze {
            background: linear-gradient(135deg, #CD7F32, #8B4513);
            color: white;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">ReachAll Hub</div>
        <div class="subtitle">Performance and staff reporting</div>
    </div>

    <div class="report-info">
        <table>
            <tr>
                <td>Report Type:</td>
                <td>{{ ucfirst($type) }} Report</td>
            </tr>
            <tr>
                <td>Period:</td>
                <td>{{ ucfirst($period) }}</td>
            </tr>
            <tr>
                <td>Generated:</td>
                <td>{{ $generatedAt }}</td>
            </tr>
        </table>
    </div>

    <h2>Key Performance Indicators</h2>
    <div class="kpi-grid">
        @foreach($data['summaryCards'] as $card)
        <div class="kpi-card">
            <div class="kpi-label">{{ $card['label'] }}</div>
            <div class="kpi-value">{{ $card['value'] }}</div>
            <div class="kpi-change">{{ $card['meta'] }}</div>
        </div>
        @endforeach
    </div>

    @php
        $includesTaskSections = in_array($type, ['comprehensive', 'tasks', 'performance'], true);
        $includesStaffSections = in_array($type, ['comprehensive', 'staff', 'performance'], true);
    @endphp

    @if($includesTaskSections)
    <h2>Task Trend</h2>
    <table>
        <thead>
            <tr>
                <th>Month</th>
                <th>Created</th>
                <th>Completed</th>
                <th>Overdue</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data['taskTrend'] as $month)
            <tr>
                <td>{{ $month['month'] }}</td>
                <td>{{ $month['created'] }}</td>
                <td>{{ $month['completed'] }}</td>
                <td>{{ $month['overdue'] }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @endif

    @if($includesStaffSections)
    <h2>Department Distribution</h2>
    <table>
        <thead>
            <tr>
                <th>Department</th>
                <th>Staff Count</th>
                <th>Percentage</th>
            </tr>
        </thead>
        <tbody>
            @php
                $total = max(array_sum(array_column($data['departmentData'], 'value')), 1);
            @endphp
            @foreach($data['departmentData'] as $dept)
            <tr>
                <td>{{ $dept['name'] }}</td>
                <td>{{ $dept['value'] }}</td>
                <td>{{ round(($dept['value'] / $total) * 100, 1) }}%</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @endif

    @if($includesTaskSections)
    <h2>Task Status Distribution</h2>
    <table>
        <thead>
            <tr>
                <th>Status</th>
                <th>Count</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data['statusDistribution'] as $status)
            <tr>
                <td>{{ $status['name'] }}</td>
                <td>{{ $status['value'] }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @endif

    @if($includesTaskSections)
    <h2>Priority Distribution</h2>
    <table>
        <thead>
            <tr>
                <th>Priority</th>
                <th>Count</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data['priorityDistribution'] as $priority)
            <tr>
                <td>{{ $priority['label'] }}</td>
                <td>{{ $priority['count'] }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @endif

    @if($includesStaffSections)
    <h2>Top Performers</h2>
    <table>
        <thead>
            <tr>
                <th>Rank</th>
                <th>Staff ID</th>
                <th>Name</th>
                <th>Score</th>
                <th>Completed / Assigned</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data['topPerformers'] as $performer)
            <tr>
                <td>
                    @if($performer['rank'] == 1)
                        <span class="badge badge-gold">🥇 #{{ $performer['rank'] }}</span>
                    @elseif($performer['rank'] == 2)
                        <span class="badge badge-silver">🥈 #{{ $performer['rank'] }}</span>
                    @elseif($performer['rank'] == 3)
                        <span class="badge badge-bronze">🥉 #{{ $performer['rank'] }}</span>
                    @else
                        #{{ $performer['rank'] }}
                    @endif
                </td>
                <td>{{ $performer['staffId'] }}</td>
                <td>{{ $performer['name'] }}</td>
                <td>{{ $performer['score'] }}%</td>
                <td>{{ $performer['completedTasks'] }} / {{ $performer['assignedTasks'] }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @endif

    @if($includesStaffSections)
    <h2>Department Workload</h2>
    <table>
        <thead>
            <tr>
                <th>Department</th>
                <th>Total Tasks</th>
                <th>Completed</th>
                <th>Open</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data['departmentWorkload'] as $department)
            <tr>
                <td>{{ $department['department'] }}</td>
                <td>{{ $department['total'] }}</td>
                <td>{{ $department['completed'] }}</td>
                <td>{{ $department['open'] }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @endif

    <div class="footer">
        <p>This report was automatically generated by ReachAll Hub</p>
        <p>© {{ date('Y') }} ReachAll Hub. All rights reserved.</p>
    </div>
</body>
</html>
