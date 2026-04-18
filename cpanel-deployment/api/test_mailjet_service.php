<?php

use App\Services\MailjetService;
use Illuminate\Support\Facades\Log;

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "--- Mailjet Service Test ---\n";

$mailjet = app(MailjetService::class);
$toEmail = 'aliyantarar4@gmail.com';
$toName = 'Muhammad Aliyan';
$subject = 'Test Email from emazingSM System';

echo "Building template-based email (Welcome template)...\n";

try {
    $result = $mailjet->sendTemplate(
        $toEmail,
        $toName,
        $subject,
        'emails.welcome',
        [
            'name' => $toName,
            'loginUrl' => config('app.url')
        ]
    );

    if ($result) {
        echo "✅ SUCCESS: Test email has been sent successfully to {$toEmail}!\n";
    } else {
        echo "❌ FAILED: Mailjet returned an error. Check logs/laravel.log or your Mailjet dashboard.\n";
    }
} catch (\Exception $e) {
    echo "❌ ERROR: " . $e->getMessage() . "\n";
}

echo "Done.\n";
