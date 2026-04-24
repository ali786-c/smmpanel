<?php
$reportFile = 'mailjet_sent_report.json';
if (!file_exists($reportFile)) die("Report file not found.\n");

$report = json_decode(file_get_contents($reportFile), true);
$contactsMap = json_decode(file_get_contents('mailjet_contacts_map.json'), true);
$csvFile = 'migration_passwords.csv';

$successfullySent = [];
$stats = [];

foreach ($report as $msg) {
    $status = $msg['status'];
    $stats[$status] = ($stats[$status] ?? 0) + 1;
    
    // Resolve email using contact_id if possible
    $email = !empty($msg['email']) ? $msg['email'] : ($contactsMap[$msg['contact_id']] ?? null);
    
    if ($email && in_array($status, ['sent', 'opened', 'delivered'])) {
        $successfullySent[strtolower(trim($email))] = true;
    }
}

echo "--- Mailjet Status Summary ---\n";
foreach ($stats as $status => $count) {
    echo ucfirst($status) . ": $count\n";
}
echo "------------------------------\n";

$remainingUsers = [];
$handle = fopen($csvFile, "r");
$header = fgetcsv($handle); 

$total = 0;
while (($row = fgetcsv($handle)) !== FALSE) {
    if (empty($row[0])) continue;
    $total++;
    $email = strtolower(trim($row[0]));
    if (!isset($successfullySent[$email])) {
        $remainingUsers[] = $row;
    }
}
fclose($handle);

echo "Total CSV Records: $total\n";
echo "Successfully Delivered: " . ($total - count($remainingUsers)) . "\n";
echo "Remaining (Need to send): " . count($remainingUsers) . "\n";

$out = fopen('remaining_users.csv', 'w');
fputcsv($out, $header);
foreach ($remainingUsers as $user) {
    fputcsv($out, $user);
}
fclose($out);

echo "\nSUCCESS: Created 'remaining_users.csv'.\n";
echo "You should use this file for the next batch.\n";
