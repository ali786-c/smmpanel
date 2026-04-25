<?php
return [
    'api_key'    => '8df603e9c0525a22a94f4deaeaf1b6db',
    'api_secret' => 'fd2e85a5debb7afa31101f7ca5a9b14f',
    'from_email' => 'no-reply@emazingsm.com',
    'from_name'  => 'emazingSM',
    
    // CAMPAIGN SETTINGS
    'csv_path'    => 'data/unsent_emails.csv', // Use the clean file
    'batch_size'  => 1,                        // Process 1 by 1 for real-time UI
    'sleep_per_email' => 9,                    // 9 seconds gap (approx 400 emails/hour)
    
    // SECURITY
    'admin_password' => 'admin123',
];
