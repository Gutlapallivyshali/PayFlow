package com.payflow.service;

import com.payflow.dto.request.CreatePaymentRequest;
import com.payflow.entity.Payment;
import com.payflow.exception.IdempotencyConflictException;
import com.payflow.repository.PaymentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

@Service
public class IdempotencyService {

    private static final Logger log = LoggerFactory.getLogger(IdempotencyService.class);

    private final PaymentRepository paymentRepository;

    public IdempotencyService(PaymentRepository paymentRepository) {
        this.paymentRepository = paymentRepository;
    }

    /**
     * Resolves or generates the idempotency key for the request.
     */
    public String resolveIdempotencyKey(String headerKey, String bodyKey) {
        if (headerKey != null && !headerKey.trim().isEmpty()) {
            return headerKey.trim();
        }
        if (bodyKey != null && !bodyKey.trim().isEmpty()) {
            return bodyKey.trim();
        }
        return "idem_auto_" + UUID.randomUUID().toString().replace("-", "");
    }

    /**
     * Checks if a payment with the given idempotency key exists and verifies payload consistency.
     *
     * @param idempotencyKey The unique key
     * @param request The current creation request
     * @return Optional containing existing payment if safely matched, or empty if key is new
     * @throws IdempotencyConflictException if key exists but payload parameters differ
     */
    @Transactional(readOnly = true)
    public Optional<Payment> checkIdempotency(String idempotencyKey, CreatePaymentRequest request) {
        Optional<Payment> existingOpt = paymentRepository.findByIdempotencyKey(idempotencyKey);
        if (existingOpt.isEmpty()) {
            return Optional.empty();
        }

        Payment existing = existingOpt.get();
        log.info("Idempotency key [{}] already exists for Payment ID [{}]. Validating request integrity.",
                idempotencyKey, existing.getId());

        // Verify request payload matches the existing record
        boolean customerMatch = existing.getCustomer().getId().equals(request.getCustomerId());
        boolean amountMatch = existing.getAmount().compareTo(request.getAmount()) == 0;
        boolean currencyMatch = existing.getCurrency().equalsIgnoreCase(request.getCurrency().trim());
        boolean methodMatch = existing.getPaymentMethod() == request.getPaymentMethod();

        if (!customerMatch || !amountMatch || !currencyMatch || !methodMatch) {
            String conflictDetails = String.format(
                    "Idempotency key '%s' was previously used with parameters: [customerId=%d, amount=%s %s, method=%s], but received: [customerId=%d, amount=%s %s, method=%s].",
                    idempotencyKey,
                    existing.getCustomer().getId(), existing.getAmount(), existing.getCurrency(), existing.getPaymentMethod(),
                    request.getCustomerId(), request.getAmount(), request.getCurrency(), request.getPaymentMethod()
            );
            log.error("Idempotency conflict detected: {}", conflictDetails);
            throw new IdempotencyConflictException(idempotencyKey, conflictDetails);
        }

        log.info("Idempotent replay confirmed for key [{}]. Returning existing Payment ID [{}] in status [{}]",
                idempotencyKey, existing.getId(), existing.getStatus());
        return Optional.of(existing);
    }
}
