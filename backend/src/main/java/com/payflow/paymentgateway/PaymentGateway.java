package com.payflow.paymentgateway;

public interface PaymentGateway {

    /**
     * Executes the payment transaction against the upstream payment network.
     *
     * @param request Gateway payment parameters
     * @return PaymentGatewayResult containing success flag, gateway reference, failure reason, and latency
     */
    PaymentGatewayResult processPayment(PaymentGatewayRequest request);

    /**
     * Returns the unique provider name.
     */
    String getGatewayProviderName();
}
