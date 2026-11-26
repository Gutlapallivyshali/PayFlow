package com.payflow.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.payflow.dto.request.CreateCustomerRequest;
import com.payflow.dto.request.LoginRequest;
import com.payflow.dto.request.UpdateCustomerStatusRequest;
import com.payflow.enums.CustomerStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import com.payflow.config.TestDataInitializer;
import org.springframework.context.annotation.Import;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestDataInitializer.class)
class CustomerControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String authToken;

    @BeforeEach
    void obtainAuthToken() throws Exception {
        LoginRequest login = new LoginRequest("admin", "admin123");
        String response = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        authToken = objectMapper.readTree(response).get("token").asText();
    }

    @Test
    @DisplayName("Integration: Should create a new customer and retrieve by ID")
    void shouldCreateAndRetrieveCustomer() throws Exception {
        String email = "test_cust_" + System.currentTimeMillis() + "@acme.org";
        CreateCustomerRequest createRequest = new CreateCustomerRequest("Jonathan Edwards", email, "+1-555-4321", CustomerStatus.ACTIVE);

        String createRes = mockMvc.perform(post("/api/customers")
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.fullName").value("Jonathan Edwards"))
                .andExpect(jsonPath("$.email").value(email))
                .andReturn().getResponse().getContentAsString();

        long customerId = objectMapper.readTree(createRes).get("id").asLong();

        // Get customer by ID
        mockMvc.perform(get("/api/customers/" + customerId)
                        .header("Authorization", "Bearer " + authToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(customerId))
                .andExpect(jsonPath("$.email").value(email));

        // Update status to INACTIVE
        UpdateCustomerStatusRequest statusRequest = new UpdateCustomerStatusRequest(CustomerStatus.INACTIVE);
        mockMvc.perform(patch("/api/customers/" + customerId + "/status")
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(statusRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("INACTIVE"));
    }

    @Test
    @DisplayName("Integration: Should reject invalid email format with validation errors")
    void shouldRejectInvalidEmailFormat() throws Exception {
        CreateCustomerRequest badRequest = new CreateCustomerRequest("Bad Email Cust", "not-an-email", "+123", CustomerStatus.ACTIVE);

        mockMvc.perform(post("/api/customers")
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.validationErrors.email").isNotEmpty());
    }
}
