<?php
$apiKey = "8df603e9c0525a22a94f4deaeaf1b6db";
$apiSecret = "fd2e85a5debb7afa31101f7ca5a9b14f";

$url = "https://api.mailjet.com/v3/REST/sender";
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_USERPWD, "$apiKey:$apiSecret");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$data = json_decode($response, true);
curl_close($ch);

echo "Authorized Senders for this account:\n";
if (isset($data['Data'])) {
    foreach ($data['Data'] as $sender) {
        echo "Email: {$sender['Email']} | Status: {$sender['Status']}\n";
    }
} else {
    print_r($data);
}
