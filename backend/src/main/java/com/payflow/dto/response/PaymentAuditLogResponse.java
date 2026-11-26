package com.payflow.dto.response;

import com.payflow.entity.PaymentAuditLog;
import com.payflow.enums.AuditEventType;
import com.payflow.enums.PaymentStatus;
import java.time.LocalDateTime;

public class PaymentAuditLogResponse {
    private Long id;
    private Long paymentId;
    private AuditEventType eventType;
    private PaymentStatus previousStatus;
    private PaymentStatus newStatus;
    private String eventDescription;
    private String createdBy;
    private LocalDateTime createdAt;

    public PaymentAuditLogResponse() {
    }

    public static PaymentAuditLogResponse fromEntity(PaymentAuditLog log) {
        if (log == null) return null;
        PaymentAuditLogResponse dto = new PaymentAuditLogResponse();
        dto.setId(log.getId());
        if (log.getPayment() != null) {
            dto.setPaymentId(log.getPayment().getId());
        }
        dto.setEventType(log.getEventType());
        dto.setPreviousStatus(log.getPreviousStatus());
        dto.setNewStatus(log.getNewStatus());
        dto.setEventDescription(log.getEventDescription());
        dto.setCreatedBy(log.getCreatedBy());
        dto.setCreatedAt(log.getCreatedAt());
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

    public AuditEventType getEventType() {
        return eventType;
    }

    public void setEventType(AuditEventType eventType) {
        this.eventType = eventType;
    }

    public PaymentStatus getPreviousStatus() {
        return previousStatus;
    }

    public void setPreviousStatus(PaymentStatus previousStatus) {
        this.previousStatus = previousStatus;
    }

    public PaymentStatus getNewStatus() {
        return newStatus;
    }

    public void setNewStatus(PaymentStatus newStatus) {
        this.newStatus = newStatus;
    }

    public String getEventDescription() {
        return eventDescription;
    }

    public void setEventDescription(String eventDescription) {
        this.eventDescription = eventDescription;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
