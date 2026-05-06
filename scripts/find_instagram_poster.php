<?php

$url = "https://justanotherpanel.com/api/v2";
$key = "7f36684bdbd4d7cbed3477014f7bb9e9";

echo "Searching for 'Instagram Poster' services in JAP...\n";

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
    die("Error: Could not fetch services.\n");
}

$found = [];
foreach ($services as $service) {
    $name = strtolower($service['name']);
    if (strpos($name, 'instagram') !== false && (strpos($name, 'poster') !== false || strpos($name, 'post') !== false)) {
        $found[] = $service;
    }
}

if (empty($found)) {
    echo "No services found matching 'Instagram Poster'.\n";
} else {
    echo "Found " . count($found) . " matching services:\n\n";
    foreach ($found as $s) {
        echo "ID: {$s['service']} | Name: {$s['name']} | Type: {$s['type']} | Rate: {$s['rate']}\n";
    }
}
