<?php
session_start();
$config = require 'config.php';
require 'api_handler.php';

header('Content-Type: application/json');

// 1. Auth Check
if (!isset($_SESSION['authenticated']) || $_SESSION['authenticated'] !== true) {
    die(json_encode(['error' => 'Unauthorized']));
}

$data_dir = 'data';
if (!file_exists($data_dir)) mkdir($data_dir, 0777, true);

$progress_file = "$data_dir/progress.json";
$sent_log = "$data_dir/sent.log";
$failed_log = "$data_dir/failed.log";

// 2. Load Progress
$state = file_exists($progress_file) 
    ? json_decode(file_get_contents($progress_file), true) 
    : ['offset' => 1, 'success_count' => 0, 'failed_count' => 0, 'is_complete' => false];

if ($state['is_complete']) {
    die(json_encode(['status' => 'complete', 'message' => 'Campaign already finished']));
}

// 3. Process Batch
$mailer = new MailjetHandler($config['api_key'], $config['api_secret']);
$csv_file = $config['csv_path'];

if (!file_exists($csv_file)) {
    die(json_encode(['error' => 'CSV file not found at ' . $csv_file]));
}

$file = new SplFileObject($csv_file);
$file->setFlags(SplFileObject::READ_CSV | SplFileObject::SKIP_EMPTY | SplFileObject::READ_AHEAD);

$batch_size = $config['batch_size'];
$processed_in_this_batch = 0;
$results = [];

// Jump to offset
$file->seek($state['offset']);

for ($i = 0; $i < $batch_size && !$file->eof(); $i++) {
    $row = $file->current();
    if (!$row || empty($row[0]) || $row[0] === 'Email') {
        $file->next();
        continue;
    }

    $email = trim($row[0]);
    $password = trim($row[1] ?? 'Password123');

    $res = $mailer->send($email, $email, $password);
    
    $timestamp = date('Y-m-d H:i:s');
    $status = 'failed';
    $msgId = $res['message_id'] ?? 'N/A';

    if ($res['success']) {
        // Wait 1 second for Mailjet to process status
        sleep(1);
        $status = $mailer->getStatus($msgId);
        
        $state['success_count']++;
        file_put_contents($sent_log, "[$timestamp] SUCCESS: $email | ID: $msgId | Status: $status\n", FILE_APPEND);
        $results[] = ['email' => $email, 'status' => $status, 'msg_id' => $msgId];
    } else {
        $err = json_encode($res['response']);
        file_put_contents($failed_log, "[$timestamp] FAILED: $email | Error: $err\n", FILE_APPEND);
        $results[] = ['email' => $email, 'status' => 'failed', 'error' => $err];
    }

    // Save to Detailed CSV Report
    $report_file = "$data_dir/detailed_report.csv";
    $is_new = !file_exists($report_file);
    $fp = fopen($report_file, 'a');
    if ($is_new) fputcsv($fp, ['Timestamp', 'Email', 'Status', 'MessageID']);
    fputcsv($fp, [$timestamp, $email, $status, $msgId]);
    fclose($fp);

    $processed_in_this_batch++;
    $state['offset']++;
    $file->next();

    // THROTTLE: Respect the sleep setting
    if ($i < $batch_size - 1) {
        sleep($config['sleep_per_email'] ?? 1);
    }
}

// Check if complete
if ($file->eof()) {
    $state['is_complete'] = true;
}

file_put_contents($progress_file, json_encode($state));

echo json_encode([
    'status' => $state['is_complete'] ? 'complete' : 'processing',
    'progress' => $state,
    'batch_results' => $results
]);
