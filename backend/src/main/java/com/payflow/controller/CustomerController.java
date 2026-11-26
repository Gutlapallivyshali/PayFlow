package com.payflow.controller;

import com.payflow.dto.request.CreateCustomerRequest;
import com.payflow.dto.request.UpdateCustomerRequest;
import com.payflow.dto.request.UpdateCustomerStatusRequest;
import com.payflow.dto.response.CustomerResponse;
import com.payflow.dto.response.PageResponse;
import com.payflow.dto.response.PaymentResponse;
import com.payflow.enums.CustomerStatus;
import com.payflow.service.CustomerService;
import com.payflow.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/customers")
@SecurityRequirement(name = "BearerAuth")
@Tag(name = "Customers", description = "Customer account management and lifecycle operations")
public class CustomerController {

    private final CustomerService customerService;
    private final PaymentService paymentService;

    public CustomerController(CustomerService customerService, PaymentService paymentService) {
        this.customerService = customerService;
        this.paymentService = paymentService;
    }

    @PostMapping
    @Operation(summary = "Register a new customer", description = "Creates a customer profile with unique email verification")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Customer created successfully"),
            @ApiResponse(responseCode = "400", description = "Validation constraints violated"),
            @ApiResponse(responseCode = "409", description = "Customer with email already exists")
    })
    public ResponseEntity<CustomerResponse> createCustomer(@Valid @RequestBody CreateCustomerRequest request) {
        CustomerResponse response = customerService.createCustomer(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    @Operation(summary = "List all customers", description = "Returns a paginated list of customers with search and status filters")
    public ResponseEntity<PageResponse<CustomerResponse>> getAllCustomers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) CustomerStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        Sort sort = direction.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        PageResponse<CustomerResponse> response = customerService.getAllCustomers(search, status, pageable);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get customer by ID", description = "Fetches a single customer record by their primary identifier")
    public ResponseEntity<CustomerResponse> getCustomerById(@PathVariable Long id) {
        CustomerResponse response = customerService.getCustomerById(id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update customer details", description = "Updates full name, email, or phone number of an existing customer")
    public ResponseEntity<CustomerResponse> updateCustomer(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCustomerRequest request) {
        CustomerResponse response = customerService.updateCustomer(id, request);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Update customer account status", description = "Activates, deactivates, or suspends a customer account")
    public ResponseEntity<CustomerResponse> updateCustomerStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCustomerStatusRequest request) {
        CustomerResponse response = customerService.updateCustomerStatus(id, request.getStatus());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/payments")
    @Operation(summary = "Get customer payment history", description = "Retrieves paginated payment history associated with this customer")
    public ResponseEntity<PageResponse<PaymentResponse>> getCustomerPayments(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        Sort sort = direction.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        PageResponse<PaymentResponse> response = paymentService.getCustomerPayments(id, pageable);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete customer", description = "Deletes an unused customer record. Fails if payments are linked to preserve audit trail.")
    public ResponseEntity<Void> deleteCustomer(@PathVariable Long id) {
        customerService.deleteCustomer(id);
        return ResponseEntity.noContent().build();
    }
}
