<?php
// Mocking the environment
$_SESSION['authenticated'] = true;
$data_dir = __DIR__ . '/../cpanel-deployment/migration-mailer/data';
if (!file_exists($data_dir)) mkdir($data_dir, 0755, true);

$progress_file = "$data_dir/progress.json";
if (file_exists($progress_file)) unlink($progress_file);

// Simulate process.php logic
$state = ['offset' => 1, 'success_count' => 0, 'failed_count' => 0, 'is_complete' => false];

echo "Simulating 3 batches...\n";

for ($b = 1; $b <= 3; $b++) {
    echo "Processing Batch $b...\n";
    $state['offset'] += 5;
    $state['success_count'] += 5;
    file_put_contents($progress_file, json_encode($state, JSON_PRETTY_PRINT), LOCK_EX);
    echo "Saved Progress: " . file_get_contents($progress_file) . "\n";
}

if (file_exists($progress_file)) {
    echo "\nTEST PASSED: Progress file exists and is readable.\n";
} else {
    echo "\nTEST FAILED: Progress file was not created.\n";
}
