<?php

$url = "https://justanotherpanel.com/api/v2";
$key = "7f36684bdbd4d7cbed3477014f7bb9e9";

echo "Fetching services from JAP...\n";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
    'key' => $key,
    'action' => 'services'
]));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
curl_close($ch);

$services = json_decode($response, true);

if (!is_array($services)) {
    die("Error: Could not fetch services or invalid response.\n");
}

$types = [];
$sampleByTypes = [];

foreach ($services as $service) {
    $type = $service['type'] ?? 'unknown';
    if (!isset($types[$type])) {
        $types[$type] = 0;
        $sampleByTypes[$type] = $service;
    }
    $types[$type]++;
}

echo "\n--- Service Types Found ---\n";
foreach ($types as $type => $count) {
    echo "Type: [$type] | Count: $count\n";
}

echo "\n--- Sample Data per Type ---\n";
foreach ($sampleByTypes as $type => $data) {
    echo "\nType: $type\n";
    echo "Sample Name: {$data['name']}\n";
    echo "Min: {$data['min']} | Max: {$data['max']}\n";
    // Check for specific markers
    if (strpos(strtolower($data['name']), 'custom') !== false) {
        echo "Note: Name contains 'custom'\n";
    }
}
