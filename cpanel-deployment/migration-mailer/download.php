<?php
session_start();
if (!isset($_SESSION['authenticated']) || $_SESSION['authenticated'] !== true) {
    die("Unauthorized");
}

$file = 'data/detailed_report.csv';

if (file_exists($file)) {
    header('Content-Description: File Transfer');
    header('Content-Type: application/csv');
    header('Content-Disposition: attachment; filename="emazingSM_Mail_Report_'.date('Y-m-d_H-i').'.csv"');
    header('Expires: 0');
    header('Cache-Control: must-revalidate');
    header('Pragma: public');
    header('Content-Length: ' . filesize($file));
    readfile($file);
    exit;
} else {
    echo "No report data available yet. Please start the campaign first.";
}
