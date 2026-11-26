package com.payflow.service;

import com.payflow.dto.response.DashboardSummaryResponse;
import com.payflow.entity.Customer;
import com.payflow.entity.Payment;
import com.payflow.enums.CustomerStatus;
import com.payflow.enums.PaymentMethodType;
import com.payflow.enums.PaymentStatus;
import com.payflow.repository.CustomerRepository;
import com.payflow.repository.PaymentRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @InjectMocks
    private DashboardService dashboardService;

    @Test
    @DisplayName("Should accurately calculate dashboard metrics and success rate")
    void shouldCalculateSummaryMetricsAccurately() {
        when(customerRepository.count()).thenReturn(10L);
        when(paymentRepository.count()).thenReturn(20L);
        when(paymentRepository.countByStatus(PaymentStatus.SUCCESS)).thenReturn(16L);
        when(paymentRepository.countByStatus(PaymentStatus.FAILED)).thenReturn(3L);
        when(paymentRepository.countByStatus(PaymentStatus.PENDING)).thenReturn(1L);
        when(paymentRepository.countByStatus(PaymentStatus.CANCELLED)).thenReturn(0L);

        when(paymentRepository.sumAmountByStatus(PaymentStatus.SUCCESS)).thenReturn(new BigDecimal("3200.00"));
        when(paymentRepository.avgAmountByStatus(PaymentStatus.SUCCESS)).thenReturn(new BigDecimal("200.00"));

        DashboardSummaryResponse summary = dashboardService.getSummary();

        assertThat(summary.getTotalCustomers()).isEqualTo(10L);
        assertThat(summary.getTotalPayments()).isEqualTo(20L);
        assertThat(summary.getSuccessfulPayments()).isEqualTo(16L);
        assertThat(summary.getFailedPayments()).isEqualTo(3L);
        assertThat(summary.getPendingPayments()).isEqualTo(1L);
        assertThat(summary.getSuccessRate()).isEqualTo(80.0);
        assertThat(summary.getTotalVolume()).isEqualByComparingTo(new BigDecimal("3200.00"));
        assertThat(summary.getAverageAmount()).isEqualByComparingTo(new BigDecimal("200.00"));
    }

    @Test
    @DisplayName("Should return recent payments")
    void shouldReturnRecentPayments() {
        Customer customer = new Customer("Test", "test@test.com", "123", CustomerStatus.ACTIVE);
        Payment payment = new Payment(customer, new BigDecimal("100.00"), "USD", "test", PaymentMethodType.MOCK_CARD, "k1");
        payment.setId(1L);

        when(paymentRepository.findTop10ByOrderByCreatedAtDesc()).thenReturn(List.of(payment));

        var recent = dashboardService.getRecentPayments();
        assertThat(recent).hasSize(1);
        assertThat(recent.get(0).getId()).isEqualTo(1L);
    }
}
