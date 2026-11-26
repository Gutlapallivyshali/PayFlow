package com.payflow.paymentgateway;

import com.payflow.enums.PaymentMethodType;
import java.math.BigDecimal;

public class PaymentGatewayRequest {
    private Long paymentId;
    private Long customerId;
    private String customerEmail;
    private BigDecimal amount;
    private String currency;
    private PaymentMethodType paymentMethod;
    private String idempotencyKey;

    public PaymentGatewayRequest() {
    }

    public PaymentGatewayRequest(Long paymentId, Long customerId, String customerEmail,
                                 BigDecimal amount, String currency, PaymentMethodType paymentMethod,
                                 String idempotencyKey) {
        this.paymentId = paymentId;
        this.customerId = customerId;
        this.customerEmail = customerEmail;
        this.amount = amount;
        this.currency = currency;
        this.paymentMethod = paymentMethod;
        this.idempotencyKey = idempotencyKey;
    }

    public Long getPaymentId() {
        return paymentId;
    }

    public void setPaymentId(Long paymentId) {
        this.paymentId = paymentId;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public String getCustomerEmail() {
        return customerEmail;
    }

    public void setCustomerEmail(String customerEmail) {
        this.customerEmail = customerEmail;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public PaymentMethodType getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(PaymentMethodType paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getIdempotencyKey() {
        return idempotencyKey;
    }

    public void setIdempotencyKey(String idempotencyKey) {
        this.idempotencyKey = idempotencyKey;
    }
}
