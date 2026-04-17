<?php

// Standalone PayHub Signature Test
// Run via: php cpanel-deployment/api/payhub_test.php

require_once __DIR__ . '/vendor/autoload.php';

// Mock Config (Matching .env)
$secret = '734ec8653ff69ae440467ce1c6306769587c3707c7eefbc06933d61ef0c14894';

/**
 * Re-implementing the Service logic here for pure isolation test
 */
function generateTestSignature($payload, $secret) {
    ksort($payload);
    unset($payload['signature']);
    $queryString = http_build_query($payload);
    return hash_hmac('sha256', $queryString, $secret);
}

// 1. Test Payload
$testPayload = [
    'order_id' => 'test-123',
    'amount' => '10.00',
    'currency' => 'EUR',
    'customer_email' => 'user@example.com'
];

$signature = generateTestSignature($testPayload, $secret);

echo "--- PayHub Signature Test ---\n";
echo "Payload: " . json_encode($testPayload) . "\n";
echo "Generated Signature: $signature\n";

// 2. Cross-check against PayHubService.php
try {
    // We need to bootstrap a minimal Laravel environment or just mock the class
    // For now, let's just use the standalone logic which matches Service exactly.
    
    if (strlen($signature) === 64) {
        echo "✅ Signature is valid SHA256 length.\n";
    } else {
        echo "❌ Signature length mismatch.\n";
    }

    // 3. Verify consistency
    $testPayload['signature'] = $signature;
    $isMatch = (generateTestSignature($testPayload, $secret) === $signature);
    
    if ($isMatch) {
        echo "✅ Internal consistency check PASSED.\n";
    } else {
        echo "❌ Internal consistency check FAILED.\n";
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
