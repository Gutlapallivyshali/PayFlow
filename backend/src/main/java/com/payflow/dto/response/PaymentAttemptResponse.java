package com.payflow.dto.response;

import com.payflow.entity.PaymentAttempt;
import com.payflow.enums.PaymentStatus;
import java.time.LocalDateTime;

public class PaymentAttemptResponse {
    private Long id;
    private Long paymentId;
    private Integer attemptNumber;
    private String gatewayReference;
    private PaymentStatus status;
    private String failureReason;
    private Long latencyMs;
    private LocalDateTime createdAt;

    public PaymentAttemptResponse() {
    }

    public static PaymentAttemptResponse fromEntity(PaymentAttempt attempt) {
        if (attempt == null) return null;
        PaymentAttemptResponse dto = new PaymentAttemptResponse();
        dto.setId(attempt.getId());
        if (attempt.getPayment() != null) {
            dto.setPaymentId(attempt.getPayment().getId());
        }
        dto.setAttemptNumber(attempt.getAttemptNumber());
        dto.setGatewayReference(attempt.getGatewayReference());
        dto.setStatus(attempt.getStatus());
        dto.setFailureReason(attempt.getFailureReason());
        dto.setLatencyMs(attempt.getLatencyMs());
        dto.setCreatedAt(attempt.getCreatedAt());
        return dto;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getPaymentId() {
        return paymentId;
    }

    public void setPaymentId(Long paymentId) {
        this.paymentId = paymentId;
    }

    public Integer getAttemptNumber() {
        return attemptNumber;
    }

    public void setAttemptNumber(Integer attemptNumber) {
        this.attemptNumber = attemptNumber;
    }

    public String getGatewayReference() {
        return gatewayReference;
    }

    public void setGatewayReference(String gatewayReference) {
        this.gatewayReference = gatewayReference;
    }

    public PaymentStatus getStatus() {
        return status;
    }

    public void setStatus(PaymentStatus status) {
        this.status = status;
    }

    public String getFailureReason() {
        return failureReason;
    }

    public void setFailureReason(String failureReason) {
        this.failureReason = failureReason;
    }

    public Long getLatencyMs() {
        return latencyMs;
    }

    public void setLatencyMs(Long latencyMs) {
        this.latencyMs = latencyMs;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
