<?php
require 'vendor/autoload.php';

use App\Services\GeminiService;
use Illuminate\Container\Container;
use Illuminate\Support\Facades\Facade;

// Bootstrap a minimal Laravel environment for the service
$app = new Container();
$app->bind('config', function() {
    return new class {
        public function get($key, $default = null) {
            return $default;
        }
    };
});
Facade::setFacadeApplication($app);

// Use the explicit key for the test
putenv("GOOGLE_GEMINI_API_KEY=AIzaSyCFeVF_iAWutw9QCZH8bwG1wjKAl44GJK0");

$service = new GeminiService();
echo "Testing Gemini API connection...\n";

$result = $service->generateText("Say exactly 'CONNECTION_SUCCESSFUL' if you can read this.");

if (strpos($result, 'CONNECTION_SUCCESSFUL') !== false) {
    echo "\n✅ RESULT: Gemini API is WORKING perfectly!\n";
    echo "Response: " . $result . "\n";
} else {
    echo "\n❌ RESULT: Connection failed or API key returned an error.\n";
    echo "Raw Response: " . $result . "\n";
}
