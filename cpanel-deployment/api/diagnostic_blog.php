<?php
/**
 * Autoblogging Diagnostic Tool
 * Save this as diagnostic.php in your /api folder and run it via browser or CLI.
 */

use Illuminate\Support\Facades\DB;
use App\Models\BlogAutomationConfig;
use App\Models\BlogKeyword;

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "--- Autoblogging Diagnostic ---\n";

// 1. Check Config
try {
    $config = BlogAutomationConfig::first();
    if (!$config) {
        echo "❌ FAILURE: blog_automation_configs table is empty.\n";
    } else {
        echo "✅ Config found: ID " . $config->id . "\n";
        echo "   Attributes: " . json_encode($config->getAttributes(), JSON_PRETTY_PRINT) . "\n";
    }
} catch (\Exception $e) {
    echo "❌ ERROR reading config: " . $e->getMessage() . "\n";
}

// 2. Check Keywords
try {
    $activeCount = BlogKeyword::where('status', 'active')->count();
    $totalCount = BlogKeyword::count();
    echo "✅ Keywords: $activeCount active / $totalCount total.\n";
    if ($activeCount == 0) {
        echo "❌ FAILURE: No active keywords found to process.\n";
    }
} catch (\Exception $e) {
    echo "❌ ERROR reading keywords: " . $e->getMessage() . "\n";
}

// 3. Check PHP Version
echo "✅ PHP Version: " . PHP_VERSION . "\n";
if (version_compare(PHP_VERSION, '8.2.0', '<')) {
    echo "❌ WARNING: Laravel 11 requires PHP 8.2 or higher. Your cron might be using an older version.\n";
}

// 4. Check Scheduler Heartbeat
$lastRun = \Illuminate\Support\Facades\Cache::get('illuminate:foundation:schedule:last_run');
echo "✅ Last Schedule Run: " . ($lastRun ? date('Y-m-d H:i:s', $lastRun) : 'NEVER') . "\n";
if (!$lastRun) {
    echo "❌ FAILURE: The Laravel scheduler has never run. Your cPanel cron job might be failing.\n";
}

echo "--- End of Diagnostic ---\n";
