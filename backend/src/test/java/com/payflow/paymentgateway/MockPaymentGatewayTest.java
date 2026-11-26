package com.payflow.paymentgateway;

import com.payflow.enums.PaymentMethodType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class MockPaymentGatewayTest {

    private MockPaymentGateway gateway;

    @BeforeEach
    void setUp() {
        gateway = new MockPaymentGateway(0, false);
    }

    @Test
    @DisplayName("Should process normal payment successfully")
    void shouldProcessNormalPaymentSuccessfully() {
        PaymentGatewayRequest request = new PaymentGatewayRequest(
                1L, 10L, "customer@test.com", new BigDecimal("100.00"), "USD", PaymentMethodType.MOCK_CARD, "idem_123"
        );

        PaymentGatewayResult result = gateway.processPayment(request);

        assertThat(result.isSuccessful()).isTrue();
        assertThat(result.getGatewayReference()).startsWith("pg_tx_");
        assertThat(result.getFailureReason()).isNull();
    }

    @Test
    @DisplayName("Should decline payment when forceFailure is enabled")
    void shouldDeclineWhenForceFailureEnabled() {
        gateway.setForceFailure(true);

        PaymentGatewayRequest request = new PaymentGatewayRequest(
                1L, 10L, "customer@test.com", new BigDecimal("100.00"), "USD", PaymentMethodType.MOCK_CARD, "idem_123"
        );

        PaymentGatewayResult result = gateway.processPayment(request);

        assertThat(result.isSuccessful()).isFalse();
        assertThat(result.getFailureReason()).contains("Simulated gateway rejection");
    }

    @Test
    @DisplayName("Should decline payment when amount exceeds single transaction velocity limit")
    void shouldDeclineWhenAmountExceedsLimit() {
        PaymentGatewayRequest request = new PaymentGatewayRequest(
                1L, 10L, "customer@test.com", new BigDecimal("15000.00"), "USD", PaymentMethodType.MOCK_CARD, "idem_123"
        );

        PaymentGatewayResult result = gateway.processPayment(request);

        assertThat(result.isSuccessful()).isFalse();
        assertThat(result.getFailureReason()).contains("Exceeded single transaction velocity limit");
    }

    @Test
    @DisplayName("Should decline payment when idempotency key contains 'fail'")
    void shouldDeclineWhenKeyContainsFailTag() {
        PaymentGatewayRequest request = new PaymentGatewayRequest(
                1L, 10L, "customer@test.com", new BigDecimal("50.00"), "USD", PaymentMethodType.MOCK_CARD, "idem_fail_simulation"
        );

        PaymentGatewayResult result = gateway.processPayment(request);

        assertThat(result.isSuccessful()).isFalse();
        assertThat(result.getFailureReason()).contains("Mock test failure requested");
    }
}
