package com.payflow.service;

import com.payflow.dto.request.CreatePaymentRequest;
import com.payflow.dto.response.*;
import com.payflow.entity.*;
import com.payflow.enums.*;
import com.payflow.exception.*;
import com.payflow.paymentgateway.*;
import com.payflow.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

    private final PaymentRepository paymentRepository;
    private final CustomerRepository customerRepository;
    private final PaymentAttemptRepository attemptRepository;
    private final PaymentGateway paymentGateway;
    private final IdempotencyService idempotencyService;
    private final AuditService auditService;

    public PaymentService(PaymentRepository paymentRepository,
                          CustomerRepository customerRepository,
                          PaymentAttemptRepository attemptRepository,
                          PaymentGateway paymentGateway,
                          IdempotencyService idempotencyService,
                          AuditService auditService) {
        this.paymentRepository = paymentRepository;
        this.customerRepository = customerRepository;
        this.attemptRepository = attemptRepository;
        this.paymentGateway = paymentGateway;
        this.idempotencyService = idempotencyService;
        this.auditService = auditService;
    }

    /**
     * Creates and executes a payment with idempotency protection and atomic state transitions.
     */
    @Transactional
    public PaymentResponse createAndProcessPayment(CreatePaymentRequest request, String idempotencyHeader, String username) {
        String idempotencyKey = idempotencyService.resolveIdempotencyKey(idempotencyHeader, request.getIdempotencyKey());
        request.setIdempotencyKey(idempotencyKey);

        // 1. Check Idempotency
        Optional<Payment> existingPayment = idempotencyService.checkIdempotency(idempotencyKey, request);
        if (existingPayment.isPresent()) {
            return PaymentResponse.fromEntity(existingPayment.get());
        }

        // 2. Validate Customer Existence and Active Status
        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with ID: " + request.getCustomerId()));

        if (!customer.isActive()) {
            throw new InactiveCustomerException(customer.getId(),
                    "Customer account is currently " + customer.getStatus() + ". Inactive customers cannot initiate payments.");
        }

        // 3. Initialize Payment Record (Status: CREATED)
        Payment payment = new Payment(
                customer,
                request.getAmount(),
                request.getCurrency(),
                request.getDescription(),
                request.getPaymentMethod(),
                idempotencyKey
        );
        payment.setStatus(PaymentStatus.CREATED);
        Payment savedPayment = paymentRepository.save(payment);

        auditService.recordAuditLog(
                savedPayment,
                AuditEventType.PAYMENT_CREATED,
                null,
                PaymentStatus.CREATED,
                "Payment initiated with idempotency key [" + idempotencyKey + "]",
                username
        );

        // 4. Transition to PENDING for execution
        savedPayment.setStatus(PaymentStatus.PENDING);
        savedPayment = paymentRepository.save(savedPayment);

        auditService.recordAuditLog(
                savedPayment,
                AuditEventType.PAYMENT_PROCESSING_STARTED,
                PaymentStatus.CREATED,
                PaymentStatus.PENDING,
                "Payment dispatched to gateway engine [" + paymentGateway.getGatewayProviderName() + "]",
                username
        );

        // 5. Execute Gateway Call
        PaymentGatewayRequest gatewayRequest = new PaymentGatewayRequest(
                savedPayment.getId(),
                customer.getId(),
                customer.getEmail(),
                savedPayment.getAmount(),
                savedPayment.getCurrency(),
                savedPayment.getPaymentMethod(),
                idempotencyKey
        );

        PaymentGatewayResult result = paymentGateway.processPayment(gatewayRequest);

        // 6. Record Gateway Attempt
        PaymentAttempt attempt = new PaymentAttempt(
                savedPayment,
                1,
                result.getGatewayReference(),
                result.isSuccessful() ? PaymentStatus.SUCCESS : PaymentStatus.FAILED,
                result.getFailureReason(),
                result.getLatencyMs()
        );
        attemptRepository.save(attempt);

        // 7. Update Payment Entity and Final Audit Log
        if (result.isSuccessful()) {
            savedPayment.setStatus(PaymentStatus.SUCCESS);
            savedPayment.setGatewayReference(result.getGatewayReference());
            savedPayment.setFailureReason(null);
            savedPayment = paymentRepository.save(savedPayment);

            auditService.recordAuditLog(
                    savedPayment,
                    AuditEventType.PAYMENT_SUCCEEDED,
                    PaymentStatus.PENDING,
                    PaymentStatus.SUCCESS,
                    "Payment settled successfully. Gateway Ref: " + result.getGatewayReference(),
                    username
            );
        } else {
            savedPayment.setStatus(PaymentStatus.FAILED);
            savedPayment.setGatewayReference(result.getGatewayReference());
            savedPayment.setFailureReason(result.getFailureReason());
            savedPayment = paymentRepository.save(savedPayment);

            auditService.recordAuditLog(
                    savedPayment,
                    AuditEventType.PAYMENT_FAILED,
                    PaymentStatus.PENDING,
                    PaymentStatus.FAILED,
                    "Payment declined by gateway: " + result.getFailureReason(),
                    username
            );
        }

        return PaymentResponse.fromEntity(savedPayment);
    }

    @Transactional(readOnly = true)
    public PaymentResponse getPaymentById(Long id) {
        Payment payment = findPaymentOrThrow(id);
        return PaymentResponse.fromEntity(payment);
    }

    @Transactional(readOnly = true)
    public PaymentDetailResponse getPaymentDetailById(Long id) {
        Payment payment = findPaymentOrThrow(id);
        PaymentResponse paymentResponse = PaymentResponse.fromEntity(payment);

        List<PaymentAttemptResponse> attempts = attemptRepository.findByPaymentIdOrderByAttemptNumberAsc(id)
                .stream()
                .map(PaymentAttemptResponse::fromEntity)
                .collect(Collectors.toList());

        List<PaymentAuditLogResponse> history = auditService.getPaymentAuditHistory(id);

        return new PaymentDetailResponse(paymentResponse, attempts, history);
    }

    @Transactional(readOnly = true)
    public PageResponse<PaymentResponse> getAllPayments(String keyword, PaymentStatus status,
                                                        LocalDate startDate, LocalDate endDate,
                                                        Pageable pageable) {
        String cleanKeyword = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;
        LocalDateTime startDateTime = startDate != null ? startDate.atStartOfDay() : null;
        LocalDateTime endDateTime = endDate != null ? endDate.atTime(LocalTime.MAX) : null;

        Page<Payment> page = paymentRepository.searchPayments(cleanKeyword, status, startDateTime, endDateTime, pageable);
        return PageResponse.fromPage(page, PaymentResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public PageResponse<PaymentResponse> getCustomerPayments(Long customerId, Pageable pageable) {
        if (!customerRepository.existsById(customerId)) {
            throw new ResourceNotFoundException("Customer not found with ID: " + customerId);
        }
        Page<Payment> page = paymentRepository.findByCustomerId(customerId, pageable);
        return PageResponse.fromPage(page, PaymentResponse::fromEntity);
    }

    /**
     * Retries a previously failed payment.
     */
    @Transactional
    public PaymentResponse retryPayment(Long id, String username) {
        Payment payment = findPaymentOrThrow(id);

        if (payment.getStatus() != PaymentStatus.FAILED) {
            throw new InvalidPaymentStateException(
                    payment.getStatus(),
                    PaymentStatus.PENDING,
                    "Only FAILED payments can be retried. Current status is " + payment.getStatus()
            );
        }

        Customer customer = payment.getCustomer();
        if (!customer.isActive()) {
            throw new InactiveCustomerException(customer.getId(),
                    "Cannot retry payment: Customer account is " + customer.getStatus() + ".");
        }

        long existingAttempts = attemptRepository.countByPaymentId(id);
        int nextAttemptNumber = (int) existingAttempts + 1;

        // Transition FAILED -> PENDING
        payment.setStatus(PaymentStatus.PENDING);
        payment = paymentRepository.save(payment);

        auditService.recordAuditLog(
                payment,
                AuditEventType.PAYMENT_RETRIED,
                PaymentStatus.FAILED,
                PaymentStatus.PENDING,
                "Retry attempt #" + nextAttemptNumber + " triggered by " + (username != null ? username : "user"),
                username
        );

        PaymentGatewayRequest gatewayRequest = new PaymentGatewayRequest(
                payment.getId(),
                customer.getId(),
                customer.getEmail(),
                payment.getAmount(),
                payment.getCurrency(),
                payment.getPaymentMethod(),
                payment.getIdempotencyKey() + "_retry" + nextAttemptNumber
        );

        PaymentGatewayResult result = paymentGateway.processPayment(gatewayRequest);

        PaymentAttempt attempt = new PaymentAttempt(
                payment,
                nextAttemptNumber,
                result.getGatewayReference(),
                result.isSuccessful() ? PaymentStatus.SUCCESS : PaymentStatus.FAILED,
                result.getFailureReason(),
                result.getLatencyMs()
        );
        attemptRepository.save(attempt);

        if (result.isSuccessful()) {
            payment.setStatus(PaymentStatus.SUCCESS);
            payment.setGatewayReference(result.getGatewayReference());
            payment.setFailureReason(null);
            payment = paymentRepository.save(payment);

            auditService.recordAuditLog(
                    payment,
                    AuditEventType.PAYMENT_SUCCEEDED,
                    PaymentStatus.PENDING,
                    PaymentStatus.SUCCESS,
                    "Retry attempt #" + nextAttemptNumber + " settled successfully. Ref: " + result.getGatewayReference(),
                    username
            );
        } else {
            payment.setStatus(PaymentStatus.FAILED);
            payment.setGatewayReference(result.getGatewayReference());
            payment.setFailureReason(result.getFailureReason());
            payment = paymentRepository.save(payment);

            auditService.recordAuditLog(
                    payment,
                    AuditEventType.PAYMENT_FAILED,
                    PaymentStatus.PENDING,
                    PaymentStatus.FAILED,
                    "Retry attempt #" + nextAttemptNumber + " declined: " + result.getFailureReason(),
                    username
            );
        }

        return PaymentResponse.fromEntity(payment);
    }

    /**
     * Cancels an eligible pending or created payment.
     */
    @Transactional
    public PaymentResponse cancelPayment(Long id, String username) {
        Payment payment = findPaymentOrThrow(id);

        if (payment.getStatus() != PaymentStatus.PENDING && payment.getStatus() != PaymentStatus.CREATED) {
            throw new InvalidPaymentStateException(
                    payment.getStatus(),
                    PaymentStatus.CANCELLED,
                    "Only CREATED or PENDING payments can be cancelled. Current status is " + payment.getStatus()
            );
        }

        PaymentStatus previousStatus = payment.getStatus();
        payment.setStatus(PaymentStatus.CANCELLED);
        payment.setFailureReason("Transaction cancelled by user or administrator");
        Payment cancelled = paymentRepository.save(payment);

        auditService.recordAuditLog(
                cancelled,
                AuditEventType.PAYMENT_CANCELLED,
                previousStatus,
                PaymentStatus.CANCELLED,
                "Payment was explicitly cancelled by " + (username != null ? username : "user"),
                username
        );

        return PaymentResponse.fromEntity(cancelled);
    }

    @Transactional(readOnly = true)
    public Payment findPaymentOrThrow(Long id) {
        return paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with ID: " + id));
    }
}
