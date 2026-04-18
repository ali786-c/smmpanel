<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo e($subject ?? config('app.name', 'emazingSM')); ?></title>
    <style>
        body { margin: 0; padding: 0; background: #f3f4f6; color: #111827; font-family: Inter, Arial, Helvetica, sans-serif; }
        .email-container { width: 100%; max-width: 640px; margin: 0 auto; padding: 24px; }
        .email-card { background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 24px 80px rgba(15, 23, 42, 0.08); }
        .email-header { background: #111827; color: #f9fafb; text-align: center; padding: 28px 24px; font-size: 24px; font-weight: 700; }
        .email-body { padding: 32px; }
        .email-footer { padding: 24px 24px 18px; color: #6b7280; font-size: 13px; line-height: 1.6; text-align: center; }
        .button { display: inline-block; text-decoration: none; background: #3b82f6; color: #ffffff; padding: 14px 24px; border-radius: 12px; font-weight: 600; }
        .section-title { font-size: 20px; font-weight: 700; margin-bottom: 14px; }
        .paragraph { margin-bottom: 18px; line-height: 1.7; color: #374151; }
        .small { font-size: 13px; color: #6b7280; }
        a { color: #3b82f6; }
        .card { background:#f9fafb; border-radius:16px; padding:18px; margin-bottom:18px; }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-card">
            <div class="email-header"><?php echo e(config('app.name', 'emazingSM')); ?></div>
            <div class="email-body">
                <?php echo $body; ?>

            </div>
        </div>
        <div class="email-footer">
            <p class="small">You are receiving this email because you have an account with <?php echo e(config('app.name', 'emazingSM')); ?>.</p>
            <p class="small"><a href="<?php echo e(config('app.url')); ?>"><?php echo e(config('app.url')); ?></a></p>
        </div>
    </div>
</body>
</html>
<?php /**PATH C:\Users\Muhammad Aliyan\Downloads\Laravel-Migration\Laravel-Migration\cpanel-deployment\api\resources\views/emails/layout.blade.php ENDPATH**/ ?>