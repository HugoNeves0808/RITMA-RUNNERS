package com.ritma.runners.admin.overview.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ritma.runners.admin.overview.dto.AdminOverviewResponse;
import com.ritma.runners.admin.overview.service.AdminOverviewService;

@RestController
@RequestMapping("/api/admin/overview")
@CrossOrigin(origins = "http://localhost:5173")
public class AdminOverviewController {

    private final AdminOverviewService adminOverviewService;

    public AdminOverviewController(AdminOverviewService adminOverviewService) {
        this.adminOverviewService = adminOverviewService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public AdminOverviewResponse getOverview() {
        return adminOverviewService.getOverview();
    }
}
