<?php
session_start();
$config = require 'config.php';

// Auth handling
if (isset($_POST['password'])) {
    if ($_POST['password'] === $config['admin_password']) {
        $_SESSION['authenticated'] = true;
    } else {
        $error = "Invalid password";
    }
}

if (isset($_GET['logout'])) {
    session_destroy();
    header("Location: index.php");
    exit;
}

if (isset($_GET['reset']) && isset($_SESSION['authenticated'])) {
    if (file_exists('data/progress.json')) unlink('data/progress.json');
    if (file_exists('data/sent.log')) unlink('data/sent.log');
    if (file_exists('data/failed.log')) unlink('data/failed.log');
    header("Location: index.php");
    exit;
}

$isAuthenticated = isset($_SESSION['authenticated']) && $_SESSION['authenticated'] === true;
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>emazingSM Migration Mailer</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; background-color: #0f172a; color: #f8fafc; }
        .glass { background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.1); }
        .gradient-text { background: linear-gradient(135deg, #38bdf8, #818cf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .progress-bar { transition: width 0.5s ease-in-out; }
    </style>
</head>
<body class="min-h-screen p-4 md:p-8">
    <div class="max-w-4xl mx-auto">
        <header class="flex justify-between items-center mb-8">
            <div>
                <h1 class="text-3xl font-bold gradient-text">emazingSM</h1>
                <p class="text-slate-400 text-sm">Migration Mailer Dashboard v2.0</p>
            </div>
            <?php if ($isAuthenticated): ?>
                <a href="?logout=1" class="text-slate-400 hover:text-white text-sm bg-slate-800 px-4 py-2 rounded-lg transition">Logout</a>
            <?php endif; ?>
        </header>

        <?php if (!$isAuthenticated): ?>
            <div class="glass p-8 rounded-2xl max-w-md mx-auto mt-20">
                <h2 class="text-xl font-bold mb-6 text-center">Admin Access</h2>
                <form method="POST" class="space-y-4">
                    <input type="password" name="password" placeholder="Enter System Password" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <?php if (isset($error)): ?><p class="text-red-400 text-xs text-center"><?= $error ?></p><?php endif; ?>
                    <button class="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition">Unlock Dashboard</button>
                </form>
            </div>
        <?php else: ?>
            <script>
                window.onload = async () => {
                    const res = await fetch('get_state.php');
                    const data = await res.json();
                    if (data && !data.error) {
                        updateUI(data);
                        if (data.is_complete) {
                            document.getElementById('stat-status').innerText = 'Finished';
                            document.getElementById('btn-start').disabled = true;
                        }
                    }

                    // Fetch recent logs
                    const logRes = await fetch('get_logs.php');
                    const logData = await logRes.json();
                    if (Array.isArray(logData)) {
                        logs = logData;
                        renderLogs();
                    }
                };
            </script>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div class="glass p-6 rounded-2xl">
                    <p class="text-slate-400 text-xs uppercase tracking-wider mb-1">Success</p>
                    <p id="stat-success" class="text-4xl font-bold text-emerald-400">0</p>
                </div>
                <div class="glass p-6 rounded-2xl">
                    <p class="text-slate-400 text-xs uppercase tracking-wider mb-1">Failed</p>
                    <p id="stat-failed" class="text-4xl font-bold text-rose-400">0</p>
                </div>
                <div class="glass p-6 rounded-2xl">
                    <p class="text-slate-400 text-xs uppercase tracking-wider mb-1">Status</p>
                    <p id="stat-status" class="text-xl font-bold text-blue-400 mt-2 italic">Ready</p>
                </div>
            </div>

            <div class="glass p-8 rounded-2xl mb-6">
                <div class="flex justify-between items-end mb-4">
                    <div>
                        <h3 class="font-bold text-lg">Campaign Progress</h3>
                        <p id="progress-text" class="text-slate-400 text-sm">Waiting to start...</p>
                    </div>
                    <p id="progress-percent" class="text-2xl font-bold text-blue-400">0%</p>
                </div>
                <div class="w-full h-4 bg-slate-900 rounded-full overflow-hidden">
                    <div id="progress-bar" class="progress-bar h-full bg-blue-600 w-0"></div>
                </div>
            </div>

            <div class="flex flex-wrap gap-4 mb-8">
                <button id="btn-start" onclick="startCampaign()" class="bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-3 rounded-xl transition shadow-lg shadow-blue-900/20">Start Campaign</button>
                <button id="btn-pause" onclick="pauseCampaign()" class="bg-slate-700 hover:bg-slate-600 text-white font-bold px-8 py-3 rounded-xl transition hidden">Pause</button>
                <a href="download.php" class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-3 rounded-xl transition shadow-lg shadow-emerald-900/20">Download Detailed CSV</a>
                <button onclick="if(confirm('Reset all progress?')) window.location.href='?reset=1'" class="bg-transparent border border-slate-700 hover:bg-slate-800 text-slate-400 px-8 py-3 rounded-xl transition">Reset Data</button>
            </div>

            <div class="glass rounded-2xl overflow-hidden">
                <div class="flex border-b border-slate-700">
                    <button onclick="switchTab('all')" class="tab-btn px-6 py-4 text-sm font-bold border-b-2 border-blue-500 text-blue-400">All Activity</button>
                    <button onclick="switchTab('success')" class="tab-btn px-6 py-4 text-sm font-bold text-slate-400 hover:text-white">Success</button>
                    <button onclick="switchTab('failed')" class="tab-btn px-6 py-4 text-sm font-bold text-slate-400 hover:text-white">Failures</button>
                </div>
                <div id="log-container" class="h-80 overflow-y-auto p-4 space-y-2 text-xs font-mono">
                    <div class="text-slate-500 italic">Logs will appear here...</div>
                </div>
            </div>
        <?php endif; ?>
    </div>

    <script>
        let isRunning = false;
        let logs = [];
        let currentTab = 'all';

        async function startCampaign() {
            if (isRunning) return;
            isRunning = true;
            document.getElementById('btn-start').classList.add('hidden');
            document.getElementById('btn-pause').classList.remove('hidden');
            document.getElementById('stat-status').innerText = 'Sending...';
            processBatch();
        }

        function pauseCampaign() {
            isRunning = false;
            document.getElementById('btn-start').classList.remove('hidden');
            document.getElementById('btn-start').innerText = 'Resume Campaign';
            document.getElementById('btn-pause').classList.add('hidden');
            document.getElementById('stat-status').innerText = 'Paused';
        }

        async function processBatch() {
            if (!isRunning) return;

            try {
                const response = await fetch('process.php');
                const data = await response.json();

                if (data.error) {
                    addLog('ERROR: ' + data.error, 'failed');
                    pauseCampaign();
                    return;
                }

                updateUI(data.progress);
                
                if (data.batch_results) {
                    data.batch_results.forEach(res => {
                        addLog(`${res.status.toUpperCase()}: ${res.email}`, res.status);
                    });
                }

                if (data.status === 'complete') {
                    document.getElementById('stat-status').innerText = 'Finished';
                    isRunning = false;
                    alert('Campaign Completed!');
                } else {
                    processBatch();
                }
            } catch (e) {
                addLog('System Error: ' + e.message, 'failed');
                pauseCampaign();
            }
        }

        function updateUI(p) {
            document.getElementById('stat-success').innerText = p.success_count;
            document.getElementById('stat-failed').innerText = p.failed_count;
            
            const total = 4278; // Fixed total for this campaign
            const processed = p.offset - 1;
            const percent = Math.min(100, Math.round((processed / total) * 100));

            document.getElementById('progress-text').innerText = `Processed ${processed} of ${total} users`;
            document.getElementById('progress-percent').innerText = `${percent}%`;
            document.getElementById('progress-bar').style.width = `${percent}%`;
        }

        function addLog(msg, type) {
            const timestamp = new Date().toLocaleTimeString();
            logs.unshift({ msg, type, time: timestamp });
            renderLogs();
        }

        function renderLogs() {
            const container = document.getElementById('log-container');
            container.innerHTML = '';
            
            const filtered = logs.filter(l => {
                if (currentTab === 'all') return true;
                if (currentTab === 'success') return ['sent', 'opened', 'delivered', 'success'].includes(l.type);
                if (currentTab === 'failed') return ['failed', 'blocked', 'hardbounced', 'softbounced'].includes(l.type);
                return l.type === currentTab;
            });

            filtered.slice(0, 100).forEach(l => {
                const div = document.createElement('div');
                let color = 'text-slate-400';
                if (['sent', 'opened', 'delivered', 'success'].includes(l.type)) color = 'text-emerald-400';
                if (['failed', 'blocked', 'hardbounced', 'softbounced'].includes(l.type)) color = 'text-rose-400';
                
                div.className = color;
                div.innerHTML = `<span class="opacity-40">[${l.time}]</span> <span class="font-bold uppercase text-[10px] bg-white/10 px-1.5 py-0.5 rounded mr-2">${l.type}</span> ${l.msg}`;
                container.appendChild(div);
            });
        }

        function switchTab(tab) {
            currentTab = tab;
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.remove('border-blue-500', 'text-blue-400');
                btn.classList.add('text-slate-400');
            });
            event.target.classList.add('border-blue-500', 'text-blue-400');
            renderLogs();
        }
    </script>
</body>
</html>
