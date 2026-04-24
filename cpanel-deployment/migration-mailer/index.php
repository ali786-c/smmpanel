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
    <title>emazingSM | Advanced Migration Mailer</title>
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
            --dark-bg: #1a202c;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text); line-height: 1.5; padding: 40px 20px; }
        .container { max-width: 900px; margin: 0 auto; }
        
        .card { background: var(--card); border-radius: 16px; padding: 30px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid var(--border); margin-bottom: 24px; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { font-size: 28px; font-weight: 700; color: var(--primary); margin-bottom: 4px; }
        .header p { color: var(--muted); font-size: 14px; }

        /* Login Form */
        .login-form { max-width: 400px; margin: 0 auto; text-align: center; }
        input[type="password"] { width: 100%; padding: 12px 16px; border: 2px solid var(--border); border-radius: 8px; font-size: 16px; margin-bottom: 16px; transition: border-color 0.2s; }
        input[type="password"]:focus { outline: none; border-color: var(--primary); }
        .btn { display: inline-block; width: 100%; padding: 12px 24px; background: var(--primary); color: white; border: none; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; transition: background 0.2s, transform 0.1s; text-decoration: none; text-align: center; }
        .btn:hover { background: var(--primary-dark); }
        .btn:active { transform: scale(0.98); }
        .btn-secondary { background: var(--muted); }
        .btn-danger { background: var(--error); }

        /* Stats */
        .stats-grid { display: grid; grid-template-cols: repeat(4, 1fr); gap: 15px; margin-bottom: 25px; }
        .stat-box { padding: 20px; background: #fff; border: 1px solid var(--border); border-radius: 12px; text-align: center; }
        .stat-val { font-size: 22px; font-weight: 700; color: var(--text); }
        .stat-label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; margin-top: 5px; }
        .stat-box.primary .stat-val { color: var(--primary); }
        .stat-box.success .stat-val { color: var(--success); }
        .stat-box.error .stat-val { color: var(--error); }

        /* Progress Bar */
        .progress-section { margin-bottom: 25px; background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid var(--border); }
        .progress-info { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px; font-weight: 700; }
        .progress-bar-bg { background: #e2e8f0; height: 10px; border-radius: 5px; overflow: hidden; }
        .progress-bar-fill { height: 100%; background: linear-gradient(90deg, var(--primary), #4299e1); width: 0%; transition: width 0.4s ease; }

        /* Tabs System */
        .tabs-container { margin-top: 20px; }
        .tabs-header { display: flex; gap: 5px; background: #2d3748; padding: 8px 8px 0; border-radius: 12px 12px 0 0; }
        .tab-btn { padding: 10px 20px; color: #cbd5e0; cursor: pointer; border-radius: 8px 8px 0 0; font-size: 12px; font-weight: 600; transition: all 0.2s; border: none; background: transparent; }
        .tab-btn:hover { color: white; }
        .tab-btn.active { background: var(--dark-bg); color: white; }
        .tab-content { display: none; background: var(--dark-bg); color: #cbd5e0; padding: 15px; border-radius: 0 0 12px 12px; height: 350px; overflow-y: auto; font-family: 'Monaco', 'Consolas', monospace; font-size: 12px; border: 1px solid #2d3748; border-top: none; }
        .tab-content.active { display: block; }
        
        .log-entry { padding: 6px 0; border-bottom: 1px solid #2d3748; display: flex; justify-content: space-between; gap: 10px; }
        .log-entry:last-child { border-bottom: none; }
        .log-time { color: #718096; flex-shrink: 0; }
        .log-msg { flex-grow: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .log-status { font-weight: bold; text-transform: uppercase; font-size: 10px; padding: 2px 6px; border-radius: 4px; }
        .status-success { color: #48bb78; background: rgba(72, 187, 120, 0.1); }
        .status-failed { color: #f56565; background: rgba(245, 101, 101, 0.1); }

        .current-target { font-size: 13px; color: var(--muted); margin-bottom: 10px; font-style: italic; }

        .controls { display: flex; gap: 12px; margin-top: 20px; }
        .controls .btn { flex: 1; }

        .alert { padding: 12px; border-radius: 8px; margin-bottom: 16px; font-size: 14px; text-align: center; }
        .alert-error { background: #fff5f5; color: var(--error); border: 1px solid #feb2b2; }
    </style>
</head>
<body>

<div class="container">
    <div class="header">
        <h1>emazingSM</h1>
        <p>Real-time Migration Control Panel</p>
    </div>

    <?php if (!$is_auth): ?>
        <div class="card">
            <div class="login-form">
                <h2 style="margin-bottom: 20px;">System Authentication</h2>
                <?php if ($error): ?>
                    <div class="alert alert-error"><?php echo $error; ?></div>
                <?php endif; ?>
                <form method="POST">
                    <input type="password" name="password" placeholder="Enter Campaign Password" required autofocus>
                    <button type="submit" class="btn">Login to Campaign</button>
                </form>
            </div>
        </div>
    <?php else: ?>
        <div class="stats-grid">
            <div class="stat-box">
                <div class="stat-val" id="stat-total">0</div>
                <div class="stat-label">Total Users</div>
            </div>
            <div class="stat-box success">
                <div class="stat-val" id="stat-success">0</div>
                <div class="stat-label">Successful</div>
            </div>
            <div class="stat-box error">
                <div class="stat-val" id="stat-failed">0</div>
                <div class="stat-label">Failed</div>
            </div>
            <div class="stat-box primary">
                <div class="stat-val" id="stat-percentage">0%</div>
                <div class="stat-label">Progress</div>
            </div>
        </div>

        <div class="card">
            <div class="progress-section">
                <div class="current-target" id="current-target">Status: Idle. Waiting to start...</div>
                <div class="progress-info">
                    <span>Campaign Health</span>
                    <span id="progress-text">0 / 0</span>
                </div>
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill" id="progress-bar"></div>
                </div>
            </div>

            <div class="tabs-container">
                <div class="tabs-header">
                    <button class="tab-btn active" onclick="showTab('tab-all')">All Activity</button>
                    <button class="tab-btn" onclick="showTab('tab-success')">Success List</button>
                    <button class="tab-btn" onclick="showTab('tab-failed')">Failures</button>
                </div>
                <div id="tab-all" class="tab-content active"></div>
                <div id="tab-success" class="tab-content"></div>
                <div id="tab-failed" class="tab-content"></div>
            </div>

            <div class="controls">
                <button id="btn-start" class="btn">🚀 Start Campaign</button>
                <button id="btn-pause" class="btn btn-secondary" style="display:none;">⏸ Pause</button>
                <button id="btn-reset" class="btn btn-danger" style="flex: 0 0 100px;">🔄 Reset</button>
            </div>

            <div style="text-align: center; margin-top: 25px;">
                <a href="?logout=1" style="color: var(--muted); font-size: 12px; text-decoration: none; border-bottom: 1px dashed #cbd5e0;">Logout and Secure Session</a>
            </div>
        </div>
    <?php endif; ?>
</div>

<script>
    let isRunning = false;
    const btnStart = document.getElementById('btn-start');
    const btnPause = document.getElementById('btn-pause');
    const btnReset = document.getElementById('btn-reset');
    const targetInfo = document.getElementById('current-target');

    function showTab(tabId) {
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.getElementById(tabId).classList.add('active');
        event.currentTarget.classList.add('active');
    }

    function addLogEntry(email, status, error = '') {
        const time = new Date().toLocaleTimeString();
        const entryHtml = `
            <div class="log-entry">
                <span class="log-time">${time}</span>
                <span class="log-msg">${email}</span>
                <span class="log-status status-${status}">${status}</span>
            </div>
        `;
        
        // Add to All Activity
        document.getElementById('tab-all').insertAdjacentHTML('afterbegin', entryHtml);
        
        // Add to specific tabs
        if (status === 'success') {
            document.getElementById('tab-success').insertAdjacentHTML('afterbegin', entryHtml);
        } else {
            const errorHtml = `
                <div class="log-entry">
                    <span class="log-time">${time}</span>
                    <span class="log-msg" title="${error}">${email} <small style="color:#f56565">(${error})</small></span>
                    <span class="log-status status-failed">failed</span>
                </div>
            `;
            document.getElementById('tab-failed').insertAdjacentHTML('afterbegin', errorHtml);
        }
    }

    async function processBatch() {
        if (!isRunning) return;

        try {
            targetInfo.textContent = 'Status: Sending batch...';
            const response = await fetch('process.php');
            const data = await response.json();

            if (data.error) {
                targetInfo.textContent = 'Status: STOPPED due to error.';
                addLogEntry('SYSTEM', 'failed', data.error);
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
                    addLogEntry(res.email, res.status, res.error || '');
                });
            }

            if (data.status === 'complete') {
                targetInfo.textContent = 'Status: COMPLETED!';
                isRunning = false;
                toggleButtons();
                return;
            }

            targetInfo.textContent = `Status: Processing... Last: ${data.batch_results[data.batch_results.length-1].email}`;
            
            // Continue to next batch
            setTimeout(processBatch, 400);

        } catch (err) {
            targetInfo.textContent = 'Status: Network error. Retrying...';
            setTimeout(processBatch, 3000);
        }
    }

    function toggleButtons() {
        if (isRunning) {
            btnStart.style.display = 'none';
            btnPause.style.display = 'inline-block';
        } else {
            btnStart.style.display = 'inline-block';
            btnPause.style.display = 'none';
            btnStart.textContent = '🚀 Resume Campaign';
        }
    }

    if (btnStart) {
        btnStart.addEventListener('click', () => {
            isRunning = true;
            toggleButtons();
            processBatch();
        });

        btnPause.addEventListener('click', () => {
            isRunning = false;
            toggleButtons();
            targetInfo.textContent = 'Status: Paused by user.';
        });

        btnReset.addEventListener('click', async () => {
            if (confirm('Are you sure you want to RESET everything? This will clear all progress and start from zero.')) {
                isRunning = false;
                await fetch('process.php?reset=true');
                location.reload();
            }
        });
    }
</script>

</body>
</html>
