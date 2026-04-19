<?php
/**
 * Local AI Blog Engine Isolated Mock Test (SQLite)
 */

namespace {
    use App\Services\AIBloggingService;
    use App\Services\GeminiService;
    use App\Models\BlogKeyword;
    use Illuminate\Support\Facades\Schema;
    use Illuminate\Database\Schema\Blueprint;

    require __DIR__.'/cpanel-deployment/api/vendor/autoload.php';
    $app = require_once __DIR__.'/cpanel-deployment/api/bootstrap/app.php';
    $kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
    $kernel->bootstrap();

    // 1. Setup In-Memory SQLite
    config(['database.default' => 'sqlite']);
    config(['database.connections.sqlite.database' => ':memory:']);
    
    // 2. Mock Migrations (Create necessary tables)
    Schema::create('blog_keywords', function(Blueprint $table) {
        $table->uuid('id')->primary();
        $table->string('keyword');
        $table->string('status')->default('active');
        $table->timestamp('last_used_at')->nullable();
        $table->timestamps();
    });

    Schema::create('blog_posts', function(Blueprint $table) {
        $table->uuid('id')->primary();
        $table->string('title');
        $table->string('slug');
        $table->longText('content');
        $table->text('excerpt')->nullable();
        $table->string('status')->default('draft');
        $table->string('featured_image')->nullable();
        $table->boolean('is_ai_generated')->default(false);
        $table->uuid('keyword_id')->nullable();
        $table->string('meta_title')->nullable();
        $table->text('meta_description')->nullable();
        $table->timestamp('published_at')->nullable();
        $table->timestamps();
    });

    // 3. Mock Gemini Service
    $mockGemini = new class extends GeminiService {
        public function __construct() { /* Skip API key logic */ }
        public function generateText(string $prompt, string $model = 'gemini-2.5-flash'): string {
            if (strpos($prompt, 'meta description') !== false) return "Mock Meta Description";
            if (strpos($prompt, 'JSON SCHEMA') !== false) {
                return json_encode([
                    'title' => 'Test Blog Title',
                    'hook' => 'This is a test hook.',
                    'intro' => '<p>Test intro.</p>',
                    'takeaways' => ['Point 1', 'Point 2'],
                    'sections' => [['heading' => 'H2 Test', 'body' => '<p>Test body</p>']],
                    'faqs' => [['q' => 'Q?', 'a' => 'A.']],
                    'cta_text' => 'CTA'
                ]);
            }
            return "Mock Strategy";
        }
        public function generateImage(string $prompt, string $model = 'gemini-3.1-flash-image-preview'): ?string {
            return base64_encode('fake_image_data_not_real_but_binary_compatible');
        }
    };

    app()->instance(GeminiService::class, $mockGemini);

    // 4. Run the Test
    try {
        echo "--- Starting Mock Blog Generation Test ---\n";
        
        $keyword = BlogKeyword::create(['id' => \Illuminate\Support\Str::uuid(), 'keyword' => 'AI Revolution']);
        
        $service = app(AIBloggingService::class);
        $result = $service->generateFullBlog($keyword);

        echo "✅ SUCCESS: Blog Generated!\n";
        echo "Blog ID: " . $result['id'] . "\n";
        echo "Blog Title: " . $result['title'] . "\n";
        
        // Verify DB record
        $postCount = \App\Models\BlogPost::count();
        echo "Database check: {$postCount} blog post(s) found in memory.\n";

    } catch (Exception $e) {
        echo "❌ FAILED: " . $e->getMessage() . "\n";
        echo $e->getTraceAsString();
    }
}
