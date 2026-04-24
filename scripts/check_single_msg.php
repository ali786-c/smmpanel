<?php
$apiKey = "8df603e9c0525a22a94f4deaeaf1b6db";
$apiSecret = "066aa729e7b32c24fc3ac2ecb89d7ea1";

$url = "https://api.mailjet.com/v3/REST/message?Limit=1";
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_USERPWD, "$apiKey:$apiSecret");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
print_r(json_decode($response, true));
curl_close($ch);
