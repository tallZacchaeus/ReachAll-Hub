<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>{{ $title }}</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 11px; color: #1a1a1a; margin: 30px; }
  h1 { font-size: 18px; color: #1F6E4A; margin-bottom: 4px; }
  .meta { color: #6b7280; font-size: 10px; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10px; }
  th { background: #f3f4f6; text-align: left; padding: 5px 6px; border: 1px solid #e5e7eb; font-weight: bold; }
  td { padding: 5px 6px; border: 1px solid #e5e7eb; }
  tr:nth-child(even) td { background: #f9fafb; }
  .amount { text-align: right; }
  .footer { margin-top: 30px; font-size: 9px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 8px; }
</style>
</head>
<body>

<h1>{{ $title }}</h1>
<p class="meta">
  Generated: {{ now()->format('d M Y H:i') }}
  @if($filters['from'] ?? null) &nbsp;|&nbsp; From: {{ $filters['from'] }} @endif
  @if($filters['to'] ?? null) &nbsp;|&nbsp; To: {{ $filters['to'] }} @endif
</p>

<table>
  <thead>
    <tr>
      @foreach($headings as $h)
        <th>{{ $h }}</th>
      @endforeach
    </tr>
  </thead>
  <tbody>
    @foreach($rows as $row)
      <tr>
        @foreach($row as $cell)
          <td>{{ $cell }}</td>
        @endforeach
      </tr>
    @endforeach
    @if(count($rows) === 0)
      <tr><td colspan="{{ count($headings) }}" style="text-align:center;color:#9ca3af;">No data found for selected filters.</td></tr>
    @endif
  </tbody>
</table>

<div class="footer">
  HR Lifecycle Finance Module &mdash; {{ $title }} &mdash; {{ now()->format('d M Y H:i:s') }}
</div>

</body>
</html>
