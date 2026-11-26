package com.payflow.exception;

import com.payflow.enums.PaymentStatus;

public class InvalidPaymentStateException extends RuntimeException {
    private final PaymentStatus currentStatus;
    private final PaymentStatus targetStatus;

    public InvalidPaymentStateException(PaymentStatus currentStatus, PaymentStatus targetStatus, String message) {
        super(message);
        this.currentStatus = currentStatus;
        this.targetStatus = targetStatus;
    }

    public PaymentStatus getCurrentStatus() {
        return currentStatus;
    }

    public PaymentStatus getTargetStatus() {
        return targetStatus;
    }
}
