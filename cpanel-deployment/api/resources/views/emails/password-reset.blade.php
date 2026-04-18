@php $name = $name ?? 'Customer'; @endphp
<div class="section-title">Password Reset Requested</div>
<p class="paragraph">Hi {{ $name }},</p>
<p class="paragraph">We received a request to reset your password for your {{ config('app.name', 'emazingSM') }} account.</p>
@if(!empty($resetUrl))
    <p class="paragraph"><a href="{{ $resetUrl }}" class="button">Reset your password</a></p>
    <p class="paragraph">If the button above does not work, paste the following link into your browser:</p>
    <p class="paragraph"><a href="{{ $resetUrl }}">{{ $resetUrl }}</a></p>
@endif
<p class="paragraph">If you did not request a password reset, no further action is required.</p>
