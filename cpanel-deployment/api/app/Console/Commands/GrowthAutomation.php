<?php

namespace App\Console\Commands;

use App\Http\Controllers\Admin\AdminGrowthController;
use Illuminate\Console\Command;
use Illuminate\Http\Request;

class GrowthAutomation extends Command
{
    protected $signature = 'automation:growth {action=all : Action to run (all, re-engagement, auto-promo, abandoned-recovery)}';
    protected $description = 'Run growth automation tasks: re-engagement, promos, abandoned cart recovery';

    public function handle(): int
    {
        $action = $this->argument('action');
        $this->info("Running growth automation: {$action}");

        $controller = new AdminGrowthController();
        $request = Request::create('/', 'POST', ['action' => $action]);
        $response = $controller->run($request);

        $data = json_decode($response->getContent(), true);
        $this->info("Results: " . json_encode($data['results'] ?? [], JSON_PRETTY_PRINT));

        return Command::SUCCESS;
    }
}
