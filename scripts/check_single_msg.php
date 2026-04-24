<?php
$apiKey = "8df603e9c0525a22a94f4deaeaf1b6db";
$apiSecret = "fd2e85a5debb7afa31101f7ca5a9b14f";
$msgId = "576460789026148682"; // Latest test ID

$url = "https://api.mailjet.com/v3/REST/message/" . $msgId;
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_USERPWD, "$apiKey:$apiSecret");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
print_r(json_decode($response, true));
curl_close($ch);
