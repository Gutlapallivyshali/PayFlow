package com.payflow.controller;

import com.payflow.dto.request.CreatePaymentRequest;
import com.payflow.dto.response.PageResponse;
import com.payflow.dto.response.PaymentAuditLogResponse;
import com.payflow.dto.response.PaymentDetailResponse;
import com.payflow.dto.response.PaymentResponse;
import com.payflow.enums.PaymentStatus;
import com.payflow.service.AuditService;
import com.payflow.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/payments")
@SecurityRequirement(name = "BearerAuth")
@Tag(name = "Payments", description = "Core transaction creation, execution, retry, cancellation, and audit APIs")
public class PaymentController {

    private final PaymentService paymentService;
    private final AuditService auditService;

    public PaymentController(PaymentService paymentService, AuditService auditService) {
        this.paymentService = paymentService;
        this.auditService = auditService;
    }

    @PostMapping
    @Operation(summary = "Create and process a payment",
               description = "Submits a payment request with idempotency protection. Executes gateway simulation atomically.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Payment processed successfully or replayed idempotently"),
            @ApiResponse(responseCode = "400", description = "Invalid request or inactive customer"),
            @ApiResponse(responseCode = "409", description = "Idempotency conflict with differing payload"),
            @ApiResponse(responseCode = "422", description = "Unprocessable transaction state")
    })
    public ResponseEntity<PaymentResponse> createPayment(
            @Parameter(description = "Unique idempotency key to prevent double charging")
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @Valid @RequestBody CreatePaymentRequest request,
            Principal principal) {

        String username = principal != null ? principal.getName() : "API_USER";
        PaymentResponse response = paymentService.createAndProcessPayment(request, idempotencyKey, username);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    @Operation(summary = "List all payments", description = "Returns a paginated list of payments with search, date range, and status filtering")
    public ResponseEntity<PageResponse<PaymentResponse>> getAllPayments(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) PaymentStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        Sort sort = direction.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        PageResponse<PaymentResponse> response = paymentService.getAllPayments(search, status, startDate, endDate, pageable);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get payment by ID", description = "Retrieves payment summary by ID")
    public ResponseEntity<PaymentResponse> getPaymentById(@PathVariable Long id) {
        PaymentResponse response = paymentService.getPaymentById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/detail")
    @Operation(summary = "Get complete payment details", description = "Retrieves payment summary, attempt log, and full audit trail")
    public ResponseEntity<PaymentDetailResponse> getPaymentDetailById(@PathVariable Long id) {
        PaymentDetailResponse response = paymentService.getPaymentDetailById(id);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/retry")
    @Operation(summary = "Retry a failed payment", description = "Re-initiates gateway processing for an eligible FAILED payment")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Retry executed"),
            @ApiResponse(responseCode = "422", description = "Payment is not in FAILED state")
    })
    public ResponseEntity<PaymentResponse> retryPayment(@PathVariable Long id, Principal principal) {
        String username = principal != null ? principal.getName() : "API_USER";
        PaymentResponse response = paymentService.retryPayment(id, username);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Cancel a pending payment", description = "Cancels an eligible CREATED or PENDING payment")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Payment cancelled successfully"),
            @ApiResponse(responseCode = "422", description = "Payment cannot be cancelled (e.g. already SUCCESS or FAILED)")
    })
    public ResponseEntity<PaymentResponse> cancelPayment(@PathVariable Long id, Principal principal) {
        String username = principal != null ? principal.getName() : "API_USER";
        PaymentResponse response = paymentService.cancelPayment(id, username);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/history")
    @Operation(summary = "Get payment audit history", description = "Retrieves chronological audit trail of state transitions for the payment")
    public ResponseEntity<List<PaymentAuditLogResponse>> getPaymentAuditHistory(@PathVariable Long id) {
        List<PaymentAuditLogResponse> history = auditService.getPaymentAuditHistory(id);
        return ResponseEntity.ok(history);
    }
}
