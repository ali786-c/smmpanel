<?php
/**
 * AI Blogging Engine - Health Diagnostic Tool
 * Used to verify Gemini API, Database, and Queue health.
 */

define('LARAVEL_START', microtime(true));

// 1. Boot Laravel to access all services
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$response = $kernel->handle($request = Illuminate\Http\Request::capture());

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use App\Services\GeminiService;

header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>AI Blog Diagnostic Tool</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 900px; margin: 0 auto; padding: 40px 20px; background: #f4f7f6; }
        .card { background: #fff; padding: 25px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); margin-bottom: 20px; }
        h1 { color: #1a202c; font-size: 24px; margin-bottom: 20px; border-bottom: 2px solid #edf2f7; padding-bottom: 10px; }
        h2 { font-size: 18px; margin-top: 0; display: flex; align-items: center; gap: 8px; }
        .status { padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
        .pass { background: #c6f6d5; color: #22543d; }
        .fail { background: #fed7d7; color: #822727; }
        .warn { background: #feebc8; color: #744210; }
        .details { background: #f7fafc; padding: 10px; border-radius: 6px; border-left: 4px solid #cbd5e0; margin-top: 10px; font-family: monospace; font-size: 13px; white-space: pre-wrap; overflow-x: auto; }
        .recommendation { margin-top: 15px; padding: 12px; border-radius: 8px; background: #ebf8ff; border: 1px solid #bee3f8; color: #2a4365; font-size: 14px; }
        .icon-check::before { content: '✅'; }
        .icon-cross::before { content: '❌'; }
        .icon-warn::before { content: '⚠️'; }
    </style>
</head>
<body>
    <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="border-bottom: none; margin-bottom: 5px;">🚀 AI Blog Engine Health Diagnostic</h1>
        <p style="color: #718096; font-size: 14px;">Verification results from your current environment</p>
    </div>

    <!-- 1. Environment & API Check -->
    <div class="card">
        <h2>Environment & API Connection</h2>
        <?php
        $apiKey = env('GOOGLE_GEMINI_API_KEY');
        $hasKey = !empty($apiKey);
        ?>
        <div>
            <span>Gemini API Key:</span>
            <span class="status <?php echo $hasKey ? 'pass' : 'fail'; ?>">
                <?php echo $hasKey ? 'Configured' : 'Missing'; ?>
            </span>
        </div>
        
        <?php if ($hasKey): ?>
            <div class="details">Key found (length: <?php echo strlen($apiKey); ?> chars)</div>
            <?php
            try {
                $gemini = app(GeminiService::class);
                $testResponse = $gemini->generateText("Hi, are you working? Reply with 'YES'");
                $apiPass = stripos($testResponse, 'YES') !== false;
                ?>
                <div style="margin-top: 10px;">
                    <span>API Response Test:</span>
                    <span class="status <?php echo $apiPass ? 'pass' : 'fail'; ?>">
                        <?php echo $apiPass ? 'Success' : 'Failed'; ?>
                    </span>
                    <div class="details">Raw Response: <?php echo htmlspecialchars($testResponse); ?></div>
                </div>
                <?php
            } catch (Exception $e) {
                echo '<div class="fail" style="margin-top:10px; padding: 10px; border-radius: 8px;">API Error: '.$e->getMessage().'</div>';
            }
        endif; ?>

        <?php if (!$hasKey): ?>
            <div class="recommendation">
                <strong>Recommendation:</strong> Add <code>GOOGLE_GEMINI_API_KEY=your_key</code> to your <code>.env</code> file on the server.
            </div>
        <?php endif; ?>
    </div>

    <!-- 2. Database Structure -->
    <div class="card">
        <h2>Database Tables & Models</h2>
        <?php
        $tables = ['blog_posts', 'blog_keywords', 'blog_automation_configs'];
        foreach ($tables as $table) {
            $exists = Schema::hasTable($table);
            ?>
            <div style="margin-bottom: 8px;">
                <span>Table <code><?php echo $table; ?></code>:</span>
                <span class="status <?php echo $exists ? 'pass' : 'fail'; ?>"><?php echo $exists ? 'OK' : 'NOT FOUND'; ?></span>
            </div>
            <?php
        }
        
        if (Schema::hasTable('blog_posts')) {
            $hasCol = Schema::hasColumn('blog_posts', 'is_ai_generated');
            ?>
            <div style="margin-top: 10px;">
                <span>AI Columns in <code>blog_posts</code>:</span>
                <span class="status <?php echo $hasCol ? 'pass' : 'fail'; ?>"><?php echo $hasCol ? 'Found' : 'Missing'; ?></span>
            </div>
        <?php } ?>
        
        <?php if (!$exists): ?>
            <div class="recommendation">
                <strong>Recommendation:</strong> Run <code>php artisan migrate</code> to create missing tables.
            </div>
        <?php endif; ?>
    </div>

    <!-- 3. Queue & Background Jobs -->
    <div class="card">
        <h2>Queue Health (Background Generation)</h2>
        <?php
        $queueConnection = config('queue.default');
        $jobCount = 0;
        if ($queueConnection === 'database') {
            $jobCount = DB::table('jobs')->count();
            $failedCount = DB::table('failed_jobs')->count();
        }
        ?>
        <div>
            <span>Default Connection:</span>
            <span class="status <?php echo ($queueConnection === 'sync') ? 'warn' : 'pass'; ?>">
                <?php echo strtoupper($queueConnection); ?>
            </span>
        </div>
        
        <?php if ($queueConnection === 'database'): ?>
            <div style="margin-top: 10px;">
                <span>Pending Jobs in Queue: <strong><?php echo $jobCount; ?></strong></span>
                <?php if ($jobCount > 0): ?>
                    <span class="status warn">Stuck?</span>
                <?php else: ?>
                    <span class="status pass">Empty/Processing</span>
                <?php endif; ?>
            </div>
            <div style="margin-top: 5px;">
                <span>Failed Jobs: <strong><?php echo $failedCount; ?></strong></span>
                <?php if ($failedCount > 0): ?>
                    <span class="status fail">Action Needed</span>
                <?php endif; ?>
            </div>
            
            <div class="recommendation">
                <strong>Queue Instruction:</strong> If "Pending Jobs" is more than 0 and doesn't decrease, your <strong>Queue Worker</strong> is not running. 
                <br>Run this command on your server to start processing: <br>
                <code>php artisan queue:work --stop-when-empty</code>
            </div>
        <?php endif; ?>
    </div>

    <!-- 4. Logging -->
    <div class="card">
        <h2>Logging Configuration</h2>
        <?php
        $logConfig = config('logging.channels.ai_automation');
        $hasLog = !empty($logConfig);
        ?>
        <div>
            <span>Log Channel <code>ai_automation</code>:</span>
            <span class="status <?php echo $hasLog ? 'pass' : 'fail'; ?>"><?php echo $hasLog ? 'Configured' : 'NOT FOUND'; ?></span>
        </div>
        <?php if ($hasLog): ?>
            <div class="details">Path: <?php echo $logConfig['path']; ?></div>
        <?php endif; ?>
        
        <?php if (!$hasLog): ?>
            <div class="recommendation">
                <strong>Recommendation:</strong> Run <code>php artisan config:clear</code> to reload the latest logging configuration.
            </div>
        <?php endif; ?>
    </div>

    <!-- 5. Active Keywords -->
    <div class="card">
        <h2>Keyword Analytics</h2>
        <?php
        try {
            $keywordCount = \App\Models\BlogKeyword::count();
            $activeKeywords = \App\Models\BlogKeyword::where('status', 'active')->count();
            ?>
            <div>Total Keywords: <strong><?php echo $keywordCount; ?></strong></div>
            <div>Active Keywords (Ready for AI): <strong><?php echo $activeKeywords; ?></strong></div>
            
            <?php if ($activeKeywords == 0): ?>
                <div class="fail" style="margin-top:10px; padding:10px; border-radius:8px;">
                    CRITICAL: Aap ke paas koi "Active" keyword nahi hai. AI start nahi ho sakta.
                </div>
            <?php endif; ?>
            <?php
        } catch (Exception $e) {
            echo "Error checking keywords: " . $e->getMessage();
        }
        ?>
    </div>

    <!-- 6. Real-time Cache Progress -->
    <div class="card">
        <h2>Current Cache Progress</h2>
        <?php
        $progress = Cache::get('ai_blog_progress');
        if ($progress):
            ?>
            <div class="details"><?php echo json_encode($progress, JSON_PRETTY_PRINT); ?></div>
        <?php else: ?>
            <div class="details">No active progress found in Cache. (System is Idle)</div>
        <?php endif; ?>
    </div>

    <!-- 7. Recent AI Logs -->
    <div class="card">
        <h2>Recent AI Logs (Last 10 lines)</h2>
        <div class="details"><?php
            $logPath = storage_path('logs/ai_automation.log');
            if (file_exists($logPath)) {
                $lines = array_slice(file($logPath), -10);
                echo htmlspecialchars(implode("", $lines));
            } else {
                echo "Log file not created yet.";
            }
        ?></div>
    </div>

    <!-- 8. Direct Test Execution (Force Sync) -->
    <div class="card" style="border: 2px solid #e53e3e;">
        <h2>Manual Force Test (DANGEROUS - Slow)</h2>
        <p style="font-size: 13px; color: #e53e3e;">Yeh button click karne se AI background mein nahi balkay foran (Synchronously) chale ga. Browser hang ho sakta hai 1 min ke liye, lekin error samne aa jayega.</p>
        
        <form method="POST">
            <input type="hidden" name="force_run" value="1">
            <button type="submit" style="background: #e53e3e; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold;">
                Run Direct Test Generation Now
            </button>
        </form>

        <?php
        if (isset($_POST['force_run'])) {
            try {
                echo "<div class='details' style='background:#fffde7; border-color:#fbc02d;'>[SYSTEM] Starting Direct Test... Please wait...</div>";
                ob_flush(); flush(); // Try to push output to browser
                
                $service = app(\App\Services\AIBloggingService::class);
                $keyword = \App\Models\BlogKeyword::where('status', 'active')->first();
                
                if (!$keyword) throw new Exception("No active keywords found!");
                
                $result = $service->generateFullBlog($keyword);
                echo "<div class='pass' style='padding:10px; border-radius:8px; margin-top:10px;'>SUCCESS! Blog ID: ".$result['id']."</div>";
            } catch (Exception $e) {
                echo "<div class='fail' style='padding:10px; border-radius:8px; margin-top:10px;'>FATAL ERROR: ".$e->getMessage()."</div>";
                echo "<div class='details'>".$e->getTraceAsString()."</div>";
            }
        }
        ?>
    </div>

    <div style="text-align: center; margin-top: 40px; color: #cbd5e0; font-size: 12px;">
        AI Blog Engine v2.0 - Built by Antigravity
    </div>
</body>
</html>
