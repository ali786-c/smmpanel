<?php

namespace Database\Seeders;

use App\Models\LandingStat;
use App\Models\Testimonial;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class TestimonialSeeder extends Seeder
{
    private array $niches = [
        'Fashion & Style', 'Fitness & Gym', 'Food & Cooking', 'Travel', 'Beauty & Makeup',
        'Gaming', 'Music', 'Photography', 'Business & Entrepreneurship', 'Lifestyle',
        'Tech & Gadgets', 'Comedy & Memes', 'Art & Design', 'Health & Wellness', 'Sports',
        'Crypto & Finance', 'Pets', 'Parenting', 'DIY & Crafts', 'Education',
    ];

    private array $platforms = [
        'Instagram', 'TikTok', 'YouTube', 'Twitter/X', 'Facebook', 'Twitch', 'Snapchat', 'LinkedIn',
    ];

    private array $countries = [
        'US', 'GB', 'CA', 'AU', 'DE', 'FR', 'IN', 'BR', 'MX', 'IT',
        'ES', 'NL', 'SE', 'NO', 'AE', 'SG', 'JP', 'KR', 'PH', 'NG',
    ];

    private array $firstNames = [
        'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn',
        'Logan', 'Peyton', 'Drew', 'Blake', 'Cameron', 'Dakota', 'Skyler',
        'Jamie', 'Reese', 'Hayden', 'Rowan', 'Finley', 'Emery', 'Remy',
        'Sage', 'River', 'Phoenix', 'Harley', 'Eden', 'Devon', 'Kendall', 'Reagan',
        'Marcus', 'Nathan', 'Lucas', 'Ethan', 'Liam', 'Noah', 'Oliver', 'James',
        'Sophia', 'Emma', 'Ava', 'Isabella', 'Mia', 'Charlotte', 'Amelia', 'Harper',
        'Elijah', 'Sebastian', 'Jack', 'Owen', 'Thomas', 'Wyatt', 'Caleb', 'Mason',
        'Aaliyah', 'Zoe', 'Nadia', 'Priya', 'Kenji', 'Mei', 'Fatima', 'Yusuf',
        'Carlos', 'Diego', 'Ana', 'Sofia', 'Mateo', 'Valentina', 'Santiago', 'Camila',
        'Lena', 'Felix', 'Leon', 'Mia', 'Hannah', 'Jonas', 'Nina', 'Tim',
    ];

    private array $lastNames = [
        'Rivera', 'Mitchell', 'Thompson', 'Garcia', 'Johnson', 'Williams', 'Brown',
        'Jones', 'Miller', 'Davis', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas',
        'Jackson', 'White', 'Harris', 'Martin', 'Lee', 'Perez', 'Walker', 'Hall',
        'Young', 'Allen', 'King', 'Wright', 'Lopez', 'Hill', 'Scott', 'Green',
        'Adams', 'Baker', 'Nelson', 'Carter', 'Mitchell', 'Roberts', 'Turner', 'Phillips',
        'Campbell', 'Parker', 'Evans', 'Edwards', 'Collins', 'Stewart', 'Sanchez', 'Morris',
        'Rogers', 'Reed', 'Cook', 'Morgan', 'Bell', 'Murphy', 'Bailey', 'Rivera',
        'Cooper', 'Richardson', 'Cox', 'Howard', 'Ward', 'Torres', 'Peterson', 'Gray',
    ];

    private array $contentTemplates = [
        // Growth-focused
        "Went from {from}k to {to}k followers in just {days} days using emazingSM. My engagement stayed strong too — not just vanity numbers. This platform is the real deal for creators serious about growth.",
        "I tried every SMM tool out there. Nothing compared to emazingSM. Hit {to}k followers on {platform} after being stuck at {from}k for months. My {niche} content is finally getting the reach it deserves.",
        "emazingSM changed my content strategy completely. Started at {from}k, now sitting at {to}k — and my brand deals have tripled because of the social proof. Cannot recommend enough.",
        "Used emazingSM to grow my {niche} page from scratch. Orders filled within hours, never had a drop in followers, customer support actually responds. 10/10.",
        "My {platform} went from ghost town to growing community thanks to emazingSM. Gained {to}k followers over 3 months. My {niche} brand is finally being taken seriously by sponsors.",

        // Business impact
        "As a small {niche} brand, social proof was everything. emazingSM helped us hit {to}k followers on {platform}. Our sales increased {pct}% the month after. Worth every penny.",
        "Running a {niche} agency and emazingSM is now our go-to for client growth campaigns. Reliable, fast delivery, and the reseller panel is super clean. Our clients love the results.",
        "I manage social accounts for {count} clients and emazingSM handles all of them flawlessly. The API is solid, delivery is consistent, and pricing beats everyone else in the market.",
        "Used emazingSM to boost our {niche} brand launch. Hit {to}k followers in the first month which helped us land our first major retail partnership. The ROI is incredible.",
        "Been using emazingSM for my agency for {months} months. Zero complaints — orders always complete, support is fast when issues come up, and the pricing dashboard is transparent.",

        // Organic-feel testimonials
        "What I love most is that emazingSM followers actually look real. My engagement rate stayed healthy and my content started showing up on the explore page organically after the boost.",
        "I was skeptical but my friend in the {niche} space vouched for emazingSM. Tried a small order — immediate results, no drop. Scaled up and now I'm at {to}k on {platform}.",
        "The difference with emazingSM vs other services I've tried: the growth feels organic. My comment section is still active, DMs are coming in, sponsors aren't suspicious.",
        "Grew my {niche} {platform} from {from}k to {to}k over {months} months. Steady, consistent — exactly how it should look. No spikes that would flag platform algorithms.",
        "My {platform} page was shadow-banned for a year. After a clean emazingSM campaign focused on real-looking engagement, I came back stronger than ever. Now at {to}k.",

        // Speed & reliability
        "Placed my order at midnight, it started within 2 hours, completed by morning. emazingSM's delivery speed is unmatched. My {platform} stats jumped overnight.",
        "Super fast turnaround. Ordered {to}k followers for my {platform} on a Tuesday, hit the target by Thursday. Support updated me throughout. Seamless experience.",
        "The delivery was instant and steady — not the sudden spike that looks fake. emazingSM clearly knows how to make growth look natural. My analytics look completely clean.",
        "Tried 4 other services before finding emazingSM. The difference is the consistency — no drops after delivery, no random unfollows 2 weeks later. This one actually sticks.",
        "Fast, reliable, affordable. I've placed {count} orders with emazingSM and every single one completed on time. That consistency is rare in this industry.",

        // Long-term users
        "Been with emazingSM since {year}. Watched them grow as a company and they've only gotten better — faster delivery, more services, better support. Loyal customer for life.",
        "Three years using emazingSM for my {niche} content empire. {to}k+ followers across all my platforms. I recommend it to every creator I mentor.",
        "Started using emazingSM back in {year} when I had 500 followers. Now I'm at {to}k and have a full-time career in {niche} content. This platform was part of that journey.",
        "I've been a customer since {year}. The platform keeps improving — new services, better prices, more payment options. They actually listen to feedback. Rare for SMM panels.",
        "Over {months} months of consistent use. emazingSM has become as essential to my workflow as my camera and editing software. Non-negotiable for serious creators.",

        // Niche-specific
        "My {niche} content was getting buried. After using emazingSM to boost my {platform} presence, I'm getting featured by major accounts in my space. Growth changed everything.",
        "As a fitness creator, credibility is everything. emazingSM helped me cross {to}k followers on {platform} which got me my first supplement sponsorship. Paid for itself 10x over.",
        "Started my {niche} {platform} during the pandemic with zero followers. Used emazingSM to get momentum, now I have brand deals and a real community. Never looked back.",
        "Music producers don't get enough attention to how important social presence is. emazingSM helped me grow my {platform} to {to}k and I've since signed with a label. Seriously.",
        "Photography clients judge you by your follower count before they even look at your work. emazingSM helped me hit {to}k which completely transformed my inquiry rate.",

        // Resellers
        "Running an SMM reseller business and emazingSM is my primary supplier. Their wholesale rates are competitive and the API reliability is the best I've used in {months} months.",
        "I resell emazingSM services to my local business clients. The markup is excellent and delivery is always on time. My clients are happy, I'm happy. Solid business model.",
        "emazingSM's reseller panel is the most professional I've seen. Clean dashboard, real-time tracking, and their support actually understands the business. Highly recommend.",

        // Simple short reviews
        "Fast delivery, great prices, solid support. What more do you need? emazingSM delivers every time.",
        "Been using emazingSM for {months} months. Never had a single order fail. That's the track record that keeps me coming back.",
        "Quality is consistent, prices are fair, and the dashboard is easy to use. emazingSM is the standard for SMM panels.",
        "emazingSM is the only panel I trust with my brand accounts. Clean, reliable, and the support team knows what they're talking about.",
        "Tried emazingSM on a friend's recommendation. Placed my first order, it delivered perfectly, and I've been a regular customer ever since. Simple as that.",
    ];

    public function run(): void
    {
        $start = Carbon::create(2018, 1, 1);
        $end = Carbon::create(2026, 4, 1);
        $totalDays = $start->diffInDays($end);

        $testimonials = [];
        $count = 520;

        for ($i = 0; $i < $count; $i++) {
            $firstName = $this->firstNames[array_rand($this->firstNames)];
            $lastName = $this->lastNames[array_rand($this->lastNames)];
            $name = "$firstName $lastName";
            $handle = '@' . strtolower($firstName) . rand(10, 9999);
            $platform = $this->platforms[array_rand($this->platforms)];
            $niche = $this->niches[array_rand($this->niches)];
            $country = $this->countries[array_rand($this->countries)];

            $fromK = rand(1, 50);
            $toK = $fromK + rand(10, 200);
            $days = rand(14, 90);
            $months = rand(2, 24);
            $pct = rand(20, 120);
            $count2 = rand(5, 50);
            $year = rand(2018, 2024);

            $template = $this->contentTemplates[array_rand($this->contentTemplates)];
            $content = str_replace(
                ['{from}', '{to}', '{days}', '{months}', '{pct}', '{count}', '{year}', '{niche}', '{platform}'],
                [$fromK, $toK, $days, $months, $pct, $count2, $year, strtolower($niche), $platform],
                $template
            );

            $dayOffset = rand(0, $totalDays);
            $reviewedAt = $start->copy()->addDays($dayOffset);

            $rating = (rand(0, 100) < 90) ? 5 : (rand(0, 100) < 70 ? 4 : 3);
            $featured = ($i < 18);

            $followersCount = match(true) {
                $toK < 10 => rand(1000, 9999),
                $toK < 50 => rand(10000, 49999),
                $toK < 100 => rand(50000, 99999),
                default => rand(100000, 500000),
            };

            $testimonials[] = [
                'id' => (string) Str::uuid(),
                'author_name' => $name,
                'author_handle' => $handle,
                'avatar_seed' => strtolower($firstName . $lastName),
                'platform' => $platform,
                'rating' => $rating,
                'content' => $content,
                'followers_count' => $followersCount,
                'niche' => $niche,
                'country_code' => $country,
                'featured' => $featured,
                'reviewed_at' => $reviewedAt->toDateTimeString(),
                'created_at' => now()->toDateTimeString(),
                'updated_at' => now()->toDateTimeString(),
            ];
        }

        foreach (array_chunk($testimonials, 50) as $chunk) {
            \App\Models\Testimonial::insert($chunk);
        }

        LandingStat::upsert([
            ['key' => 'total_orders', 'value' => '2847391', 'label' => 'Orders Completed', 'suffix' => '+'],
            ['key' => 'active_users', 'value' => '184000', 'label' => 'Active Creators', 'suffix' => '+'],
            ['key' => 'countries', 'value' => '150', 'label' => 'Countries Served', 'suffix' => '+'],
            ['key' => 'uptime', 'value' => '99.9', 'label' => 'Uptime SLA', 'suffix' => '%'],
            ['key' => 'avg_delivery', 'value' => '< 2 hours', 'label' => 'Avg. Delivery Time', 'suffix' => null],
            ['key' => 'services', 'value' => '500', 'label' => 'SMM Services', 'suffix' => '+'],
            ['key' => 'satisfaction', 'value' => '4.9', 'label' => 'Customer Rating', 'suffix' => '/5'],
            ['key' => 'founded_year', 'value' => '2018', 'label' => 'Serving Creators Since', 'suffix' => null],
        ], ['key'], ['value', 'label', 'suffix', 'updated_at']);
    }
}
