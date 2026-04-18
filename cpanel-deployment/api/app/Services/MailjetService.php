<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MailjetService
{
    private string $apiKey;
    private string $apiSecret;
    private string $senderEmail;
    private string $senderName;

    public function __construct()
    {
        $this->apiKey = config('services.mailjet.key');
        $this->apiSecret = config('services.mailjet.secret');
        $this->senderEmail = config('services.mailjet.sender_email', config('mail.from.address'));
        $this->senderName = config('services.mailjet.sender_name', config('mail.from.name'));
    }

    public function sendTemplate(string $toEmail, string $toName, string $subject, string $templateView, array $templateData = []): bool
    {
        $bodyHtml = view($templateView, array_merge($templateData, ['subject' => $subject]))->render();
        $html = view('emails.layout', [
            'subject' => $subject,
            'body' => $bodyHtml,
        ])->render();
        $text = strip_tags(preg_replace('/\s+/', ' ', $html));

        return $this->send($toEmail, $toName, $subject, $html, $text);
    }

    public function send(string $toEmail, string $toName, string $subject, string $htmlBody, string $textBody): bool
    {
        if (!$this->apiKey || !$this->apiSecret || !$this->senderEmail) {
            Log::warning('MailjetService is not fully configured', [
                'mailjet_key' => (bool) $this->apiKey,
                'mailjet_secret' => (bool) $this->apiSecret,
                'sender_email' => $this->senderEmail,
            ]);
            return false;
        }

        try {
            $response = Http::timeout(15)
                ->withBasicAuth($this->apiKey, $this->apiSecret)
                ->post('https://api.mailjet.com/v3.1/send', [
                    'Messages' => [
                        [
                            'From' => [
                                'Email' => $this->senderEmail,
                                'Name' => $this->senderName,
                            ],
                            'To' => [
                                [
                                    'Email' => $toEmail,
                                    'Name' => $toName,
                                ],
                            ],
                            'Subject' => $subject,
                            'TextPart' => $textBody,
                            'HTMLPart' => $htmlBody,
                        ],
                    ],
                ]);

            if ($response->successful()) {
                return true;
            }

            Log::warning('MailjetService request failed', [
                'status' => $response->status(),
                'body' => $response->body(),
                'email' => $toEmail,
            ]);
        } catch (\Throwable $e) {
            Log::warning('MailjetService exception', [
                'error' => $e->getMessage(),
                'email' => $toEmail,
            ]);
        }

        return false;
    }
}
