package com.payflow.service;

import com.payflow.dto.request.CreatePaymentRequest;
import com.payflow.dto.response.PaymentResponse;
import com.payflow.entity.*;
import com.payflow.enums.*;
import com.payflow.exception.*;
import com.payflow.paymentgateway.*;
import com.payflow.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private PaymentAttemptRepository attemptRepository;

    @Mock
    private PaymentGateway paymentGateway;

    @Mock
    private IdempotencyService idempotencyService;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private PaymentService paymentService;

    private Customer activeCustomer;
    private Customer inactiveCustomer;
    private CreatePaymentRequest paymentRequest;

    @BeforeEach
    void setUp() {
        activeCustomer = new Customer("Alice Smith", "alice@example.com", "+1-555-1234", CustomerStatus.ACTIVE);
        activeCustomer.setId(10L);

        inactiveCustomer = new Customer("Bob Brown", "bob@example.com", "+1-555-5678", CustomerStatus.INACTIVE);
        inactiveCustomer.setId(20L);

        paymentRequest = new CreatePaymentRequest(
                10L,
                new BigDecimal("150.00"),
                "USD",
                "Cloud Subscription",
                PaymentMethodType.MOCK_CARD,
                "idem_test_key_123"
        );
    }

    @Test
    @DisplayName("Should create and process payment successfully to SUCCESS status")
    void shouldCreateAndProcessPaymentSuccessfully() {
        when(idempotencyService.resolveIdempotencyKey(null, "idem_test_key_123")).thenReturn("idem_test_key_123");
        when(idempotencyService.checkIdempotency("idem_test_key_123", paymentRequest)).thenReturn(Optional.empty());
        when(customerRepository.findById(10L)).thenReturn(Optional.of(activeCustomer));

        Payment savedPayment = new Payment(activeCustomer, new BigDecimal("150.00"), "USD", "Cloud Subscription",
                PaymentMethodType.MOCK_CARD, "idem_test_key_123");
        savedPayment.setId(100L);
        savedPayment.setStatus(PaymentStatus.CREATED);

        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> {
            Payment p = invocation.getArgument(0);
            if (p.getId() == null) p.setId(100L);
            return p;
        });

        PaymentGatewayResult gatewaySuccess = PaymentGatewayResult.success("pg_tx_test_ref_01", 120);
        when(paymentGateway.processPayment(any(PaymentGatewayRequest.class))).thenReturn(gatewaySuccess);
        when(paymentGateway.getGatewayProviderName()).thenReturn("MOCK_GATEWAY_V1");

        PaymentResponse response = paymentService.createAndProcessPayment(paymentRequest, null, "testuser");

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(100L);
        assertThat(response.getStatus()).isEqualTo(PaymentStatus.SUCCESS);
        assertThat(response.getGatewayReference()).isEqualTo("pg_tx_test_ref_01");
        assertThat(response.getAmount()).isEqualByComparingTo(new BigDecimal("150.00"));

        verify(attemptRepository, times(1)).save(any(PaymentAttempt.class));
        verify(auditService, atLeast(2)).recordAuditLog(any(), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("Should handle payment gateway decline correctly and set status to FAILED")
    void shouldHandleGatewayDeclineCorrectly() {
        when(idempotencyService.resolveIdempotencyKey(null, "idem_test_key_123")).thenReturn("idem_test_key_123");
        when(idempotencyService.checkIdempotency("idem_test_key_123", paymentRequest)).thenReturn(Optional.empty());
        when(customerRepository.findById(10L)).thenReturn(Optional.of(activeCustomer));

        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> {
            Payment p = invocation.getArgument(0);
            if (p.getId() == null) p.setId(101L);
            return p;
        });

        PaymentGatewayResult gatewayFailure = PaymentGatewayResult.failure("pg_tx_fail_01", "Card declined: Insufficient funds", 150);
        when(paymentGateway.processPayment(any(PaymentGatewayRequest.class))).thenReturn(gatewayFailure);
        when(paymentGateway.getGatewayProviderName()).thenReturn("MOCK_GATEWAY_V1");

        PaymentResponse response = paymentService.createAndProcessPayment(paymentRequest, null, "testuser");

        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo(PaymentStatus.FAILED);
        assertThat(response.getFailureReason()).isEqualTo("Card declined: Insufficient funds");
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when customer does not exist")
    void shouldThrowWhenCustomerNotFound() {
        when(idempotencyService.resolveIdempotencyKey(null, "idem_test_key_123")).thenReturn("idem_test_key_123");
        when(idempotencyService.checkIdempotency("idem_test_key_123", paymentRequest)).thenReturn(Optional.empty());
        when(customerRepository.findById(10L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> paymentService.createAndProcessPayment(paymentRequest, null, "testuser"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Customer not found");

        verify(paymentRepository, never()).save(any());
        verify(paymentGateway, never()).processPayment(any());
    }

    @Test
    @DisplayName("Should reject payment initiation for inactive customers")
    void shouldRejectPaymentForInactiveCustomer() {
        paymentRequest.setCustomerId(20L);
        when(idempotencyService.resolveIdempotencyKey(null, "idem_test_key_123")).thenReturn("idem_test_key_123");
        when(idempotencyService.checkIdempotency("idem_test_key_123", paymentRequest)).thenReturn(Optional.empty());
        when(customerRepository.findById(20L)).thenReturn(Optional.of(inactiveCustomer));

        assertThatThrownBy(() -> paymentService.createAndProcessPayment(paymentRequest, null, "testuser"))
                .isInstanceOf(InactiveCustomerException.class)
                .hasMessageContaining("Inactive customers cannot initiate payments");

        verify(paymentRepository, never()).save(any());
        verify(paymentGateway, never()).processPayment(any());
    }

    @Test
    @DisplayName("Should return existing payment without re-processing on idempotent replay")
    void shouldReturnExistingPaymentOnIdempotentReplay() {
        Payment existingPayment = new Payment(activeCustomer, new BigDecimal("150.00"), "USD", "Cloud Subscription",
                PaymentMethodType.MOCK_CARD, "idem_test_key_123");
        existingPayment.setId(200L);
        existingPayment.setStatus(PaymentStatus.SUCCESS);
        existingPayment.setGatewayReference("pg_tx_existing_200");

        when(idempotencyService.resolveIdempotencyKey(null, "idem_test_key_123")).thenReturn("idem_test_key_123");
        when(idempotencyService.checkIdempotency("idem_test_key_123", paymentRequest)).thenReturn(Optional.of(existingPayment));

        PaymentResponse response = paymentService.createAndProcessPayment(paymentRequest, null, "testuser");

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(200L);
        assertThat(response.getStatus()).isEqualTo(PaymentStatus.SUCCESS);
        assertThat(response.getGatewayReference()).isEqualTo("pg_tx_existing_200");

        // Verify gateway was NOT called again
        verify(paymentGateway, never()).processPayment(any());
    }

    @Test
    @DisplayName("Should retry an eligible FAILED payment")
    void shouldRetryFailedPayment() {
        Payment failedPayment = new Payment(activeCustomer, new BigDecimal("80.00"), "USD", "Book purchase",
                PaymentMethodType.MOCK_CARD, "idem_failed_01");
        failedPayment.setId(300L);
        failedPayment.setStatus(PaymentStatus.FAILED);
        failedPayment.setFailureReason("Timeout");

        when(paymentRepository.findById(300L)).thenReturn(Optional.of(failedPayment));
        when(attemptRepository.countByPaymentId(300L)).thenReturn(1L);
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PaymentGatewayResult retrySuccess = PaymentGatewayResult.success("pg_tx_retry_settled", 90);
        when(paymentGateway.processPayment(any(PaymentGatewayRequest.class))).thenReturn(retrySuccess);

        PaymentResponse response = paymentService.retryPayment(300L, "testuser");

        assertThat(response.getStatus()).isEqualTo(PaymentStatus.SUCCESS);
        assertThat(response.getGatewayReference()).isEqualTo("pg_tx_retry_settled");
        verify(attemptRepository, times(1)).save(any(PaymentAttempt.class));
    }

    @Test
    @DisplayName("Should reject retry when payment is not in FAILED state")
    void shouldRejectRetryOnNonFailedPayment() {
        Payment successPayment = new Payment(activeCustomer, new BigDecimal("80.00"), "USD", "Book purchase",
                PaymentMethodType.MOCK_CARD, "idem_success_01");
        successPayment.setId(301L);
        successPayment.setStatus(PaymentStatus.SUCCESS);

        when(paymentRepository.findById(301L)).thenReturn(Optional.of(successPayment));

        assertThatThrownBy(() -> paymentService.retryPayment(301L, "testuser"))
                .isInstanceOf(InvalidPaymentStateException.class)
                .hasMessageContaining("Only FAILED payments can be retried");

        verify(paymentGateway, never()).processPayment(any());
    }

    @Test
    @DisplayName("Should cancel eligible PENDING payment")
    void shouldCancelPendingPayment() {
        Payment pendingPayment = new Payment(activeCustomer, new BigDecimal("50.00"), "USD", "Order",
                PaymentMethodType.MOCK_CARD, "idem_pending_01");
        pendingPayment.setId(400L);
        pendingPayment.setStatus(PaymentStatus.PENDING);

        when(paymentRepository.findById(400L)).thenReturn(Optional.of(pendingPayment));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PaymentResponse response = paymentService.cancelPayment(400L, "testuser");

        assertThat(response.getStatus()).isEqualTo(PaymentStatus.CANCELLED);
    }

    @Test
    @DisplayName("Should reject cancellation of SUCCESS payment")
    void shouldRejectCancellationOfSuccessPayment() {
        Payment successPayment = new Payment(activeCustomer, new BigDecimal("50.00"), "USD", "Order",
                PaymentMethodType.MOCK_CARD, "idem_success_400");
        successPayment.setId(401L);
        successPayment.setStatus(PaymentStatus.SUCCESS);

        when(paymentRepository.findById(401L)).thenReturn(Optional.of(successPayment));

        assertThatThrownBy(() -> paymentService.cancelPayment(401L, "testuser"))
                .isInstanceOf(InvalidPaymentStateException.class)
                .hasMessageContaining("Only CREATED or PENDING payments can be cancelled");
    }
}
