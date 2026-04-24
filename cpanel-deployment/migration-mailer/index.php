<?php
session_start();
require_once 'config.php';

// Handle Login
$error = '';
if (isset($_POST['password'])) {
    if ($_POST['password'] === MAILER_PASSWORD) {
        $_SESSION['authenticated'] = true;
    } else {
        $error = 'Invalid Password';
    }
}

// Handle Logout
if (isset($_GET['logout'])) {
    session_destroy();
    header('Location: index.php');
    exit;
}

$is_auth = isset($_SESSION['authenticated']) && $_SESSION['authenticated'] === true;
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>emazingSM | Migration Mailer</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #0074d4;
            --primary-dark: #0056a3;
            --bg: #f4f7f9;
            --card: #ffffff;
            --text: #1a202c;
            --muted: #718096;
            --success: #38a169;
            --error: #e53e3e;
            --border: #e2e8f0;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text); line-height: 1.5; padding: 40px 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        
        .card { background: var(--card); border-radius: 16px; padding: 40px; shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid var(--border); margin-bottom: 24px; }
        .header { text-align: center; margin-bottom: 40px; }
        .header h1 { font-size: 28px; font-weight: 700; color: var(--primary); margin-bottom: 8px; }
        .header p { color: var(--muted); }

        /* Login Form */
        .login-form { max-width: 400px; margin: 0 auto; text-align: center; }
        input[type="password"] { width: 100%; padding: 12px 16px; border: 2px solid var(--border); border-radius: 8px; font-size: 16px; margin-bottom: 16px; transition: border-color 0.2s; }
        input[type="password"]:focus { outline: none; border-color: var(--primary); }
        .btn { display: inline-block; width: 100%; padding: 12px 24px; background: var(--primary); color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; transition: background 0.2s, transform 0.1s; text-decoration: none; text-align: center; }
        .btn:hover { background: var(--primary-dark); }
        .btn:active { transform: scale(0.98); }
        .btn-secondary { background: var(--muted); }
        .btn-secondary:hover { background: #4a5568; }
        .btn-danger { background: var(--error); }

        /* Dashboard */
        .stats-grid { display: grid; grid-template-cols: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; margin-bottom: 32px; }
        .stat-box { padding: 20px; background: var(--bg); border-radius: 12px; text-align: center; }
        .stat-val { font-size: 24px; font-weight: 700; color: var(--primary); }
        .stat-label { font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }

        .progress-container { margin-bottom: 32px; }
        .progress-label { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; font-weight: 600; }
        .progress-bar-bg { background: var(--border); height: 12px; border-radius: 6px; overflow: hidden; }
        .progress-bar-fill { height: 100%; background: var(--primary); width: 0%; transition: width 0.4s ease; }

        .log-container { background: #1a202c; color: #a0aec0; padding: 20px; border-radius: 12px; height: 300px; overflow-y: auto; font-family: 'Monaco', 'Consolas', monospace; font-size: 13px; line-height: 1.8; }
        .log-entry { margin-bottom: 4px; border-bottom: 1px solid #2d3748; padding-bottom: 4px; }
        .log-success { color: #48bb78; }
        .log-error { color: #f56565; }

        .controls { display: flex; gap: 16px; }
        .controls .btn { flex: 1; }

        .alert { padding: 12px; border-radius: 8px; margin-bottom: 16px; font-size: 14px; }
        .alert-error { background: #fff5f5; color: var(--error); border: 1px solid #feb2b2; }
    </style>
</head>
<body>

<div class="container">
    <div class="header">
        <h1>emazingSM</h1>
        <p>Bulk Migration Mailer v1.0</p>
    </div>

    <?php if (!$is_auth): ?>
        <div class="card">
            <div class="login-form">
                <h2 style="margin-bottom: 20px;">Secure Login</h2>
                <?php if ($error): ?>
                    <div class="alert alert-error"><?php echo $error; ?></div>
                <?php endif; ?>
                <form method="POST">
                    <input type="password" name="password" placeholder="Enter System Password" required autofocus>
                    <button type="submit" class="btn">Access Dashboard</button>
                </form>
            </div>
        </div>
    <?php else: ?>
        <div class="card">
            <div class="stats-grid">
                <div class="stat-box">
                    <div class="stat-val" id="stat-total">0</div>
                    <div class="stat-label">Total Users</div>
                </div>
                <div class="stat-box">
                    <div class="stat-val" id="stat-success" style="color: var(--success);">0</div>
                    <div class="stat-label">Sent</div>
                </div>
                <div class="stat-box">
                    <div class="stat-val" id="stat-failed" style="color: var(--error);">0</div>
                    <div class="stat-label">Failed</div>
                </div>
                <div class="stat-box">
                    <div class="stat-val" id="stat-percentage">0%</div>
                    <div class="stat-label">Progress</div>
                </div>
            </div>

            <div class="progress-container">
                <div class="progress-label">
                    <span>Campaign Progress</span>
                    <span id="progress-text">0 / 0</span>
                </div>
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill" id="progress-bar"></div>
                </div>
            </div>

            <div class="log-container" id="log-window">
                <div class="log-entry">System ready. Click start to begin the campaign.</div>
            </div>

            <div class="controls" style="margin-top: 24px;">
                <button id="btn-start" class="btn">Start Campaign</button>
                <button id="btn-pause" class="btn btn-secondary" style="display:none;">Pause</button>
                <button id="btn-reset" class="btn btn-danger" style="flex: 0 0 100px;">Reset</button>
            </div>

            <div style="text-align: center; margin-top: 20px;">
                <a href="?logout=1" style="color: var(--muted); font-size: 13px; text-decoration: none;">Logout System</a>
            </div>
        </div>
    <?php endif; ?>
</div>

<script>
    let isRunning = false;
    const btnStart = document.getElementById('btn-start');
    const btnPause = document.getElementById('btn-pause');
    const btnReset = document.getElementById('btn-reset');
    const logWindow = document.getElementById('log-window');

    function updateLog(message, type = '') {
        const div = document.createElement('div');
        div.className = 'log-entry ' + (type ? 'log-' + type : '');
        div.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        logWindow.prepend(div);
    }

    async function processBatch() {
        if (!isRunning) return;

        try {
            const response = await fetch('process.php');
            const data = await response.json();

            if (data.error) {
                updateLog('Error: ' + data.error, 'error');
                isRunning = false;
                toggleButtons();
                return;
            }

            // Update Stats
            document.getElementById('stat-total').textContent = data.progress.total;
            document.getElementById('stat-success').textContent = data.progress.success;
            document.getElementById('stat-failed').textContent = data.progress.failed;
            document.getElementById('stat-percentage').textContent = data.progress.percentage + '%';
            document.getElementById('progress-text').textContent = `${data.progress.current} / ${data.progress.total}`;
            document.getElementById('progress-bar').style.width = data.progress.percentage + '%';

            // Update Logs
            if (data.batch_results) {
                data.batch_results.forEach(res => {
                    updateLog(`${res.status.toUpperCase()}: ${res.email}`, res.status);
                });
            }

            if (data.status === 'complete') {
                updateLog('CAMPAIGN COMPLETED SUCCESSFULLY!', 'success');
                isRunning = false;
                toggleButtons();
                return;
            }

            // Continue to next batch
            setTimeout(processBatch, 500);

        } catch (err) {
            updateLog('Network Error. Retrying in 5 seconds...', 'error');
            setTimeout(processBatch, 5000);
        }
    }

    function toggleButtons() {
        if (isRunning) {
            btnStart.style.display = 'none';
            btnPause.style.display = 'inline-block';
        } else {
            btnStart.style.display = 'inline-block';
            btnPause.style.display = 'none';
            btnStart.textContent = 'Resume Campaign';
        }
    }

    if (btnStart) {
        btnStart.addEventListener('click', () => {
            isRunning = true;
            toggleButtons();
            updateLog('Starting campaign processing...');
            processBatch();
        });

        btnPause.addEventListener('click', () => {
            isRunning = false;
            toggleButtons();
            updateLog('Campaign paused.');
        });

        btnReset.addEventListener('click', async () => {
            if (confirm('Are you sure you want to reset all progress? This will delete logs.')) {
                isRunning = false;
                const resp = await fetch('process.php?reset=true');
                location.reload();
            }
        });
    }
</script>

</body>
</html>
