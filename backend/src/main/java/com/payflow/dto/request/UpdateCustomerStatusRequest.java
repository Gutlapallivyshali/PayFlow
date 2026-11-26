package com.payflow.dto.request;

import com.payflow.enums.CustomerStatus;
import jakarta.validation.constraints.NotNull;

public class UpdateCustomerStatusRequest {

    @NotNull(message = "Customer status is required")
    private CustomerStatus status;

    public UpdateCustomerStatusRequest() {
    }

    public UpdateCustomerStatusRequest(CustomerStatus status) {
        this.status = status;
    }

    public CustomerStatus getStatus() {
        return status;
    }

    public void setStatus(CustomerStatus status) {
        this.status = status;
    }
}
