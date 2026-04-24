<?php
$apiUrl = "https://justanotherpanel.com/api/v2";
$apiKey = "7f36684bdbd4d7cbed3477014f7bb9e9";

echo "Fetching services from JAP...\n";

$ch = curl_init($apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
    'key' => $apiKey,
    'action' => 'services'
]));

$response = curl_exec($ch);
$error = curl_error($ch);
curl_close($ch);

if ($error) {
    die("cURL Error: $error\n");
}

$services = json_decode($response, true);

if (!$services || !is_array($services)) {
    die("Failed to fetch or decode services. Response was: " . substr($response, 0, 200) . "...\n");
}

$found = null;
foreach ($services as $service) {
    if (isset($service['service']) && (int)$service['service'] === 8978) {
        $found = $service;
        break;
    }
}

if ($found) {
    file_put_contents('service_8978_detail.json', json_encode($found, JSON_PRETTY_PRINT));
    echo "SUCCESS: Service 8978 found and saved to service_8978_detail.json\n";
    echo "--------------------------------------------------\n";
    echo "SERVICE DETAILS:\n";
    print_r($found);
    echo "--------------------------------------------------\n";
} else {
    echo "FAILED: Service 8978 not found in the list of " . count($services) . " services.\n";
}
