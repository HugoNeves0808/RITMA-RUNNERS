package com.ritma.runners.common.controller;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ritma.runners.auth.dto.JwtAuthenticatedUser;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "http://localhost:5173")
public class AdminDiagnosticsController {

    private final ObjectProvider<JdbcTemplate> jdbcTemplateProvider;

    @Value("${spring.application.name:ritma-runners-backend}")
    private String applicationName;

    public AdminDiagnosticsController(ObjectProvider<JdbcTemplate> jdbcTemplateProvider) {
        this.jdbcTemplateProvider = jdbcTemplateProvider;
    }

    @GetMapping("/system-health")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> systemHealth(@AuthenticationPrincipal JwtAuthenticatedUser user) {
        JdbcTemplate jdbcTemplate = jdbcTemplateProvider.getIfAvailable();
        if (jdbcTemplate == null) {
            throw new IllegalStateException("JdbcTemplate is not available");
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("status", "ok");
        response.put("application", applicationName);
        response.put("database", jdbcTemplate.queryForObject("SELECT current_database()", String.class));
        response.put("serverTime", Instant.now().toString());
        response.put("currentUser", Map.of(
                "email", user.email(),
                "role", user.role()
        ));
        return response;
    }
}
