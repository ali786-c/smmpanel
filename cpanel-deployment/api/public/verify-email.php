<?php

/**
 * Web-based Email Verification Script
 * Visit: https://yourdomain.com/api/verify-email.php
 */

use App\Services\MailjetService;

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

header('Content-Type: text/plain');

echo "--- emazingSM Email System Verification ---\n\n";

try {
    $mailjet = app(MailjetService::class);
    $toEmail = 'aliyantarar4@gmail.com';
    $toName = 'Muhammad Aliyan';
    
    echo "Attempting to send test email to: $toEmail...\n";

    $result = $mailjet->sendTemplate(
        $toEmail,
        $toName,
        'System Verification: ' . date('Y-m-d H:i:s'),
        'emails.welcome',
        [
            'name' => $toName,
            'loginUrl' => config('app.url')
        ]
    );

    if ($result) {
        echo "✅ SUCCESS: The test email was sent successfully!\n";
        echo "Please check your inbox (including spam folder) for 'aliyantarar4@gmail.com'.\n";
    } else {
        echo "❌ FAILED: Mailjet accepted the request but failed to send. Check your Mailjet dashboard logs.\n";
    }
} catch (\Exception $e) {
    echo "❌ ERROR: " . $e->getMessage() . "\n";
}

echo "\nVerification Finished.";
