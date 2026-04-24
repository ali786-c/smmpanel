<?php
$apiKey = "8df603e9c0525a22a94f4deaeaf1b6db";
$apiSecret = "fd2e85a5debb7afa31101f7ca5a9b14f";

// Fetch last 10 messages from this account
$url = "https://api.mailjet.com/v3/REST/message?Limit=10&Sort=ArrivedAt+DESC";
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_USERPWD, "$apiKey:$apiSecret");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$data = json_decode($response, true);
curl_close($ch);

echo "Last 10 messages for this API Key:\n";
if (isset($data['Data'])) {
    foreach ($data['Data'] as $msg) {
        echo "ID: {$msg['ID']} | To: {$msg['ContactAlt']} | Status: {$msg['Status']} | Date: {$msg['ArrivedAt']}\n";
    }
} else {
    print_r($data);
}
