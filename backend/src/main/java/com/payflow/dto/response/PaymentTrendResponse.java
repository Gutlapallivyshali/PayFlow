package com.payflow.dto.response;

import java.math.BigDecimal;

public class PaymentTrendResponse {
    private String date;
    private long totalCount;
    private long successCount;
    private long failedCount;
    private BigDecimal volume;

    public PaymentTrendResponse() {
        this.volume = BigDecimal.ZERO;
    }

    public PaymentTrendResponse(String date, long totalCount, long successCount, long failedCount, BigDecimal volume) {
        this.date = date;
        this.totalCount = totalCount;
        this.successCount = successCount;
        this.failedCount = failedCount;
        this.volume = volume != null ? volume : BigDecimal.ZERO;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public long getTotalCount() {
        return totalCount;
    }

    public void setTotalCount(long totalCount) {
        this.totalCount = totalCount;
    }

    public long getSuccessCount() {
        return successCount;
    }

    public void setSuccessCount(long successCount) {
        this.successCount = successCount;
    }

    public long getFailedCount() {
        return failedCount;
    }

    public void setFailedCount(long failedCount) {
        this.failedCount = failedCount;
    }

    public BigDecimal getVolume() {
        return volume;
    }

    public void setVolume(BigDecimal volume) {
        this.volume = volume;
    }
}
