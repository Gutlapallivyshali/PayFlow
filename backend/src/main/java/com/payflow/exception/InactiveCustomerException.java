package com.payflow.exception;

public class InactiveCustomerException extends RuntimeException {
    private final Long customerId;

    public InactiveCustomerException(Long customerId, String message) {
        super(message);
        this.customerId = customerId;
    }

    public Long getCustomerId() {
        return customerId;
    }
}
