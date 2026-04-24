<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['authenticated']) || $_SESSION['authenticated'] !== true) {
    die(json_encode(['error' => 'Unauthorized']));
}

$progress_file = "data/progress.json";
if (file_exists($progress_file)) {
    echo file_get_contents($progress_file);
} else {
    echo json_encode([
        'offset' => 1,
        'success_count' => 0,
        'failed_count' => 0,
        'is_complete' => false
    ]);
}
