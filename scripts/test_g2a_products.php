<?php
/**
 * G2A API Product Fetch Test Script
 */

// --- CONFIGURATION ---
$clientId     = 'YizOszilWrtROHhB';
$clientSecret = 'VWlBrOQWMzwlJogvPhKqxQwIFHqlRHoy';
$g2aEmail     = 'no-reply@emazingsm.com'; 
$apiUrl       = 'https://products-export-api.g2a.com/v1/products';

// --- AUTHENTICATION ---
// API Key = sha256(clientId + email + clientSecret)
$apiKey = hash('sha256', $clientId . $g2aEmail . $clientSecret);
$authHeader = "Authorization: $clientId, $apiKey";

echo "--- G2A API Test ---\n";
echo "Target: $apiUrl\n";
echo "Email:  $g2aEmail\n\n";

// --- CURL REQUEST ---
$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => $apiUrl . "?page=1",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        $authHeader,
        "Content-Type: application/json"
    ],
    CURLOPT_TIMEOUT => 30
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$err = curl_error($ch);
curl_close($ch);

// --- RESULTS ---
if ($err) {
    echo "❌ Curl Error: $err\n";
} else {
    echo "HTTP Status: $httpCode\n";
    $data = json_decode($response, true);

    if ($httpCode === 200 && isset($data['docs'])) {
        echo "✅ Success! Found " . count($data['docs']) . " products.\n\n";
        
        // Print first 3 products as sample
        $samples = array_slice($data['docs'], 0, 3);
        foreach ($samples as $p) {
            echo "ID:   " . $p['id'] . "\n";
            echo "Name: " . $p['name'] . "\n";
            echo "Qty:  " . $p['qty'] . "\n";
            echo "Min Price: " . $p['minPrice'] . " EUR\n";
            echo "--------------------------\n";
        }
    } else {
        echo "❌ API Error or Unexpected Response:\n";
        echo $response . "\n";
    }
}
