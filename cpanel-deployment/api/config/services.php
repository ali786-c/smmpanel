<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'payhub' => [
        'client_id'   => env('PAYHUB_CLIENT_ID'),
        'secret'      => env('PAYHUB_CLIENT_SECRET'),
        'url'         => env('PAYHUB_API_URL'),
        'currency'    => 'EUR', // Default currency for the gateway
        'success_url' => (env('FRONTEND_URL', env('APP_URL'))) . '/payment/success',
        'cancel_url'  => (env('FRONTEND_URL', env('APP_URL'))) . '/payment/cancel',
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'provider' => [
        'api_url' => env('PROVIDER_API_URL', ''),
        'api_key' => env('PROVIDER_API_KEY', ''),
    ],

    'openai' => [
        'key' => env('OPENAI_API_KEY', ''),
    ],

    'turnstile' => [
        'secret_key' => env('TURNSTILE_SECRET_KEY', ''),
    ],

    'gemini' => [
        'key' => env('GOOGLE_GEMINI_API_KEY', ''),
    ],

];
