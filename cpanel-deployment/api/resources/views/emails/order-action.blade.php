@php $name = $name ?? 'Customer'; @endphp
<div class="section-title">Order Update</div>
<p class="paragraph">Hi {{ $name }},</p>
<p class="paragraph">{{ $message }}</p>
@if(!empty($orderUrl))
    <p class="paragraph"><a href="{{ $orderUrl }}" class="button">View order details</a></p>
@endif
<p class="paragraph">If you have any questions, reply to this email and our support team will assist you.</p>
