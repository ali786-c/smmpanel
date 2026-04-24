<?php
require_once 'api_handler.php';

echo "Sending test email to aliyantarar4@gmail.com...\n";

$result = send_migration_email('aliyantarar4@gmail.com', 'TEST_PASS_123');

if ($result['success']) {
    echo "SUCCESS: Email sent successfully!\n";
} else {
    echo "FAILED: " . $result['error'] . "\n";
}
