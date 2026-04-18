<?php $name = $name ?? 'Customer'; ?>
<div class="section-title">Welcome to <?php echo e(config('app.name', 'emazingSM')); ?>, <?php echo e($name); ?>!</div>
<p class="paragraph">Your account is active and ready to use. You can now log in, place your first order, and manage your wallet from your dashboard.</p>
<p class="paragraph"><a href="<?php echo e($loginUrl ?? config('app.url')); ?>" class="button">Open Dashboard</a></p>
<p class="paragraph">If you need help, simply reply to this email and our support team will assist you.</p>
<?php /**PATH C:\Users\Muhammad Aliyan\Downloads\Laravel-Migration\Laravel-Migration\cpanel-deployment\api\resources\views/emails/welcome.blade.php ENDPATH**/ ?>