@php $name = $name ?? 'Customer'; @endphp
<div class="section-title">Wallet Balance Updated</div>
<p class="paragraph">Hi {{ $name }},</p>
<p class="paragraph">Your wallet balance has been updated by <strong>{{ $amount }}</strong>.</p>
<p class="paragraph">Reason: {{ $reason }}</p>
<p class="paragraph">Your current balance is <strong>{{ $currentBalance }}</strong>.</p>
<p class="paragraph">If you did not expect this update, please contact support immediately.</p>
