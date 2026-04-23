<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>{{ config('app.name', 'ReachAll Hub') }}</title>
        <style>
            :root {
                color-scheme: light;
            }

            * {
                box-sizing: border-box;
            }

            body {
                margin: 0;
                min-height: 100vh;
                font-family: Arial, sans-serif;
                background: #f5f7f8;
                color: #1f2937;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 24px;
            }

            .card {
                width: 100%;
                max-width: 420px;
                background: #ffffff;
                border-radius: 16px;
                box-shadow: 0 20px 60px rgba(15, 23, 42, 0.12);
                padding: 32px;
            }

            .logo {
                width: 64px;
                height: 64px;
                margin: 0 auto 16px;
                border-radius: 999px;
                background: #1f6e4a;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #fff;
                font-size: 28px;
                font-weight: 700;
            }

            h1 {
                margin: 0 0 8px;
                text-align: center;
                font-size: 28px;
            }

            p.subtitle {
                margin: 0 0 24px;
                text-align: center;
                color: #6b7280;
                line-height: 1.5;
            }

            label {
                display: block;
                margin-bottom: 8px;
                font-size: 14px;
                font-weight: 600;
            }

            input {
                width: 100%;
                padding: 12px 14px;
                border: 1px solid #d1d5db;
                border-radius: 10px;
                font-size: 15px;
                margin-bottom: 16px;
            }

            input:focus {
                outline: 2px solid rgba(31, 110, 74, 0.2);
                border-color: #1f6e4a;
            }

            button {
                width: 100%;
                border: 0;
                border-radius: 10px;
                padding: 12px 16px;
                background: #1f6e4a;
                color: #fff;
                font-size: 15px;
                font-weight: 600;
                cursor: pointer;
            }

            button:hover {
                background: #18583b;
            }

            .message,
            .error-list {
                margin-bottom: 16px;
                border-radius: 10px;
                padding: 12px 14px;
                font-size: 14px;
            }

            .message {
                background: #ecfdf5;
                color: #166534;
                border: 1px solid #bbf7d0;
            }

            .error-list {
                background: #fef2f2;
                color: #b91c1c;
                border: 1px solid #fecaca;
            }

            .error-list ul {
                margin: 0;
                padding-left: 18px;
            }

            .hint {
                margin-top: 18px;
                font-size: 13px;
                color: #6b7280;
                text-align: center;
                line-height: 1.5;
            }

            .links {
                margin-top: 18px;
                display: flex;
                flex-direction: column;
                gap: 8px;
                text-align: center;
            }

            .links a {
                color: #1f6e4a;
                text-decoration: none;
                font-size: 14px;
            }

            .links a:hover {
                text-decoration: underline;
            }
        </style>
    </head>
    <body>
        <div class="card">
            <div class="logo">TS</div>
            <h1>Welcome Back</h1>
            <p class="subtitle">Sign in with your employee ID or email address.</p>

            @if ($status)
                <div class="message">{{ $status }}</div>
            @endif

            @if ($errors->any())
                <div class="error-list">
                    <ul>
                        @foreach ($errors->all() as $error)
                            <li>{{ $error }}</li>
                        @endforeach
                    </ul>
                </div>
            @endif

            <form method="POST" action="{{ route('login.store') }}">
                @csrf

                <label for="employee_id">Employee ID or Email</label>
                <input
                    id="employee_id"
                    name="employee_id"
                    type="text"
                    value="{{ old('employee_id') }}"
                    placeholder="EMP1000 or test@example.com"
                    autocomplete="username"
                    required
                >

                <label for="password">Password</label>
                <input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    autocomplete="current-password"
                    required
                >

                <button type="submit">Sign In</button>
            </form>

            <div class="links">
                @if ($canResetPassword)
                    <a href="{{ route('password.request') }}">Forgot your password?</a>
                @endif

                @if ($canRegister)
                    <a href="{{ route('register') }}">Create an account</a>
                @endif
            </div>

            <p class="hint">Local demo account: <strong>test@example.com</strong> / <strong>password</strong></p>
        </div>
    </body>
</html>
