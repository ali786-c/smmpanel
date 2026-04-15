<?php

namespace App\Console\Commands;

use App\Models\Ticket;
use App\Models\TicketMessage;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class AiSupportTriage extends Command
{
    protected $signature = 'automation:ai-support {--dry-run : Show responses without saving}';
    protected $description = 'AI-powered triage and auto-response for open support tickets';

    private array $knowledgeBase = [
        'refund' => "Thank you for reaching out! Your refund request has been logged. Refunds for cancelled orders are processed automatically within 24 hours. If you have not received your refund after 24 hours, please reply with your order ID.",
        'order' => "Thank you for contacting support about your order. Our team will review your order status shortly. You can also check your order status in real-time from your dashboard under 'My Orders'.",
        'payment' => "Thank you for your payment inquiry. Please note that deposits are processed immediately. If you're experiencing issues with a deposit, please provide your transaction ID and we'll investigate right away.",
        'account' => "Thank you for contacting us about your account. For security reasons, account-related issues are handled by our team directly. We'll get back to you within a few hours.",
        'service' => "Thank you for your service inquiry. Our services are sourced from high-quality providers and results may take up to 72 hours to be delivered in full. If you have concerns after this window, please reply with your order ID.",
        'password' => "To reset your password, please use the 'Forgot Password' link on the login page. If you continue to experience issues accessing your account, please provide your registered email address.",
    ];

    private string $defaultResponse = "Thank you for contacting emazingSM support! We've received your message and our team will respond within 24 hours. In the meantime, you can check our FAQ or order status dashboard.";

    public function handle(): int
    {
        $this->info('Starting AI support triage...');
        $dryRun = $this->option('dry-run');
        $openAiKey = config('services.openai.key');

        // Find tickets that are open and have no admin replies yet
        $tickets = Ticket::with(['messages'])
            ->where('status', 'open')
            ->where('updated_at', '<=', now()->subHours(2))
            ->get()
            ->filter(function ($ticket) {
                $hasAdminReply = $ticket->messages->where('sender_type', 'admin')->isNotEmpty();
                return !$hasAdminReply;
            });

        $this->info("Found {$tickets->count()} tickets needing triage.");
        $triaged = 0;

        foreach ($tickets as $ticket) {
            $subject = strtolower($ticket->subject ?? '');
            $lastUserMessage = $ticket->messages
                ->where('sender_type', 'user')
                ->sortByDesc('created_at')
                ->first();

            $messageContent = strtolower($lastUserMessage->message ?? $subject);
            $response = $this->generateResponse($messageContent, $subject, $openAiKey);

            if ($dryRun) {
                $this->line("[DRY RUN] Ticket #{$ticket->id}: " . Str::limit($response, 80));
                $triaged++;
                continue;
            }

            TicketMessage::create([
                'id'         => (string) Str::uuid(),
                'ticket_id'  => $ticket->id,
                'sender'     => 'admin',
                'content'    => $response,
                'created_at' => now(),
            ]);

            $ticket->update(['status' => 'in_progress']);
            $triaged++;
        }

        $this->info("Triaged: {$triaged} tickets.");
        return Command::SUCCESS;
    }

    private function generateResponse(string $message, string $subject, ?string $openAiKey): string
    {
        if ($openAiKey) {
            try {
                $resp = Http::withToken($openAiKey)
                    ->timeout(15)
                    ->post('https://api.openai.com/v1/chat/completions', [
                        'model' => 'gpt-4o-mini',
                        'messages' => [
                            [
                                'role' => 'system',
                                'content' => 'You are a helpful customer support agent for emazingSM, a social media marketing platform. Keep responses concise (2-3 sentences), professional, and helpful. Do not promise specific timelines unless certain.',
                            ],
                            ['role' => 'user', 'content' => "Support ticket subject: {$subject}\n\nCustomer message: {$message}"],
                        ],
                        'max_tokens' => 200,
                        'temperature' => 0.7,
                    ]);

                if ($resp->successful()) {
                    return $resp->json('choices.0.message.content') ?? $this->matchKnowledgeBase($message);
                }
            } catch (\Throwable $e) {
                $this->warn("OpenAI API error: " . $e->getMessage());
            }
        }

        return $this->matchKnowledgeBase($message);
    }

    private function matchKnowledgeBase(string $message): string
    {
        foreach ($this->knowledgeBase as $keyword => $response) {
            if (str_contains($message, $keyword)) {
                return $response;
            }
        }
        return $this->defaultResponse;
    }
}
