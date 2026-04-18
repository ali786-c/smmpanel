<?php
/**
 * SMTP Connection Test Script
 */

$host = 'emazingsm.com';
$port = 465;
$username = 'no-reply@emazingsm.com';
$password = '6aa)QGdYFh-z';
$timeout = 10;

echo "--- SMTP Connection Test for {$host}:{$port} ---\n";

// 1. Port Connectivity Check
echo "Checking port connectivity...\n";
$fp = @fsockopen('ssl://' . $host, $port, $errno, $errstr, $timeout);

if (!$fp) {
    echo "FAILED: Could not connect to the port. Error: $errstr ($errno)\n";
    exit(1);
}

echo "SUCCESS: Connected to the port!\n";

// 2. SMTP Handshake Check (Manual)
echo "Reading server response...\n";
$response = fgets($fp, 512);
echo "Server says: " . trim($response) . "\n";

if (strpos($response, '220') !== 0) {
    echo "FAILED: Server did not return a 220 greeting.\n";
    fclose($fp);
    exit(1);
}

// EHLO
echo "Sending EHLO...\n";
fwrite($fp, "EHLO emazingsm.com\r\n");
while ($line = fgets($fp, 512)) {
    echo "R: " . trim($line) . "\n";
    if (substr($line, 3, 1) === ' ') break;
}

// STARTTLS is not needed for Port 465 (Implicit SSL), but let's try AUTH LOGIN
echo "Authenticating via AUTH LOGIN...\n";
fwrite($fp, "AUTH LOGIN\r\n");
$response = fgets($fp, 512);
echo "R: " . trim($response) . "\n";

if (strpos($response, '334') === 0) {
    // Send Username (Base64)
    echo "Sending username...\n";
    fwrite($fp, base64_encode($username) . "\r\n");
    echo "R: " . trim(fgets($fp, 512)) . "\n";

    // Send Password (Base64)
    echo "Sending password...\n";
    fwrite($fp, base64_encode($password) . "\r\n");
    $authResponse = fgets($fp, 512);
    echo "R: " . trim($authResponse) . "\n";

    if (strpos($authResponse, '235') === 0) {
        echo "✅ SUCCESS: Authentication successful!\n";
    } else {
        echo "❌ FAILED: Authentication failed. Response: " . trim($authResponse) . "\n";
    }
} else {
    echo "❌ FAILED: AUTH LOGIN not supported or server error.\n";
}

fwrite($fp, "QUIT\r\n");
fclose($fp);
echo "Done.\n";
