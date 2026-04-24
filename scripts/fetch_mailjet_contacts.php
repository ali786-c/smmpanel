<?php
$apiKey = "8df603e9c0525a22a94f4deaeaf1b6db";
$apiSecret = "066aa729e7b32c24fc3ac2ecb89d7ea1";

$contactsMap = [];
$offset = 0;
$limit = 1000;
$keepFetching = true;

echo "Fetching all contacts from Mailjet to resolve IDs...\n";

while ($keepFetching) {
    $url = "https://api.mailjet.com/v3/REST/contact?Limit=$limit&Offset=$offset";
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_USERPWD, "$apiKey:$apiSecret");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $response = curl_exec($ch);
    $data = json_decode($response, true);
    curl_close($ch);

    if (isset($data['Data']) && count($data['Data']) > 0) {
        foreach ($data['Data'] as $contact) {
            $contactsMap[$contact['ID']] = $contact['Email'];
        }
        echo "Fetched " . count($contactsMap) . " contacts...\n";
        if (count($data['Data']) < $limit) $keepFetching = false;
        else $offset += $limit;
    } else {
        $keepFetching = false;
    }
}

file_put_contents('mailjet_contacts_map.json', json_encode($contactsMap, JSON_PRETTY_PRINT));
echo "DONE: Saved contacts map.\n";
