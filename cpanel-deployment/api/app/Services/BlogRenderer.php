<?php

namespace App\Services;

class BlogRenderer
{
    /**
     * Main entry point to convert structured JSON into Premium HTML.
     */
    public function render(array $data, ?string $imageUrl = null): string
    {
        $html = '<div class="blog-magazine-layout space-y-12 text-slate-900 leading-relaxed">';

        // 1. Hero Section
        $html .= $this->renderHero($data['title'], $data['hook'] ?? '', $imageUrl);

        // 2. Introduction
        if (isset($data['intro'])) {
            $html .= $this->renderIntro($data['intro']);
        }

        // 3. Key Takeaways Card
        if (isset($data['takeaways']) && !empty($data['takeaways'])) {
            $html .= $this->renderTakeaways($data['takeaways']);
        }

        // 4. Main Content Sections
        if (isset($data['sections'])) {
            foreach ($data['sections'] as $section) {
                $html .= $this->renderSection($section['heading'], $section['body']);
            }
        }

        // 5. Frequently Asked Questions
        if (isset($data['faqs']) && !empty($data['faqs'])) {
            $html .= $this->renderFAQs($data['faqs']);
        }

        // 6. Final Conversion CTA
        $html .= $this->renderCTA($data['cta_text'] ?? 'Transform your social media growth today.');

        $html .= '</div>';

        return $html;
    }

    private function renderHero(string $title, string $hook, ?string $imageUrl): string
    {
        $imageHtml = $imageUrl ? "<img src='{$imageUrl}' alt='{$title}' class='w-full h-[400px] object-cover rounded-2xl shadow-2xl mb-8' />" : "";
        
        return "
            <div class='blog-hero pt-8'>
                {$imageHtml}
                <div class='max-w-3xl'>
                    <h1 class='text-5xl font-black mb-6 leading-tight tracking-tight text-slate-800 transition-all hover:text-indigo-600'>{$title}</h1>
                    <p class='text-2xl font-medium text-slate-500 italic border-l-4 border-indigo-500 pl-6 mb-8'>\"{$hook}\"</p>
                </div>
            </div>
        ";
    }

    private function renderIntro(string $intro): string
    {
        // First letter drop cap effect
        $firstLetter = substr($intro, 0, 1);
        $remainingText = substr($intro, 1);

        return "
            <div class='blog-intro text-xl text-slate-700 mb-12'>
                <span class='float-left text-7xl font-bold mr-3 mt-1 leading-none text-indigo-600'>{$firstLetter}</span>
                {$remainingText}
            </div>
        ";
    }

    private function renderTakeaways(array $takeaways): string
    {
        $items = "";
        foreach ($takeaways as $item) {
            $items .= "<li class='flex items-start mb-4'><span class='text-indigo-500 mr-2'>◈</span> {$item}</li>";
        }

        return "
            <div class='bg-slate-50 border-2 border-slate-100 p-8 rounded-3xl my-16 shadow-inner'>
                <h3 class='text-2xl font-bold mb-6 flex items-center'><span class='mr-3'>✨</span> Quick Takeaways</h3>
                <ul class='text-lg text-slate-600 grid md:grid-cols-2 gap-4'>{$items}</ul>
            </div>
        ";
    }

    private function renderSection(string $heading, string $body): string
    {
        return "
            <section class='blog-section mb-12'>
                <h2 class='text-3xl font-extrabold mb-6 text-slate-800 tracking-tight'>{$heading}</h2>
                <div class='text-lg text-slate-600 space-y-4'>{$body}</div>
            </section>
        ";
    }

    private function renderFAQs(array $faqs): string
    {
        $faqHtml = "";
        foreach ($faqs as $faq) {
            $faqHtml .= "
                <div class='mb-6 p-6 bg-white border border-slate-200 rounded-2xl'>
                    <h4 class='text-xl font-bold mb-3 text-indigo-700'>{$faq['q']}</h4>
                    <p class='text-slate-600'>{$faq['a']}</p>
                </div>
            ";
        }

        return "
            <div class='bg-indigo-50/30 p-10 rounded-3xl mt-20'>
                <h3 class='text-3xl font-black mb-10 text-center'>Questions & Answers</h3>
                <div class='max-w-4xl mx-auto'>{$faqHtml}</div>
            </div>
        ";
    }

    private function renderCTA(string $text): string
    {
        return "
            <div class='bg-indigo-600 p-12 rounded-[2rem] text-center text-white mt-16 shadow-2xl transition-transform hover:scale-[1.02]'>
                <h3 class='text-4xl font-black mb-6'>Ready for Next-Level Growth?</h3>
                <p class='text-xl text-indigo-100 mb-10 max-w-2xl mx-auto'>{$text}</p>
                <a href='/dashboard/new-order' class='inline-block bg-white text-indigo-600 px-10 py-5 rounded-full font-bold text-lg transition-colors hover:bg-slate-50'>Get Started Now</a>
            </div>
        ";
    }
}
