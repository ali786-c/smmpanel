<?php

return [
    /*
     * You can enable CORS for 1 or multiple paths.
     * The default is the entire API.
     */
    'paths' => ['api/*'],

    /*
     * Matches the request method. `['*']` allows all methods.
     */
    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    /*
     * Matches the request origin. Set specific domains; no wildcards.
     * 'allow_all' key set to true would allow all, so we don't use it.
     */
    'allowed_origins' => [],

    /*
     * Matches the request origin using patterns (regex-style).
     * Allows any *.replit.dev subdomain and localhost.
     */
    'allowed_origins_patterns' => [
        '/^https?:\/\/localhost(:\d+)?$/',
        '/^https:\/\/[\w\-]+\.spock\.replit\.dev$/',
        '/^https:\/\/[\w\-]+\.replit\.dev$/',
        '/^https:\/\/[\w\-]+\.replit\.app$/',
    ],

    /*
     * Sets the Access-Control-Allow-Headers response header.
     */
    'allowed_headers' => ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],

    /*
     * Sets the Access-Control-Expose-Headers response header.
     */
    'exposed_headers' => ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],

    /*
     * Sets the Access-Control-Max-Age response header.
     */
    'max_age' => 86400,

    /*
     * Sets the Access-Control-Allow-Credentials header.
     * Required for requests with Authorization header.
     */
    'supports_credentials' => true,
];
