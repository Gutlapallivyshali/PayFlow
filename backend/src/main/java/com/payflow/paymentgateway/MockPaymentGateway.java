package com.payflow.paymentgateway;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.UUID;

@Component
public class MockPaymentGateway implements PaymentGateway {

    private static final Logger log = LoggerFactory.getLogger(MockPaymentGateway.class);

    private final long defaultLatencyMs;
    private volatile boolean forceFailure;

    public MockPaymentGateway(
            @Value("${payflow.gateway.mock.default-latency-ms:100}") long defaultLatencyMs,
            @Value("${payflow.gateway.mock.force-failure:false}") boolean forceFailure) {
        this.defaultLatencyMs = defaultLatencyMs;
        this.forceFailure = forceFailure;
    }

    @Override
    public PaymentGatewayResult processPayment(PaymentGatewayRequest request) {
        long startTime = System.currentTimeMillis();
        String gatewayRef = "pg_tx_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);

        log.info("MockPaymentGateway: Initiating processing for Payment ID [{}] with gateway ref [{}]",
                request.getPaymentId(), gatewayRef);

        // Simulate network processing latency
        if (defaultLatencyMs > 0) {
            try {
                Thread.sleep(defaultLatencyMs);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }

        long latency = System.currentTimeMillis() - startTime;

        // Check simulated failure triggers
        if (this.forceFailure) {
            log.warn("MockPaymentGateway: Simulated failure triggered via forceFailure toggle.");
            return PaymentGatewayResult.failure(gatewayRef, "Simulated gateway rejection: Gateway error mode enabled", latency);
        }

        // Test rule: Amounts >= 10000.00 fail with fraud limit
        if (request.getAmount() != null && request.getAmount().compareTo(new BigDecimal("10000.00")) >= 0) {
            log.warn("MockPaymentGateway: Payment declined due to exceeding single transaction limit: {}", request.getAmount());
            return PaymentGatewayResult.failure(gatewayRef, "Card declined: Exceeded single transaction velocity limit ($10,000.00)", latency);
        }

        // Test rule: specific trigger in description or idempotency key
        if (request.getIdempotencyKey() != null && request.getIdempotencyKey().contains("fail")) {
            log.warn("MockPaymentGateway: Explicit test failure triggered by idempotency key test tag.");
            return PaymentGatewayResult.failure(gatewayRef, "Payment declined: Mock test failure requested", latency);
        }

        log.info("MockPaymentGateway: Payment ID [{}] settled successfully. Ref: [{}]", request.getPaymentId(), gatewayRef);
        return PaymentGatewayResult.success(gatewayRef, latency);
    }

    @Override
    public String getGatewayProviderName() {
        return "MOCK_GATEWAY_V1";
    }

    public boolean isForceFailure() {
        return forceFailure;
    }

    public void setForceFailure(boolean forceFailure) {
        this.forceFailure = forceFailure;
    }

    public long getDefaultLatencyMs() {
        return defaultLatencyMs;
    }
}
