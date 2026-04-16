<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class IncrementLandingStats extends Command
{
    protected $signature   = 'landing:increment-stats';
    protected $description = 'Daily: increment landing page order/customer counters using real DB counts + small random bump';

    public function handle(): int
    {
        // Use real DB counts as the baseline
        $realOrders    = DB::table('orders')->count();
        $realCustomers = DB::table('users')->count();

        // Small random daily bump for organic-looking growth
        $orderBump    = rand(5, 50);
        $customerBump = rand(1, 10);

        $row = DB::table('landing_stats')->first();

        if (!$row) {
            DB::table('landing_stats')->insert([
                'total_orders'    => $realOrders + $orderBump,
                'total_customers' => $realCustomers + $customerBump,
                'started_year'    => 2018,
                'created_at'      => now(),
                'updated_at'      => now(),
            ]);
        } else {
            DB::table('landing_stats')->where('id', $row->id)->update([
                'total_orders'    => max($row->total_orders + $orderBump,    $realOrders),
                'total_customers' => max($row->total_customers + $customerBump, $realCustomers),
                'updated_at'      => now(),
            ]);
        }

        $this->info('Landing stats incremented.');
        return self::SUCCESS;
    }
}
