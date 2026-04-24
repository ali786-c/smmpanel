<?php
session_start();
require_once 'config.php';
require_once 'api_handler.php';

header('Content-Type: application/json');

// 1. Basic Auth Check
if (!isset($_SESSION['authenticated']) || $_SESSION['authenticated'] !== true) {
    http_response_code(401);
    die(json_encode(['error' => 'Unauthorized access. Please log in.']));
}

$data_dir = __DIR__ . '/data';
if (!is_dir($data_dir)) {
    mkdir($data_dir, 0755, true);
}

$progress_file = $data_dir . '/progress.json';
$log_file = $data_dir . '/sent.log';
$error_file = $data_dir . '/failed.log';

// 2. Reset Logic (Optional trigger via GET)
if (isset($_GET['reset']) && $_GET['reset'] === 'true') {
    if (file_exists($progress_file)) unlink($progress_file);
    if (file_exists($log_file)) unlink($log_file);
    if (file_exists($error_file)) unlink($error_file);
    die(json_encode(['status' => 'reset', 'message' => 'Progress has been cleared.']));
}

// 3. Load State
$state = file_exists($progress_file) 
    ? json_decode(file_get_contents($progress_file), true) 
    : ['offset' => 1, 'success_count' => 0, 'failed_count' => 0, 'is_complete' => false];

if ($state['is_complete']) {
    die(json_encode([
        'status' => 'complete', 
        'message' => 'Campaign already finished.',
        'progress' => [
            'current' => $state['offset'],
            'total' => $state['total_rows'] ?? 0,
            'success' => $state['success_count'],
            'failed' => $state['failed_count'],
            'percentage' => 100
        ]
    ]));
}

// 4. Count Total Lines (Cached in state)
if (!isset($state['total_rows']) || $state['total_rows'] == 0) {
    if (!file_exists(CSV_FILE)) {
        die(json_encode(['error' => 'CSV file not found at: ' . CSV_FILE]));
    }
    $file = new SplFileObject(CSV_FILE, 'r');
    $file->seek(PHP_INT_MAX);
    $state['total_rows'] = $file->key(); // Total rows including header
    file_put_contents($progress_file, json_encode($state));
}

// 5. Start Batch Processing
$results = [];

try {
    $file = new SplFileObject(CSV_FILE, 'r');
    $file->setFlags(SplFileObject::READ_CSV | SplFileObject::SKIP_EMPTY | SplFileObject::DROP_NEW_LINE);
    
    // Jump to the current offset
    $file->seek($state['offset']);
    
    $processed_in_this_batch = 0;
    while (!$file->eof() && $processed_in_this_batch < BATCH_SIZE) {
        $row = $file->current();
        
        // Skip header or empty rows
        if (!$row || count($row) < 2 || $row[0] === 'Email') {
            $file->next();
            $state['offset']++;
            continue;
        }

        $email = trim($row[0]);
        $password = trim($row[1]);

        if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
            // ACTUAL SENDING CALL
            $result = send_migration_email($email, $password);
            
            if ($result['success']) {
                $state['success_count']++;
                file_put_contents($log_file, "[" . date('Y-m-d H:i:s') . "] SUCCESS: $email" . PHP_EOL, FILE_APPEND);
                $results[] = ['email' => $email, 'status' => 'success'];
            } else {
                $state['failed_count']++;
                file_put_contents($error_file, "[" . date('Y-m-d H:i:s') . "] FAILED: $email | Error: " . $result['error'] . PHP_EOL, FILE_APPEND);
                $results[] = ['email' => $email, 'status' => 'failed', 'error' => $result['error']];
            }
            
            // Throttle to avoid hitting API limits
            if (SLEEP_BETWEEN_EMAILS > 0) {
                usleep(SLEEP_BETWEEN_EMAILS);
            }
        }

        $file->next();
        $state['offset']++;
        $processed_in_this_batch++;
        
        // Check if we reached the absolute end
        if ($state['offset'] >= $state['total_rows']) {
            $state['is_complete'] = true;
            break;
        }
    }
    
    // Save updated state after batch
    file_put_contents($progress_file, json_encode($state));
    
    echo json_encode([
        'status' => $state['is_complete'] ? 'complete' : 'processing',
        'progress' => [
            'current' => $state['offset'],
            'total' => $state['total_rows'],
            'success' => $state['success_count'],
            'failed' => $state['failed_count'],
            'percentage' => round(($state['offset'] / $state['total_rows']) * 100, 2)
        ],
        'batch_results' => $results
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'System Exception: ' . $e->getMessage()]);
}
