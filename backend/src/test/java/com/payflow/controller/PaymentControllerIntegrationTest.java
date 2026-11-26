package com.payflow.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.payflow.dto.request.CreatePaymentRequest;
import com.payflow.dto.request.LoginRequest;
import com.payflow.enums.PaymentMethodType;
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
import java.math.BigDecimal;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestDataInitializer.class)
class PaymentControllerIntegrationTest {

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
    @DisplayName("Integration: Should create, settle payment, and enforce idempotency replay & conflict rules")
    void shouldCreatePaymentAndEnforceIdempotency() throws Exception {
        String idemKey = "integ_idem_" + UUID.randomUUID().toString();

        CreatePaymentRequest paymentRequest = new CreatePaymentRequest(
                1L,
                new BigDecimal("125.50"),
                "USD",
                "Integration Test Payment",
                PaymentMethodType.MOCK_CARD,
                idemKey
        );

        // 1. Initial Payment Submission -> SUCCESS
        String firstResponse = mockMvc.perform(post("/api/payments")
                        .header("Authorization", "Bearer " + authToken)
                        .header("Idempotency-Key", idemKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(paymentRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.status").value("SUCCESS"))
                .andExpect(jsonPath("$.gatewayReference").value(startsWith("pg_tx_")))
                .andReturn().getResponse().getContentAsString();

        long paymentId = objectMapper.readTree(firstResponse).get("id").asLong();
        String gatewayRef = objectMapper.readTree(firstResponse).get("gatewayReference").asText();

        // 2. Exact Duplicate Submission (Replay) -> Should return the SAME payment without creating new one
        mockMvc.perform(post("/api/payments")
                        .header("Authorization", "Bearer " + authToken)
                        .header("Idempotency-Key", idemKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(paymentRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(paymentId))
                .andExpect(jsonPath("$.gatewayReference").value(gatewayRef));

        // 3. Duplicate Key with CHANGED payload -> HTTP 409 CONFLICT
        CreatePaymentRequest conflictingRequest = new CreatePaymentRequest(
                1L,
                new BigDecimal("999.00"), // altered amount!
                "USD",
                "Conflicting Transaction",
                PaymentMethodType.MOCK_CARD,
                idemKey
        );

        mockMvc.perform(post("/api/payments")
                        .header("Authorization", "Bearer " + authToken)
                        .header("Idempotency-Key", idemKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(conflictingRequest)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("Idempotency Conflict"));

        // 4. Retrieve complete details with audit log history
        mockMvc.perform(get("/api/payments/" + paymentId + "/detail")
                        .header("Authorization", "Bearer " + authToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.payment.id").value(paymentId))
                .andExpect(jsonPath("$.attempts", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.history", hasSize(greaterThanOrEqualTo(2))));
    }

    @Test
    @DisplayName("Integration: Should reject payment for inactive customer (customer ID 4 in seed data)")
    void shouldRejectPaymentForInactiveCustomer() throws Exception {
        CreatePaymentRequest request = new CreatePaymentRequest(
                4L, // Customer 4 is David Chen (INACTIVE) in seed data
                new BigDecimal("50.00"),
                "USD",
                "Inactive Customer Test",
                PaymentMethodType.MOCK_CARD,
                "idem_inactive_" + UUID.randomUUID()
        );

        mockMvc.perform(post("/api/payments")
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Inactive Customer"));
    }
}
