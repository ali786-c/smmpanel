<?php
class MailjetHandler {
    private $apiKey;
    private $apiSecret;

    public function __construct($key, $secret) {
        $this->apiKey = $key;
        $this->apiSecret = $secret;
    }

    public function send($to, $name, $password) {
        $url = "https://api.mailjet.com/v3.1/send";
        $body = [
            'Messages' => [
                [
                    'From' => [
                        'Email' => "no-reply@emazingsm.com",
                        'Name' => "emazingSM"
                    ],
                    'To' => [
                        [
                            'Email' => $to,
                            'Name' => $to
                        ]
                    ],
                    'Subject' => "Important: Your emazingSM Account Migration Details",
                    'HTMLPart' => "
                        <div style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
                            <h2>Welcome to the New emazingSM!</h2>
                            <p>We have successfully migrated your account to our new and improved platform. Below are your login credentials:</p>
                            <div style='background: #f4f4f4; padding: 15px; border-radius: 5px; border: 1px solid #ddd;'>
                                <p><strong>Login Link:</strong> <a href='https://emazingsm.com/login'>https://emazingsm.com/login</a></p>
                                <p><strong>Email:</strong> $to</p>
                                <p><strong>Temporary Password:</strong> <span style='color: #d9534f; font-family: monospace; font-size: 1.2em;'>$password</span></p>
                            </div>
                            <p style='margin-top: 20px;'>Thank you for being a valued customer!</p>
                            <p>Best Regards,<br>The emazingSM Team</p>
                        </div>
                    "
                ]
            ]
        ];

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_USERPWD, "{$this->apiKey}:{$this->apiSecret}");
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $responseArray = json_decode($response, true);
        $messageID = $responseArray['Messages'][0]['To'][0]['MessageID'] ?? null;

        return [
            'success' => ($httpCode >= 200 && $httpCode < 300),
            'code' => $httpCode,
            'message_id' => $messageID,
            'response' => $responseArray
        ];
    }

    public function getStatus($messageID) {
        if (!$messageID || $messageID === 'N/A') return 'failed';

        $url = "https://api.mailjet.com/v3/REST/message/" . $messageID;
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_USERPWD, "{$this->apiKey}:{$this->apiSecret}");
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $response = curl_exec($ch);
        $data = json_decode($response, true);
        curl_close($ch);
        
        // If REST API returns data, use it. Otherwise, if we have an ID, it's at least 'sent'
        if (isset($data['Data'][0]['Status'])) {
            return $data['Data'][0]['Status'];
        }
        
        return 'sent'; 
    }
}
