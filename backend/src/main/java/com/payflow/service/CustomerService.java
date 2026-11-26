package com.payflow.service;

import com.payflow.dto.request.CreateCustomerRequest;
import com.payflow.dto.request.UpdateCustomerRequest;
import com.payflow.dto.response.CustomerResponse;
import com.payflow.dto.response.PageResponse;
import com.payflow.entity.Customer;
import com.payflow.enums.CustomerStatus;
import com.payflow.exception.DuplicateResourceException;
import com.payflow.exception.ResourceNotFoundException;
import com.payflow.repository.CustomerRepository;
import com.payflow.repository.PaymentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CustomerService {

    private static final Logger log = LoggerFactory.getLogger(CustomerService.class);

    private final CustomerRepository customerRepository;
    private final PaymentRepository paymentRepository;

    public CustomerService(CustomerRepository customerRepository, PaymentRepository paymentRepository) {
        this.customerRepository = customerRepository;
        this.paymentRepository = paymentRepository;
    }

    @Transactional
    public CustomerResponse createCustomer(CreateCustomerRequest request) {
        log.info("Creating customer with email: {}", request.getEmail());
        if (customerRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("A customer with email '" + request.getEmail() + "' already exists.");
        }

        Customer customer = new Customer(
                request.getFullName().trim(),
                request.getEmail().trim().toLowerCase(),
                request.getPhoneNumber() != null ? request.getPhoneNumber().trim() : null,
                request.getStatus() != null ? request.getStatus() : CustomerStatus.ACTIVE
        );

        Customer saved = customerRepository.save(customer);
        log.info("Customer created successfully with ID: {}", saved.getId());
        return CustomerResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public PageResponse<CustomerResponse> getAllCustomers(String keyword, CustomerStatus status, Pageable pageable) {
        String cleanKeyword = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;
        Page<Customer> page = customerRepository.searchCustomers(cleanKeyword, status, pageable);
        return PageResponse.fromPage(page, CustomerResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public CustomerResponse getCustomerById(Long id) {
        Customer customer = findCustomerOrThrow(id);
        return CustomerResponse.fromEntity(customer);
    }

    @Transactional(readOnly = true)
    public Customer findCustomerOrThrow(Long id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with ID: " + id));
    }

    @Transactional
    public CustomerResponse updateCustomer(Long id, UpdateCustomerRequest request) {
        Customer customer = findCustomerOrThrow(id);

        String newEmail = request.getEmail().trim().toLowerCase();
        if (!customer.getEmail().equalsIgnoreCase(newEmail) && customerRepository.existsByEmail(newEmail)) {
            throw new DuplicateResourceException("A customer with email '" + newEmail + "' already exists.");
        }

        customer.setFullName(request.getFullName().trim());
        customer.setEmail(newEmail);
        customer.setPhoneNumber(request.getPhoneNumber() != null ? request.getPhoneNumber().trim() : null);

        Customer updated = customerRepository.save(customer);
        log.info("Customer ID [{}] updated successfully", id);
        return CustomerResponse.fromEntity(updated);
    }

    @Transactional
    public CustomerResponse updateCustomerStatus(Long id, CustomerStatus status) {
        Customer customer = findCustomerOrThrow(id);
        customer.setStatus(status);
        Customer updated = customerRepository.save(customer);
        log.info("Customer ID [{}] status changed to: {}", id, status);
        return CustomerResponse.fromEntity(updated);
    }

    @Transactional
    public void deleteCustomer(Long id) {
        Customer customer = findCustomerOrThrow(id);
        if (paymentRepository.existsByCustomerId(id)) {
            throw new IllegalStateException("Cannot delete customer ID " + id + " because associated payment transaction records exist. Deactivate the customer instead.");
        }
        customerRepository.delete(customer);
        log.info("Customer ID [{}] deleted successfully", id);
    }
}
