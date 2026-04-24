<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['authenticated']) || $_SESSION['authenticated'] !== true) {
    die(json_encode(['error' => 'Unauthorized']));
}

$report_file = "data/detailed_report.csv";
$logs = [];

if (file_exists($report_file)) {
    $rows = array_map('str_getcsv', file($report_file));
    $header = array_shift($rows);
    
    // Get last 30 logs
    $recent = array_slice(array_reverse($rows), 0, 30);
    
    foreach ($recent as $r) {
        $logs[] = [
            'time' => date('H:i:s', strtotime($r[0])),
            'email' => $r[1],
            'type' => strtolower($r[2]),
            'msg' => strtoupper($r[2]) . ": " . $r[1]
        ];
    }
}

echo json_encode($logs);
