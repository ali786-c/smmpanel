<?php
require_once 'config.php';

/**
 * Sends an email via Mailjet API v3.1 using raw cURL
 */
function send_migration_email($to_email, $password) {
    $url = "https://api.mailjet.com/v3.1/send";
    
    // Construct HTML Content
    $html_content = "
    <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; line-height: 1.6;'>
        <h2 style='color: #0074d4;'>Welcome to the New emazingSM!</h2>
        <p>Hello,</p>
        <p>We have successfully migrated your account to our new and improved platform. To log in, please use the temporary credentials below:</p>
        
        <div style='background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0074d4;'>
            <p style='margin: 5px 0;'><strong>Email:</strong> {$to_email}</p>
            <p style='margin: 5px 0;'><strong>Temporary Password:</strong> <span style='color: #d11111; font-family: monospace; font-size: 1.1em;'>{$password}</span></p>
        </div>

        <p><strong>Login Here:</strong> <a href='".DASHBOARD_URL."'>".DASHBOARD_URL."</a></p>

        <hr style='border: none; border-top: 1px solid #eee; margin: 20px 0;'>
        <p style='font-size: 12px; color: #888;'>If you have any issues, please contact our support team. Thank you for staying with us!</p>
    </div>";

    $payload = [
        'Messages' => [
            [
                'From' => [
                    'Email' => MJ_SENDER_EMAIL,
                    'Name' => MJ_SENDER_NAME
                ],
                'To' => [
                    [
                        'Email' => $to_email,
                        'Name' => explode('@', $to_email)[0]
                    ]
                ],
                'Subject' => "Your account has been migrated - New Credentials Inside!",
                'HTMLPart' => $html_content,
                'TextPart' => "Welcome to the new emazingSM. Your temporary password is: {$password}. Log in at " . DASHBOARD_URL,
                'CustomCampaign' => "Migration_April_2026",
                'DeduplicateCampaign' => true
            ]
        ]
    ];

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_USERPWD, MJ_APIKEY_PUBLIC . ":" . MJ_APIKEY_PRIVATE);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);

    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    if ($error) {
        return ['success' => false, 'error' => "cURL Error: " . $error];
    }

    $data = json_decode($response, true);
    if ($http_code >= 200 && $http_code < 300) {
        return ['success' => true];
    } else {
        $msg = $data['Messages'][0]['Errors'][0]['ErrorMessage'] ?? ($data['ErrorMessage'] ?? 'Unknown API Error');
        return ['success' => false, 'error' => "API Error ({$http_code}): " . $msg];
    }
}
