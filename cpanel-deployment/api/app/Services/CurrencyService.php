<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class CurrencyService
{
    /**
     * Convert USD amount to EUR with a safety margin.
     * Default rate fallback if API fails.
     */
    public function convertUsdToEur(float $amount): array
    {
        $rate = $this->getLiveRate();
        
        // Add 2% Safety Margin (e.g. 0.92 becomes ~0.94)
        $rateWithMargin = $rate * 1.02;
        
        $convertedAmount = round($amount * $rateWithMargin, 2);

        return [
            'original_amount' => $amount,
            'converted_amount' => $convertedAmount,
            'rate' => $rate,
            'rate_used' => $rateWithMargin,
            'currency' => 'EUR'
        ];
    }

    /**
     * Fetch live USD -> EUR rate from a reliable API.
     * Caches the result for 1 hour.
     */
    protected function getLiveRate(): float
    {
        return Cache::remember('usd_to_eur_rate', 3600, function () {
            try {
                // Using a reliable free exchange rate API
                $response = Http::get('https://api.exchangerate-api.com/v4/latest/USD');
                
                if ($response->successful() && isset($response->json()['rates']['EUR'])) {
                    return (float) $response->json()['rates']['EUR'];
                }
                
                throw new \Exception("Failed to fetch exchange rate from primary API.");
            } catch (\Exception $e) {
                Log::error("CurrencyService Error: " . $e->getMessage());
                return 0.93; // Safe Fallback rate if everything fails
            }
        });
    }
}
