<?php
$apiKey = "8df603e9c0525a22a94f4deaeaf1b6db";
$apiSecret = "fd2e85a5debb7afa31101f7ca5a9b14f";

$ids = [
    "1152921541367770966",
    "288230412911843778",
    "576460789025946946",
    "1152921541367829645"
];

foreach ($ids as $id) {
    $url = "https://api.mailjet.com/v3/REST/message/" . $id;
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_USERPWD, "$apiKey:$apiSecret");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $response = curl_exec($ch);
    $data = json_decode($response, true);
    curl_close($ch);
    
    echo "ID: $id | ";
    if (isset($data['Data'][0])) {
        echo "Status: " . $data['Data'][0]['Status'] . " | Date: " . $data['Data'][0]['ArrivedAt'] . "\n";
    } else {
        echo "Error: Not found or blocked by Mailjet.\n";
    }
}
