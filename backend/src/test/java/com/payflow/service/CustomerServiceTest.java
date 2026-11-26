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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CustomerServiceTest {

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @InjectMocks
    private CustomerService customerService;

    private Customer sampleCustomer;

    @BeforeEach
    void setUp() {
        sampleCustomer = new Customer("John Doe", "john.doe@example.com", "+1-555-0100", CustomerStatus.ACTIVE);
        sampleCustomer.setId(1L);
    }

    @Test
    @DisplayName("Should successfully create a new customer")
    void shouldCreateCustomerSuccessfully() {
        CreateCustomerRequest request = new CreateCustomerRequest("John Doe", "john.doe@example.com", "+1-555-0100", CustomerStatus.ACTIVE);

        when(customerRepository.existsByEmail("john.doe@example.com")).thenReturn(false);
        when(customerRepository.save(any(Customer.class))).thenReturn(sampleCustomer);

        CustomerResponse response = customerService.createCustomer(request);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getFullName()).isEqualTo("John Doe");
        assertThat(response.getEmail()).isEqualTo("john.doe@example.com");
        verify(customerRepository, times(1)).save(any(Customer.class));
    }

    @Test
    @DisplayName("Should throw DuplicateResourceException when email already exists")
    void shouldThrowWhenEmailAlreadyExists() {
        CreateCustomerRequest request = new CreateCustomerRequest("John Doe", "john.doe@example.com", "+1-555-0100", CustomerStatus.ACTIVE);

        when(customerRepository.existsByEmail("john.doe@example.com")).thenReturn(true);

        assertThatThrownBy(() -> customerService.createCustomer(request))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("already exists");

        verify(customerRepository, never()).save(any(Customer.class));
    }

    @Test
    @DisplayName("Should retrieve customer by ID")
    void shouldGetCustomerById() {
        when(customerRepository.findById(1L)).thenReturn(Optional.of(sampleCustomer));

        CustomerResponse response = customerService.getCustomerById(1L);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getEmail()).isEqualTo("john.doe@example.com");
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when customer ID does not exist")
    void shouldThrowWhenCustomerNotFound() {
        when(customerRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> customerService.getCustomerById(999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Customer not found");
    }

    @Test
    @DisplayName("Should update customer details")
    void shouldUpdateCustomer() {
        UpdateCustomerRequest request = new UpdateCustomerRequest("Johnathan Doe", "john.new@example.com", "+1-555-9999");

        when(customerRepository.findById(1L)).thenReturn(Optional.of(sampleCustomer));
        when(customerRepository.existsByEmail("john.new@example.com")).thenReturn(false);
        when(customerRepository.save(any(Customer.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CustomerResponse updated = customerService.updateCustomer(1L, request);

        assertThat(updated.getFullName()).isEqualTo("Johnathan Doe");
        assertThat(updated.getEmail()).isEqualTo("john.new@example.com");
    }

    @Test
    @DisplayName("Should update customer status")
    void shouldUpdateCustomerStatus() {
        when(customerRepository.findById(1L)).thenReturn(Optional.of(sampleCustomer));
        when(customerRepository.save(any(Customer.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CustomerResponse updated = customerService.updateCustomerStatus(1L, CustomerStatus.INACTIVE);

        assertThat(updated.getStatus()).isEqualTo(CustomerStatus.INACTIVE);
    }

    @Test
    @DisplayName("Should prevent deleting customer with associated payments")
    void shouldPreventDeletingCustomerWithPayments() {
        when(customerRepository.findById(1L)).thenReturn(Optional.of(sampleCustomer));
        when(paymentRepository.existsByCustomerId(1L)).thenReturn(true);

        assertThatThrownBy(() -> customerService.deleteCustomer(1L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("associated payment transaction records exist");

        verify(customerRepository, never()).delete(any(Customer.class));
    }

    @Test
    @DisplayName("Should list all customers with pagination")
    void shouldListCustomersWithPagination() {
        Pageable pageable = PageRequest.of(0, 10);
        when(customerRepository.searchCustomers(null, null, pageable))
                .thenReturn(new PageImpl<>(List.of(sampleCustomer), pageable, 1));

        PageResponse<CustomerResponse> page = customerService.getAllCustomers(null, null, pageable);

        assertThat(page.getTotalElements()).isEqualTo(1);
        assertThat(page.getContent()).hasSize(1);
    }
}
