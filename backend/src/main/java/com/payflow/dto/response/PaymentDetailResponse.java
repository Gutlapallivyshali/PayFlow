package com.payflow.dto.response;

import java.util.List;

public class PaymentDetailResponse {
    private PaymentResponse payment;
    private List<PaymentAttemptResponse> attempts;
    private List<PaymentAuditLogResponse> history;

    public PaymentDetailResponse() {
    }

    public PaymentDetailResponse(PaymentResponse payment, List<PaymentAttemptResponse> attempts, List<PaymentAuditLogResponse> history) {
        this.payment = payment;
        this.attempts = attempts;
        this.history = history;
    }

    public PaymentResponse getPayment() {
        return payment;
    }

    public void setPayment(PaymentResponse payment) {
        this.payment = payment;
    }

    public List<PaymentAttemptResponse> getAttempts() {
        return attempts;
    }

    public void setAttempts(List<PaymentAttemptResponse> attempts) {
        this.attempts = attempts;
    }

    public List<PaymentAuditLogResponse> getHistory() {
        return history;
    }

    public void setHistory(List<PaymentAuditLogResponse> history) {
        this.history = history;
    }
}
