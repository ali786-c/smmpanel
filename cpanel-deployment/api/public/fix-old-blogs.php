<?php
/**
 * AI Blogging Engine - Old Blog Image Path Fixer
 * systematic replacement of /storage/ with /api/storage/
 */

define('LARAVEL_START', microtime(true));

// 1. Boot Laravel
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$response = $kernel->handle($request = Illuminate\Http\Request::capture());

use App\Models\BlogPost;
use Illuminate\Support\Facades\DB;

header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>AI Blog Path Fixer</title>
    <style>
        body { font-family: sans-serif; padding: 40px; line-height: 1.6; }
        .log { background: #f4f4f4; padding: 20px; border-radius: 8px; font-family: monospace; font-size: 13px; max-height: 500px; overflow-y: auto; }
        .success { color: green; font-weight: bold; }
        .info { color: blue; }
        .card { border: 1px solid #ddd; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    </style>
</head>
<body>
    <div class="card">
        <h1>🛠️ AI Blog Image Path Fixer</h1>
        <p>Updating all blog posts to use the correct <code>/api/storage/</code> prefix...</p>
        
        <div class="log">
            <?php
            try {
                $posts = BlogPost::all();
                $updatedCount = 0;
                $totalCount = count($posts);
                
                echo "[SYSTEM] Found $totalCount blog posts.<br><br>";

                foreach ($posts as $post) {
                    $changed = false;
                    
                    // 1. Fix Featured Image
                    if (strpos($post->featured_image, '/storage/blog_images/') === 0 && strpos($post->featured_image, '/api/public/') === false) {
                        $oldPath = $post->featured_image;
                        $post->featured_image = str_replace('/storage/blog_images/', '/api/public/storage/blog_images/', $post->featured_image);
                        echo "[INFO] Updating Post ID: {$post->id}<br>";
                        echo "&nbsp;&nbsp;&nbsp;&nbsp;Image: $oldPath -> <span class='success'>{$post->featured_image}</span><br>";
                        $changed = true;
                    }

                    // 2. Fix Content internal links
                    if (strpos($post->content, '/storage/blog_images/') !== false && strpos($post->content, '/api/public/storage/blog_images/') === false) {
                        $post->content = str_replace('/storage/blog_images/', '/api/public/storage/blog_images/', $post->content);
                        echo "&nbsp;&nbsp;&nbsp;&nbsp;Content: Updated internal links.<br>";
                        $changed = true;
                    }

                    if ($changed) {
                        $post->save();
                        $updatedCount++;
                    }
                }

                echo "<br><br><span class='success'>✅ COMPLETED! $updatedCount posts were successfully updated.</span>";
            } catch (Exception $e) {
                echo "<span style='color:red;'>[ERROR] " . $e->getMessage() . "</span>";
            }
            ?>
        </div>
        
        <p style="margin-top:20px;">
            <a href="/admin/blog-automation" style="text-decoration:none; background:#007bff; color:white; padding:10px 20px; border-radius:5px;">Go back to Admin</a>
        </p>
    </div>
</body>
</html>
