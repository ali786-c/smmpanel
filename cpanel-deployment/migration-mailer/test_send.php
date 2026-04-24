<?php
session_start();
$config = require 'config.php';
require 'api_handler.php';

header('Content-Type: application/json');

if (!isset($_SESSION['authenticated']) || $_SESSION['authenticated'] !== true) {
    die(json_encode(['error' => 'Unauthorized']));
}

$email = $_POST['email'] ?? '';
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    die(json_encode(['error' => 'Invalid email address']));
}

$mailer = new MailjetHandler($config['api_key'], $config['api_secret']);
$res = $mailer->send($email, $email, "TEST-PASS-123");

if ($res['success']) {
    echo json_encode(['success' => true, 'message' => "Test email sent to $email"]);
} else {
    echo json_encode(['error' => 'Mailjet Error', 'detail' => $res['response']]);
}
