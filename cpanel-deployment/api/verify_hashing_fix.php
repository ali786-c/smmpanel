<?php

/**
 * Verification script for Password Hashing Fix
 * This script simulates the model behavior to ensure that a single assignment
 * results in a correctly hashed password that Hash::check can verify.
 */

// Include Laravel's bootstrap
require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

echo "--- Password Hashing Verification ---\n";

// Test Password
$rawPassword = 'NewPassword123';

// 1. Creative a dummy user object (not saving to DB to avoid side effects)
$user = new User([
    'id' => (string) Str::uuid(),
    'email' => 'test_verification@example.com',
    'password' => $rawPassword, // This should trigger the 'hashed' cast
]);

echo "Raw Password: " . $rawPassword . "\n";
echo "Stored Hash: " . $user->password . "\n";

// 2. Verify with Hash::check
if (Hash::check($rawPassword, $user->password)) {
    echo "✅ SUCCESS: Hash matches raw password.\n";
} else {
    echo "❌ FAILURE: Hash does not match raw password.\n";
    
    // Check for double-hashing
    if (Hash::check(Hash::make($rawPassword), $user->password)) {
        echo "⚠️ DOUBLE HASHING DETECTED: The model is hashing what it receives again.\n";
    }
}

echo "--- Verification Complete ---\n";
