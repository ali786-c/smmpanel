<?php
/**
 * ONE-OFF TEST SCRIPT
 * Sender: no-reply@upgradercx.com
 * Recipient: aliyantarar4@gmail.com
 */

$config = require 'config.php';
$apiKey = $config['api_key'];
$apiSecret = $config['api_secret'];

$url = "https://api.mailjet.com/v3.1/send";
$to = 'aliyantarar4@gmail.com';
$sender = 'no-reply@upgradercx.com';

$body = [
    'Messages' => [
        [
            'From' => [
                'Email' => $sender,
                'Name' => "UpgraderCX Test"
            ],
            'To' => [
                [
                    'Email' => $to,
                    'Name' => "Muhammad Aliyan"
                ]
            ],
            'Subject' => "Test Email via Mailjet - UpgraderCX Sender",
            'HTMLPart' => "
                <div style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
                    <h2>Verification Successful</h2>
                    <p>This is a test email sent from <strong>$sender</strong> using your Mailjet integration.</p>
                    <p>If you received this, it means the sender email is verified and ready to use.</p>
                    <hr>
                    <p>Best Regards,<br>System Test</p>
                </div>
            "
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
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "--- Mailjet Test Results ---\n";
echo "HTTP Code: $httpCode\n";
echo "Response: $response\n";

if ($httpCode >= 200 && $httpCode < 300) {
    echo "✅ SUCCESS: Test email sent!\n";
} else {
    echo "❌ FAILED: Check the response above for details.\n";
}
