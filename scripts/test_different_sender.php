<?php
$apiKey = "8df603e9c0525a22a94f4deaeaf1b6db";
$apiSecret = "fd2e85a5debb7afa31101f7ca5a9b14f";

$url = "https://api.mailjet.com/v3.1/send";
$body = [
    'Messages' => [
        [
            'From' => [
                'Email' => "davejone1@gmail.com",
                'Name' => "Test Sender"
            ],
            'To' => [
                [
                    'Email' => "aliyantarar4@gmail.com",
                    'Name' => "Aliyan"
                ]
            ],
            'Subject' => "Urgent Test - Please check",
            'HTMLPart' => "This is a test email from davejone1@gmail.com"
        ]
    ]
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_USERPWD, "$apiKey:$apiSecret");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

$response = curl_exec($ch);
print_r(json_decode($response, true));
curl_close($ch);
