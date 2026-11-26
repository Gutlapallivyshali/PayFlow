package com.payflow.dto.request;

import com.payflow.enums.PaymentMethodType;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public class CreatePaymentRequest {

    @NotNull(message = "Customer ID is required")
    private Long customerId;

    @NotNull(message = "Payment amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
    @Digits(integer = 12, fraction = 2, message = "Amount format must have at most 12 integer digits and 2 decimals")
    private BigDecimal amount;

    @NotBlank(message = "Currency code is required")
    @Pattern(regexp = "^[A-Za-z]{3}$", message = "Currency must be a valid 3-letter ISO code (e.g. USD, EUR, INR, GBP)")
    private String currency = "USD";

    @Size(max = 255, message = "Description cannot exceed 255 characters")
    private String description;

    @NotNull(message = "Payment method is required")
    private PaymentMethodType paymentMethod;

    @Size(max = 128, message = "Idempotency key cannot exceed 128 characters")
    private String idempotencyKey;

    public CreatePaymentRequest() {
    }

    public CreatePaymentRequest(Long customerId, BigDecimal amount, String currency, String description,
                                PaymentMethodType paymentMethod, String idempotencyKey) {
        this.customerId = customerId;
        this.amount = amount;
        this.currency = currency;
        this.description = description;
        this.paymentMethod = paymentMethod;
        this.idempotencyKey = idempotencyKey;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
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
