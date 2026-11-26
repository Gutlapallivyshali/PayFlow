package com.payflow.paymentgateway;

public class PaymentGatewayResult {
    private boolean successful;
    private String gatewayReference;
    private String failureReason;
    private long latencyMs;

    public PaymentGatewayResult() {
    }

    public PaymentGatewayResult(boolean successful, String gatewayReference, String failureReason, long latencyMs) {
        this.successful = successful;
        this.gatewayReference = gatewayReference;
        this.failureReason = failureReason;
        this.latencyMs = latencyMs;
    }

    public static PaymentGatewayResult success(String gatewayReference, long latencyMs) {
        return new PaymentGatewayResult(true, gatewayReference, null, latencyMs);
    }

    public static PaymentGatewayResult failure(String gatewayReference, String failureReason, long latencyMs) {
        return new PaymentGatewayResult(false, gatewayReference, failureReason, latencyMs);
    }

    public boolean isSuccessful() {
        return successful;
    }

    public void setSuccessful(boolean successful) {
        this.successful = successful;
    }

    public String getGatewayReference() {
        return gatewayReference;
    }

    public void setGatewayReference(String gatewayReference) {
        this.gatewayReference = gatewayReference;
    }

    public String getFailureReason() {
        return failureReason;
    }

    public void setFailureReason(String failureReason) {
        this.failureReason = failureReason;
    }

    public long getLatencyMs() {
        return latencyMs;
    }

    public void setLatencyMs(long latencyMs) {
        this.latencyMs = latencyMs;
    }
}
