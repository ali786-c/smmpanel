@php $name = $name ?? 'Customer'; @endphp
<div class="section-title">Welcome to {{ config('app.name', 'emazingSM') }}, {{ $name }}!</div>
<p class="paragraph">Your account is active and ready to use. You can now log in, place your first order, and manage your wallet from your dashboard.</p>
<p class="paragraph"><a href="{{ $loginUrl ?? config('app.url') }}" class="button">Open Dashboard</a></p>
<p class="paragraph">If you need help, simply reply to this email and our support team will assist you.</p>
