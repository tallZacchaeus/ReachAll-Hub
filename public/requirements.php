<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Server Requirements Check</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        .header {
            background: #1F6E4A;
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 { font-size: 28px; margin-bottom: 10px; }
        .header p { opacity: 0.9; }
        .content { padding: 30px; }
        .requirement {
            display: flex;
            align-items: center;
            padding: 15px;
            margin-bottom: 10px;
            border-radius: 8px;
            background: #f8f9fa;
        }
        .requirement.pass { background: #d4edda; border-left: 4px solid #28a745; }
        .requirement.fail { background: #f8d7da; border-left: 4px solid #dc3545; }
        .requirement.warning { background: #fff3cd; border-left: 4px solid #ffc107; }
        .icon {
            width: 24px;
            height: 24px;
            margin-right: 15px;
            font-size: 20px;
        }
        .label { flex: 1; font-weight: 500; }
        .value { color: #666; font-size: 14px; }
        .section {
            margin-bottom: 30px;
        }
        .section h2 {
            font-size: 20px;
            margin-bottom: 15px;
            color: #333;
            border-bottom: 2px solid #1F6E4A;
            padding-bottom: 10px;
        }
        .summary {
            background: #e7f3ff;
            border: 1px solid #b3d9ff;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
        }
        .summary h3 { color: #004085; margin-bottom: 10px; }
        .summary p { color: #004085; line-height: 1.6; }
        .footer {
            text-align: center;
            padding: 20px;
            background: #f8f9fa;
            color: #666;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Server Requirements Check</h1>
            <p>ReachAll Hub</p>
        </div>
        
        <div class="content">
            <?php
            $requirements = [
                'PHP Version' => version_compare(PHP_VERSION, '8.1.0', '>='),
                'OpenSSL Extension' => extension_loaded('openssl'),
                'PDO Extension' => extension_loaded('pdo'),
                'Mbstring Extension' => extension_loaded('mbstring'),
                'Tokenizer Extension' => extension_loaded('tokenizer'),
                'XML Extension' => extension_loaded('xml'),
                'Ctype Extension' => extension_loaded('ctype'),
                'JSON Extension' => extension_loaded('json'),
                'BCMath Extension' => extension_loaded('bcmath'),
                'Fileinfo Extension' => extension_loaded('fileinfo'),
                'GD Extension' => extension_loaded('gd'),
                'cURL Extension' => extension_loaded('curl'),
                'ZIP Extension' => extension_loaded('zip'),
            ];

            $permissions = [
                'storage/' => is_writable(__DIR__.'/storage'),
                'bootstrap/cache/' => is_writable(__DIR__.'/bootstrap/cache'),
            ];

            $passed = 0;
            $failed = 0;
            $total = count($requirements) + count($permissions);

            foreach ($requirements as $req => $status) {
                $status ? $passed++ : $failed++;
            }
            foreach ($permissions as $perm => $status) {
                $status ? $passed++ : $failed++;
            }

            $allPassed = $failed === 0;
            ?>

            <div class="summary">
                <h3><?php echo $allPassed ? '✅ All Requirements Met!' : '⚠️ Some Requirements Not Met'; ?></h3>
                <p>
                    <?php echo $passed; ?> of <?php echo $total; ?> requirements passed.
                    <?php if ($allPassed) { ?>
                        Your server is ready to host the ReachAll Hub!
                    <?php } else { ?>
                        Please fix the failed requirements before deploying.
                    <?php } ?>
                </p>
            </div>

            <div class="section">
                <h2>PHP Requirements</h2>
                <div class="requirement <?php echo version_compare(PHP_VERSION, '8.1.0', '>=') ? 'pass' : 'fail'; ?>">
                    <span class="icon"><?php echo version_compare(PHP_VERSION, '8.1.0', '>=') ? '✅' : '❌'; ?></span>
                    <span class="label">PHP Version</span>
                    <span class="value">Current: <?php echo PHP_VERSION; ?> (Required: >= 8.1.0)</span>
                </div>
                
                <?php foreach ($requirements as $name => $status) { ?>
                    <?php if ($name !== 'PHP Version') { ?>
                    <div class="requirement <?php echo $status ? 'pass' : 'fail'; ?>">
                        <span class="icon"><?php echo $status ? '✅' : '❌'; ?></span>
                        <span class="label"><?php echo $name; ?></span>
                        <span class="value"><?php echo $status ? 'Enabled' : 'Not Installed'; ?></span>
                    </div>
                    <?php } ?>
                <?php } ?>
            </div>

            <div class="section">
                <h2>Directory Permissions</h2>
                <?php foreach ($permissions as $dir => $status) { ?>
                <div class="requirement <?php echo $status ? 'pass' : 'fail'; ?>">
                    <span class="icon"><?php echo $status ? '✅' : '❌'; ?></span>
                    <span class="label"><?php echo $dir; ?></span>
                    <span class="value"><?php echo $status ? 'Writable' : 'Not Writable'; ?></span>
                </div>
                <?php } ?>
            </div>

            <div class="section">
                <h2>Server Information</h2>
                <div class="requirement pass">
                    <span class="icon">ℹ️</span>
                    <span class="label">Server Software</span>
                    <span class="value"><?php echo $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown'; ?></span>
                </div>
                <div class="requirement pass">
                    <span class="icon">💾</span>
                    <span class="label">Memory Limit</span>
                    <span class="value"><?php echo ini_get('memory_limit'); ?></span>
                </div>
                <div class="requirement pass">
                    <span class="icon">⏱️</span>
                    <span class="label">Max Execution Time</span>
                    <span class="value"><?php echo ini_get('max_execution_time'); ?>s</span>
                </div>
                <div class="requirement pass">
                    <span class="icon">📤</span>
                    <span class="label">Upload Max Filesize</span>
                    <span class="value"><?php echo ini_get('upload_max_filesize'); ?></span>
                </div>
                <div class="requirement pass">
                    <span class="icon">📥</span>
                    <span class="label">Post Max Size</span>
                    <span class="value"><?php echo ini_get('post_max_size'); ?></span>
                </div>
            </div>

            <?php if (! $allPassed) { ?>
            <div class="section">
                <h2>Next Steps</h2>
                <div class="summary" style="background: #fff3cd; border-color: #ffc107;">
                    <h3 style="color: #856404;">⚠️ Action Required</h3>
                    <p style="color: #856404;">
                        1. Contact your hosting provider to install missing PHP extensions<br>
                        2. Set directory permissions: chmod -R 775 storage bootstrap/cache<br>
                        3. Refresh this page to verify all requirements are met
                    </p>
                </div>
            </div>
            <?php } ?>
        </div>

        <div class="footer">
            <p>ReachAll Hub © <?php echo date('Y'); ?></p>
            <p style="margin-top: 5px; font-size: 12px;">
                Delete this file (requirements.php) after deployment for security
            </p>
        </div>
    </div>
</body>
</html>
