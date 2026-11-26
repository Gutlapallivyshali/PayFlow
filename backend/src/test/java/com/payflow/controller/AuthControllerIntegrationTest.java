
package com.payflow.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.payflow.config.TestDataInitializer;
import com.payflow.dto.request.LoginRequest;
import com.payflow.dto.request.RegisterUserRequest;
import com.payflow.enums.UserRole;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestDataInitializer.class)
class AuthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("Integration: Should login successfully with seeded admin account")
    void shouldLoginSuccessfullyWithAdminAccount() throws Exception {

        LoginRequest loginRequest = new LoginRequest(
                "admin",
                "admin123"
        );

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.username").value("admin"))
                .andExpect(jsonPath("$.role").value("ADMIN"));
    }

    @Test
    @DisplayName("Integration: Should reject login with invalid password")
    void shouldRejectInvalidCredentials() throws Exception {

        LoginRequest loginRequest = new LoginRequest(
                "admin",
                "wrongpassword"
        );

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andDo(print())
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message")
                        .value(containsString("Invalid username or password")));
    }

    @Test
    @DisplayName("Integration: Should register a new user and retrieve auth profile")
    void shouldRegisterNewUserSuccessfully() throws Exception {

        String uniqueUser = "integ_user_" + System.currentTimeMillis();

        RegisterUserRequest registerRequest = new RegisterUserRequest(
                uniqueUser,
                uniqueUser + "@payflow.internal",
                "secret123",
                UserRole.CUSTOMER
        );

        String responseContent = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.username").value(uniqueUser))
                .andReturn()
                .getResponse()
                .getContentAsString();

        String token = objectMapper.readTree(responseContent)
                .get("token")
                .asText();

        // Verify /api/auth/me with Bearer token
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value(uniqueUser));
    }
}
