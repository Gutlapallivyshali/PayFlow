package com.payflow.controller;

import com.payflow.paymentgateway.MockPaymentGateway;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/gateway")
@SecurityRequirement(name = "BearerAuth")
@Tag(name = "Gateway Simulation Config", description = "Mock gateway simulation controls for testing scenarios")
public class GatewayConfigController {

    private final MockPaymentGateway mockPaymentGateway;

    public GatewayConfigController(MockPaymentGateway mockPaymentGateway) {
        this.mockPaymentGateway = mockPaymentGateway;
    }

    @GetMapping("/config")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get mock gateway status", description = "Returns current simulation flags and default latency")
    public ResponseEntity<Map<String, Object>> getGatewayConfig() {
        Map<String, Object> config = new HashMap<>();
        config.put("providerName", mockPaymentGateway.getGatewayProviderName());
        config.put("forceFailure", mockPaymentGateway.isForceFailure());
        config.put("defaultLatencyMs", mockPaymentGateway.getDefaultLatencyMs());
        return ResponseEntity.ok(config);
    }

    @PostMapping("/config/toggle-failure")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Toggle gateway failure mode", description = "Forces mock gateway to decline incoming payments for testing failure recovery")
    public ResponseEntity<Map<String, Object>> toggleFailure(@RequestParam(required = false) Boolean enabled) {
        boolean newState = (enabled != null) ? enabled : !mockPaymentGateway.isForceFailure();
        mockPaymentGateway.setForceFailure(newState);

        Map<String, Object> result = new HashMap<>();
        result.put("forceFailure", newState);
        result.put("message", newState ? "Gateway failure simulation ENABLED" : "Gateway failure simulation DISABLED");
        return ResponseEntity.ok(result);
    }
}
