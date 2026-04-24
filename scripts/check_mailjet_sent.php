<?php
$apiKey = "8df603e9c0525a22a94f4deaeaf1b6db";
$apiSecret = "066aa729e7b32c24fc3ac2ecb89d7ea1";

$allSentEmails = [];
$offset = 0;
$limit = 1000; 
$keepFetching = true;

echo "Fetching sent messages from Mailjet (latest first)...\n";

while ($keepFetching) {
    $url = "https://api.mailjet.com/v3/REST/message?Limit=$limit&Offset=$offset&Sort=ArrivedAt+DESC";
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_USERPWD, "$apiKey:$apiSecret");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = curl_exec($ch);
    $data = json_decode($response, true);
    curl_close($ch);

    if (isset($data['Data']) && count($data['Data']) > 0) {
        foreach ($data['Data'] as $msg) {
            $allSentEmails[] = [
                'email' => $msg['ContactAlt'],
                'contact_id' => $msg['ContactID'],
                'status' => $msg['Status'],
                'arrived_at' => $msg['ArrivedAt']
            ];
        }
        
        echo "Fetched " . count($allSentEmails) . " records...\n";
        
        if (count($data['Data']) < $limit) {
            $keepFetching = false;
        } else {
            $offset += $limit;
        }
        
        if ($offset >= 10000) $keepFetching = false; // Cap at 10k for safety
        
    } else {
        $keepFetching = false;
    }
}

file_put_contents('mailjet_sent_report.json', json_encode($allSentEmails, JSON_PRETTY_PRINT));
echo "\nDONE: Total " . count($allSentEmails) . " records saved to mailjet_sent_report.json\n";
