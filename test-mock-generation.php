<?php
/**
 * Local AI Blog Engine Mock Test
 */

require __DIR__.'/cpanel-deployment/api/vendor/autoload.php';
$app = require_once __DIR__.'/cpanel-deployment/api/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->handle(Illuminate\Http\Request::capture());

use App\Services\AIBloggingService;
use App\Services\GeminiService;
use App\Models\BlogKeyword;
use Illuminate\Support\Facades\DB;

// 1. Create a Mocked Gemini Service
$mockGemini = new class extends GeminiService {
    public function generateText(string $prompt, string $model = 'gemini-2.5-flash'): string {
        if (strpos($prompt, 'meta description') !== false) {
             return "This is a perfect SEO meta description for a test blog.";
        }
        if (strpos($prompt, 'JSON SCHEMA') !== false) {
            return json_encode([
                'title' => 'Mocked SEO Title',
                'hook' => 'This is a mocked hook.',
                'intro' => '<p>This is a mocked introduction.</p>',
                'takeaways' => ['Key point A', 'Key point B'],
                'sections' => [
                    ['heading' => 'Section 1', 'body' => '<p>Body content 1</p>'],
                    ['heading' => 'Section 2', 'body' => '<p>Body content 2</p>']
                ],
                'faqs' => [['q' => 'Question?', 'a' => 'Answer.']],
                'cta_text' => 'Call to action text.'
            ]);
        }
        return "Mocked Writing Strategy Outline";
    }

    public function generateImage(string $prompt, string $model = 'gemini-3.1-flash-image-preview'): ?string {
        return base64_encode(file_get_contents('https://placehold.co/600x400.png')); // Placeholder image
    }
};

// 2. Override the Service in the Container
app()->instance(GeminiService::class, $mockGemini);

// 3. Run the Test
try {
    echo "--- Starting Mock Blog Generation Test ---\n";
    
    // Find or create a test keyword
    $keyword = BlogKeyword::firstOrCreate(['keyword' => 'Test Keyword'], ['id' => \Illuminate\Support\Str::uuid()]);
    
    $service = app(AIBloggingService::class);
    $result = $service->generateFullBlog($keyword);

    echo "✅ SUCCESS: Blog Generated!\n";
    echo "Blog ID: " . $result['id'] . "\n";
    echo "Blog Title: " . $result['title'] . "\n";
    
} catch (Exception $e) {
    echo "❌ FAILED: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString();
}
