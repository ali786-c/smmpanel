<?php
require __DIR__ . '/../cpanel-deployment/migration-mailer/api_handler.php';

$apiKey = '8df603e9c0525a22a94f4deaeaf1b6db';
$apiSecret = 'fd2e85a5debb7afa31101f7ca5a9b14f';
$testEmail = 'aliyantarar4@gmail.com';

echo "Testing Mailjet with NEW keys...\n";
$mailer = new MailjetHandler($apiKey, $apiSecret);
$res = $mailer->send($testEmail, "Test User", "NEW-KEY-TEST-123");

if ($res['success']) {
    echo "SUCCESS: Email sent to $testEmail\n";
    echo "MessageID: " . $res['message_id'] . "\n";
} else {
    echo "FAILED: Mailjet Error\n";
    print_r($res['response']);
}
