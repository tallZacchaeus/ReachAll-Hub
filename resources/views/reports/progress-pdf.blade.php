<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Tech Staff Evaluation Platform - Progress Report - {{ $data['staff']['name'] }}</title>
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
        .staff-info {
            background: linear-gradient(135deg, #1F6E4A, #2a8a5f);
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .staff-info h1 {
            margin: 0 0 10px 0;
            font-size: 24px;
        }
        .staff-info p {
            margin: 5px 0;
            font-size: 14px;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin: 20px 0;
        }
        .summary-card {
            background: #f5f7f8;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            border-top: 4px solid #FFD400;
        }
        .summary-label {
            font-size: 11px;
            color: #6b7280;
            margin-bottom: 5px;
        }
        .summary-value {
            font-size: 28px;
            font-weight: bold;
            color: #1F6E4A;
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
            font-size: 12px;
        }
        td {
            padding: 10px 12px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 12px;
        }
        tr:nth-child(even) {
            background: #f9fafb;
        }
        .report-meta {
            background: #f5f7f8;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            font-size: 12px;
        }
        .report-meta table {
            margin: 0;
        }
        .report-meta td {
            padding: 5px;
            border: none;
        }
        .report-meta td:first-child {
            font-weight: bold;
            width: 120px;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            font-size: 10px;
            color: #6b7280;
        }
        .performance-bar {
            height: 8px;
            background: #e5e7eb;
            border-radius: 4px;
            overflow: hidden;
            margin-top: 5px;
        }
        .performance-fill {
            height: 100%;
            background: linear-gradient(90deg, #1F6E4A, #FFD400);
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">Tech Staff Evaluation Platform</div>
        <div class="subtitle">Performance and staff reporting</div>
    </div>

    <div class="report-meta">
        <table>
            <tr>
                <td>Report Type:</td>
                <td>Staff Progress Report</td>
            </tr>
            <tr>
                <td>Year:</td>
                <td>{{ $year }}</td>
            </tr>
            <tr>
                <td>Generated:</td>
                <td>{{ $generatedAt }}</td>
            </tr>
        </table>
    </div>

    <div class="staff-info">
        <h1>{{ $data['staff']['name'] }}</h1>
        <p><strong>Position:</strong> {{ $data['staff']['position'] }}</p>
        <p><strong>Department:</strong> {{ $data['staff']['department'] }}</p>
    </div>

    <h2>Performance Summary</h2>
    <div class="summary-grid">
        <div class="summary-card">
            <div class="summary-label">Avg Tasks/Month</div>
            <div class="summary-value">{{ $data['summary']['avgTasks'] }}</div>
        </div>
        <div class="summary-card">
            <div class="summary-label">Avg Attendance</div>
            <div class="summary-value">{{ $data['summary']['avgAttendance'] }}%</div>
        </div>
        <div class="summary-card">
            <div class="summary-label">Avg Engagement</div>
            <div class="summary-value">{{ $data['summary']['avgEngagement'] }}%</div>
        </div>
        <div class="summary-card">
            <div class="summary-label">Overall Score</div>
            <div class="summary-value">{{ $data['summary']['avgScore'] }}%</div>
        </div>
    </div>

    <h2>Monthly Performance Breakdown</h2>
    <table>
        <thead>
            <tr>
                <th>Month</th>
                <th>Tasks Completed</th>
                <th>Attendance</th>
                <th>Engagement</th>
                <th>Overall Score</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data['monthlyPerformance'] as $month)
            <tr>
                <td><strong>{{ $month['month'] }}</strong></td>
                <td>{{ $month['tasksCompleted'] }}</td>
                <td>
                    {{ $month['attendance'] }}%
                    <div class="performance-bar">
                        <div class="performance-fill" style="width: {{ $month['attendance'] }}%"></div>
                    </div>
                </td>
                <td>
                    {{ $month['engagement'] }}%
                    <div class="performance-bar">
                        <div class="performance-fill" style="width: {{ $month['engagement'] }}%"></div>
                    </div>
                </td>
                <td>
                    <strong>{{ $month['score'] }}%</strong>
                    <div class="performance-bar">
                        <div class="performance-fill" style="width: {{ $month['score'] }}%"></div>
                    </div>
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <h2>Performance Insights</h2>
    <table>
        <tr>
            <td style="border: none; padding: 15px;">
                <strong>Strengths:</strong>
                <ul style="margin: 10px 0;">
                    @if($data['summary']['avgAttendance'] >= 95)
                        <li>Excellent attendance record ({{ $data['summary']['avgAttendance'] }}%)</li>
                    @endif
                    @if($data['summary']['avgEngagement'] >= 90)
                        <li>High engagement levels ({{ $data['summary']['avgEngagement'] }}%)</li>
                    @endif
                    @if($data['summary']['avgTasks'] >= 18)
                        <li>Consistently high task completion rate</li>
                    @endif
                </ul>
                
                <strong>Areas for Growth:</strong>
                <ul style="margin: 10px 0;">
                    @if($data['summary']['avgAttendance'] < 95)
                        <li>Focus on improving attendance consistency</li>
                    @endif
                    @if($data['summary']['avgEngagement'] < 90)
                        <li>Increase team engagement and participation</li>
                    @endif
                    @if($data['summary']['avgTasks'] < 15)
                        <li>Work on improving task completion efficiency</li>
                    @endif
                </ul>
            </td>
        </tr>
    </table>

    <div class="footer">
        <p>This report was automatically generated by Tech Staff Evaluation Platform</p>
        <p>© {{ date('Y') }} Tech Staff Evaluation Platform. All rights reserved.</p>
    </div>
</body>
</html>
