package com.payflow.service;

import com.payflow.dto.response.DashboardSummaryResponse;
import com.payflow.dto.response.PaymentResponse;
import com.payflow.dto.response.PaymentTrendResponse;
import com.payflow.entity.Payment;
import com.payflow.enums.PaymentStatus;
import com.payflow.repository.CustomerRepository;
import com.payflow.repository.PaymentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final CustomerRepository customerRepository;
    private final PaymentRepository paymentRepository;

    public DashboardService(CustomerRepository customerRepository, PaymentRepository paymentRepository) {
        this.customerRepository = customerRepository;
        this.paymentRepository = paymentRepository;
    }

    @Transactional(readOnly = true)
    public DashboardSummaryResponse getSummary() {
        long totalCustomers = customerRepository.count();
        long totalPayments = paymentRepository.count();
        long successful = paymentRepository.countByStatus(PaymentStatus.SUCCESS);
        long failed = paymentRepository.countByStatus(PaymentStatus.FAILED);
        long pending = paymentRepository.countByStatus(PaymentStatus.PENDING);
        long cancelled = paymentRepository.countByStatus(PaymentStatus.CANCELLED);

        BigDecimal totalVolume = paymentRepository.sumAmountByStatus(PaymentStatus.SUCCESS);
        if (totalVolume == null) {
            totalVolume = BigDecimal.ZERO;
        }

        BigDecimal avgAmount = paymentRepository.avgAmountByStatus(PaymentStatus.SUCCESS);
        if (avgAmount == null) {
            avgAmount = BigDecimal.ZERO;
        } else {
            avgAmount = avgAmount.setScale(2, RoundingMode.HALF_UP);
        }

        double successRate = 0.0;
        if (totalPayments > 0) {
            successRate = Math.round(((double) successful / (double) totalPayments) * 10000.0) / 100.0;
        }

        return new DashboardSummaryResponse(
                totalCustomers,
                totalPayments,
                successful,
                failed,
                pending,
                cancelled,
                totalVolume.setScale(2, RoundingMode.HALF_UP),
                successRate,
                avgAmount
        );
    }

    @Transactional(readOnly = true)
    public List<PaymentTrendResponse> getPaymentTrends(int days) {
        int trendDays = (days <= 0 || days > 90) ? 7 : days;
        LocalDate startDate = LocalDate.now().minusDays(trendDays - 1);
        LocalDateTime startDateTime = startDate.atStartOfDay();

        List<Payment> recentPayments = paymentRepository.findPaymentsSince(startDateTime);

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        // Pre-populate all days in the range with zeros
        Map<String, TrendAccumulator> map = new LinkedHashMap<>();
        for (int i = 0; i < trendDays; i++) {
            String dateKey = startDate.plusDays(i).format(formatter);
            map.put(dateKey, new TrendAccumulator(dateKey));
        }

        // Aggregate actual transactions
        for (Payment p : recentPayments) {
            String dateKey = p.getCreatedAt().toLocalDate().format(formatter);
            TrendAccumulator acc = map.get(dateKey);
            if (acc != null) {
                acc.totalCount++;
                if (p.getStatus() == PaymentStatus.SUCCESS) {
                    acc.successCount++;
                    acc.volume = acc.volume.add(p.getAmount());
                } else if (p.getStatus() == PaymentStatus.FAILED) {
                    acc.failedCount++;
                }
            }
        }

        return map.values().stream()
                .map(a -> new PaymentTrendResponse(a.date, a.totalCount, a.successCount, a.failedCount, a.volume.setScale(2, RoundingMode.HALF_UP)))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> getRecentPayments() {
        return paymentRepository.findTop10ByOrderByCreatedAtDesc()
                .stream()
                .map(PaymentResponse::fromEntity)
                .collect(Collectors.toList());
    }

    private static class TrendAccumulator {
        String date;
        long totalCount = 0;
        long successCount = 0;
        long failedCount = 0;
        BigDecimal volume = BigDecimal.ZERO;

        TrendAccumulator(String date) {
            this.date = date;
        }
    }
}
