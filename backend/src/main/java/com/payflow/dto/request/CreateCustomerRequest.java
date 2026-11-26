package com.payflow.dto.request;

import com.payflow.enums.CustomerStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CreateCustomerRequest {

    @NotBlank(message = "Customer full name cannot be blank")
    @Size(min = 2, max = 100, message = "Customer full name must be between 2 and 100 characters")
    private String fullName;

    @NotBlank(message = "Email address cannot be blank")
    @Email(message = "Email must be a valid email address")
    @Size(max = 100, message = "Email cannot exceed 100 characters")
    private String email;

    @Size(max = 20, message = "Phone number cannot exceed 20 characters")
    private String phoneNumber;

    private CustomerStatus status = CustomerStatus.ACTIVE;

    public CreateCustomerRequest() {
    }

    public CreateCustomerRequest(String fullName, String email, String phoneNumber, CustomerStatus status) {
        this.fullName = fullName;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.status = status != null ? status : CustomerStatus.ACTIVE;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public CustomerStatus getStatus() {
        return status;
    }

    public void setStatus(CustomerStatus status) {
        this.status = status;
    }
}
