<?php

namespace App\Console\Commands;

use App\Models\Testimonial;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class GenerateTestimonials extends Command
{
    protected $signature = 'automation:generate-testimonials {--count=50 : Number of testimonials to generate} {--featured=0 : Mark as featured}';
    protected $description = 'Generate realistic testimonials for the landing page';

    private array $niches = [
        'Fashion & Style', 'Fitness & Gym', 'Food & Cooking', 'Travel', 'Beauty & Makeup',
        'Gaming', 'Music', 'Photography', 'Business & Entrepreneurship', 'Lifestyle',
        'Tech & Gadgets', 'Comedy & Memes', 'Art & Design', 'Health & Wellness', 'Sports',
        'Crypto & Finance', 'Pets', 'Parenting', 'DIY & Crafts', 'Education',
    ];

    private array $platforms = [
        'Instagram', 'TikTok', 'YouTube', 'Twitter/X', 'Facebook', 'Twitch',
    ];

    private array $countries = [
        'US', 'GB', 'CA', 'AU', 'DE', 'FR', 'IN', 'BR', 'MX', 'IT',
        'ES', 'NL', 'SE', 'NO', 'AE', 'SG', 'JP', 'KR', 'PH', 'NG',
    ];

    private array $templates = [
        "Went from {from}k to {to}k followers in just {days} days using emazingSM. My engagement stayed solid throughout — not just vanity numbers. This platform is the real deal.",
        "I tried every SMM tool out there. Nothing compared to emazingSM. Hit {to}k followers on {platform} after being stuck at {from}k for months.",
        "emazingSM changed my content game completely. Started at {from}k, now at {to}k — my brand deals have tripled because of the social proof.",
        "Used emazingSM to grow my {niche} page from {from}k. Orders filled within hours, no drops, support is responsive. 10/10.",
        "My {platform} went from ghost town to growing fast thanks to emazingSM. Gained {to}k followers over {months} months.",
        "As a {niche} creator, social proof matters everything. emazingSM helped us hit {to}k followers on {platform}. Highly recommend.",
        "Running an agency and emazingSM is now our go-to for client campaigns. Reliable, fast delivery, clean reseller panel.",
        "Been using emazingSM for {months} months. Zero failed orders — that consistency is rare in this industry.",
        "The delivery is steady and natural-looking — no sudden spikes that flag algorithms. My analytics look completely clean.",
        "Fast, reliable, affordable. I've placed {count} orders with emazingSM and every single one completed on time.",
    ];

    public function handle(): int
    {
        $count = (int) $this->option('count');
        $featured = (bool) $this->option('featured');

        $firstNames = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Marcus', 'Nathan',
            'Sophia', 'Emma', 'Ava', 'Isabella', 'Mia', 'Liam', 'Noah', 'Oliver', 'Carlos', 'Diego', 'Ana', 'Sofia'];
        $lastNames = ['Rivera', 'Mitchell', 'Thompson', 'Garcia', 'Johnson', 'Williams', 'Brown',
            'Jones', 'Miller', 'Davis', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Lee'];

        $created = 0;
        for ($i = 0; $i < $count; $i++) {
            $firstName = $firstNames[array_rand($firstNames)];
            $lastName = $lastNames[array_rand($lastNames)];
            $platform = $this->platforms[array_rand($this->platforms)];
            $niche = $this->niches[array_rand($this->niches)];
            $fromK = rand(1, 50);
            $toK = $fromK + rand(10, 150);
            $days = rand(14, 90);
            $months = rand(2, 18);
            $cnt = rand(5, 40);

            $template = $this->templates[array_rand($this->templates)];
            $content = str_replace(
                ['{from}', '{to}', '{days}', '{months}', '{count}', '{niche}', '{platform}'],
                [$fromK, $toK, $days, $months, $cnt, strtolower($niche), $platform],
                $template
            );

            Testimonial::create([
                'author_name' => "$firstName $lastName",
                'author_handle' => '@' . strtolower($firstName) . rand(10, 9999),
                'avatar_seed' => strtolower($firstName . $lastName),
                'platform' => $platform,
                'rating' => rand(0, 100) < 85 ? 5 : 4,
                'content' => $content,
                'followers_count' => rand(1000, 500000),
                'niche' => $niche,
                'country_code' => $this->countries[array_rand($this->countries)],
                'featured' => $featured,
                'reviewed_at' => Carbon::now()->subDays(rand(0, 730)),
            ]);
            $created++;
        }

        Cache::forget('featured_testimonials');
        Cache::forget('landing_stats');

        $this->info("Generated {$created} testimonials successfully.");
        return Command::SUCCESS;
    }
}
