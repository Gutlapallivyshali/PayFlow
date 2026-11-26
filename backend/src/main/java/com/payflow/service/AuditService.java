package com.payflow.service;

import com.payflow.dto.response.PaymentAuditLogResponse;
import com.payflow.entity.Payment;
import com.payflow.entity.PaymentAuditLog;
import com.payflow.enums.AuditEventType;
import com.payflow.enums.PaymentStatus;
import com.payflow.repository.PaymentAuditLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditService.class);

    private final PaymentAuditLogRepository auditLogRepository;

    public AuditService(PaymentAuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional(propagation = Propagation.REQUIRED)
    public PaymentAuditLog recordAuditLog(Payment payment, AuditEventType eventType,
                                          PaymentStatus previousStatus, PaymentStatus newStatus,
                                          String description, String username) {
        PaymentAuditLog auditLog = new PaymentAuditLog(
                payment,
                eventType,
                previousStatus,
                newStatus,
                description,
                username != null ? username : "SYSTEM"
        );
        PaymentAuditLog saved = auditLogRepository.save(auditLog);
        log.debug("Recorded audit log [{}] for payment ID [{}]: {}", eventType, payment.getId(), description);
        return saved;
    }

    @Transactional(readOnly = true)
    public List<PaymentAuditLogResponse> getPaymentAuditHistory(Long paymentId) {
        return auditLogRepository.findByPaymentIdOrderByCreatedAtDesc(paymentId)
                .stream()
                .map(PaymentAuditLogResponse::fromEntity)
                .collect(Collectors.toList());
    }
}
