package com.payflow.dto.response;

import java.math.BigDecimal;

public class DashboardSummaryResponse {
    private long totalCustomers;
    private long totalPayments;
    private long successfulPayments;
    private long failedPayments;
    private long pendingPayments;
    private long cancelledPayments;
    private BigDecimal totalVolume;
    private double successRate;
    private BigDecimal averageAmount;

    public DashboardSummaryResponse() {
        this.totalVolume = BigDecimal.ZERO;
        this.averageAmount = BigDecimal.ZERO;
    }

    public DashboardSummaryResponse(long totalCustomers, long totalPayments, long successfulPayments,
                                    long failedPayments, long pendingPayments, long cancelledPayments,
                                    BigDecimal totalVolume, double successRate, BigDecimal averageAmount) {
        this.totalCustomers = totalCustomers;
        this.totalPayments = totalPayments;
        this.successfulPayments = successfulPayments;
        this.failedPayments = failedPayments;
        this.pendingPayments = pendingPayments;
        this.cancelledPayments = cancelledPayments;
        this.totalVolume = totalVolume != null ? totalVolume : BigDecimal.ZERO;
        this.successRate = successRate;
        this.averageAmount = averageAmount != null ? averageAmount : BigDecimal.ZERO;
    }

    public long getTotalCustomers() {
        return totalCustomers;
    }

    public void setTotalCustomers(long totalCustomers) {
        this.totalCustomers = totalCustomers;
    }

    public long getTotalPayments() {
        return totalPayments;
    }

    public void setTotalPayments(long totalPayments) {
        this.totalPayments = totalPayments;
    }

    public long getSuccessfulPayments() {
        return successfulPayments;
    }

    public void setSuccessfulPayments(long successfulPayments) {
        this.successfulPayments = successfulPayments;
    }

    public long getFailedPayments() {
        return failedPayments;
    }

    public void setFailedPayments(long failedPayments) {
        this.failedPayments = failedPayments;
    }

    public long getPendingPayments() {
        return pendingPayments;
    }

    public void setPendingPayments(long pendingPayments) {
        this.pendingPayments = pendingPayments;
    }

    public long getCancelledPayments() {
        return cancelledPayments;
    }

    public void setCancelledPayments(long cancelledPayments) {
        this.cancelledPayments = cancelledPayments;
    }

    public BigDecimal getTotalVolume() {
        return totalVolume;
    }

    public void setTotalVolume(BigDecimal totalVolume) {
        this.totalVolume = totalVolume;
    }

    public double getSuccessRate() {
        return successRate;
    }

    public void setSuccessRate(double successRate) {
        this.successRate = successRate;
    }

    public BigDecimal getAverageAmount() {
        return averageAmount;
    }

    public void setAverageAmount(BigDecimal averageAmount) {
        this.averageAmount = averageAmount;
    }
}
