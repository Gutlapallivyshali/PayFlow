package com.payflow.controller;

import com.payflow.dto.response.DashboardSummaryResponse;
import com.payflow.dto.response.PaymentResponse;
import com.payflow.dto.response.PaymentTrendResponse;
import com.payflow.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@SecurityRequirement(name = "BearerAuth")
@Tag(name = "Dashboard", description = "Real-time analytics, metrics, trends, and recent transaction feeds")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/summary")
    @Operation(summary = "Get transaction metrics summary", description = "Returns real-time aggregate totals, volumes, and success rates")
    public ResponseEntity<DashboardSummaryResponse> getSummary() {
        DashboardSummaryResponse response = dashboardService.getSummary();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/payment-trends")
    @Operation(summary = "Get payment time-series trends", description = "Returns daily payment counts, success/failure counts, and volume")
    public ResponseEntity<List<PaymentTrendResponse>> getPaymentTrends(
            @RequestParam(defaultValue = "7") int days) {
        List<PaymentTrendResponse> trends = dashboardService.getPaymentTrends(days);
        return ResponseEntity.ok(trends);
    }

    @GetMapping("/recent-payments")
    @Operation(summary = "Get recent transactions", description = "Returns top 10 most recent payment records")
    public ResponseEntity<List<PaymentResponse>> getRecentPayments() {
        List<PaymentResponse> recent = dashboardService.getRecentPayments();
        return ResponseEntity.ok(recent);
    }
}
