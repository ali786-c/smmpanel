<?php
/**
 * Configuration for Migration Mailer
 */

// SECURITY: Change this password. You will need it to access the mailer dashboard.
define('MAILER_PASSWORD', 'admin123'); 

// MAILJET CREDENTIALS
define('MJ_APIKEY_PUBLIC', '8df603e9c0525a22a94f4deaeaf1b6db');
define('MJ_APIKEY_PRIVATE', '066aa729e7b32c24fc3ac2ecb89d7ea1');
define('MJ_SENDER_EMAIL', 'no-reply@emazingsm.com');
define('MJ_SENDER_NAME', 'emazingSM');

// CAMPAIGN SETTINGS
define('CSV_FILE', '../migration_passwords.csv'); // Path to your user list
define('BATCH_SIZE', 20); // How many emails to send in one AJAX request
define('SLEEP_BETWEEN_EMAILS', 500000); // 0.5 seconds (in microseconds) to be safe

// GUIDE & LINKS
define('GUIDE_URL', 'https://emazingsm.com/guide'); // Update this when you have the real link
define('DASHBOARD_URL', 'https://emazingsm.com/dashboard');
