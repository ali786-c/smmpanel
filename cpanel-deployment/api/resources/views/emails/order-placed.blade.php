@php $name = $name ?? 'Customer'; @endphp
<div class="section-title">Order Placed Successfully</div>
<p class="paragraph">Hi {{ $name }},</p>
<p class="paragraph">Your order <strong>#{{ $orderId }}</strong> has been placed successfully and is now being processed.</p>
<div class="card">
    <p><strong>Service:</strong> {{ $serviceName }}</p>
    <p><strong>Quantity:</strong> {{ $quantity }}</p>
    <p><strong>Total cost:</strong> {{ $totalCost }}</p>
    <p><strong>Status:</strong> {{ $status }}</p>
</div>
<p class="paragraph">You can track the order from your dashboard using the button below.</p>
<p class="paragraph"><a href="{{ $orderUrl }}" class="button">View order</a></p>
<p class="paragraph">Thank you for choosing {{ config('app.name', 'emazingSM') }}.</p>
