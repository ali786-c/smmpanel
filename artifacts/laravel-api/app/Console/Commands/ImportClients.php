<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\Profile;
use App\Models\Wallet;
use App\Models\UserRole;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class ImportClients extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:import-clients {file : The path to the CSV file}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Import clients from a CSV file (SmartPanel format)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $filePath = $this->argument('file');

        if (!file_exists($filePath)) {
            $this->error("File not found: {$filePath}");
            return 1;
        }

        $file = fopen($filePath, 'r');
        $passwords = [];
        $count = 0;
        $skipped = 0;

        $this->info("Starting import...");

        while (($row = fgetcsv($file)) !== FALSE) {
            // Mapping (adjusted for sample data)
            // Example row: 3,beastly,realbeastly@gmail.com,,0,0.0140000,17.8960000,Active
            
            if (count($row) < 8) continue;

            $username = trim($row[1]);
            $email    = strtolower(trim($row[2]));
            $balance  = (float) $row[5];
            $spent    = (float) $row[6];
            $status   = trim($row[7]);

            // Skip Header or Invalid
            if ($email === 'email' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                continue;
            }

            // Skip Suspended
            if (strtolower($status) !== 'active') {
                $this->warn("Skipping suspended user: {$email}");
                $skipped++;
                continue;
            }

            // Skip Duplicate
            if (User::where('email', $email)->exists()) {
                $this->warn("Skipping duplicate email: {$email}");
                $skipped++;
                continue;
            }

            DB::beginTransaction();
            try {
                $rawPassword = Str::random(12);
                
                $user = User::create([
                    'email'    => $email,
                    'password' => $rawPassword, // Auto-hashed by User model cast
                ]);

                Profile::create([
                    'id'            => (string) Str::uuid(),
                    'user_id'       => $user->id,
                    'display_name'  => $username ?: $email,
                    'total_spent'   => $spent,
                    'referral_code' => strtolower(substr(md5($user->id . now()), 0, 8)),
                ]);

                Wallet::create([
                    'id'      => (string) Str::uuid(),
                    'user_id' => $user->id,
                    'balance' => $balance,
                ]);

                UserRole::create([
                    'user_id' => $user->id,
                    'role'    => 'user',
                ]);

                DB::commit();

                $passwords[] = [$email, $rawPassword];
                $count++;
                
                if ($count % 50 === 0) {
                    $this->info("Imported {$count} users...");
                }

            } catch (\Exception $e) {
                DB::rollBack();
                $this->error("Failed to import {$email}: " . $e->getMessage());
            }
        }

        fclose($file);

        // Export passwords
        $reportPath = base_path('migration_passwords.csv');
        $reportFile = fopen($reportPath, 'w');
        fputcsv($reportFile, ['Email', 'Temporary Password']);
        foreach ($passwords as $p) {
            fputcsv($reportFile, $p);
        }
        fclose($reportFile);

        $this->info("Import complete!");
        $this->info("Total Imported: {$count}");
        $this->info("Total Skipped: {$skipped}");
        $this->info("Password list created at: {$reportPath}");

        return 0;
    }
}
