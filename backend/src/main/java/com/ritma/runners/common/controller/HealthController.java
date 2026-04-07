package com.ritma.runners.common.controller;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

    private final ObjectProvider<HealthStatusProbe> healthStatusProbeProvider;

    public HealthController(ObjectProvider<HealthStatusProbe> healthStatusProbeProvider) {
        this.healthStatusProbeProvider = healthStatusProbeProvider;
    }

    @GetMapping("/api/health")
    public Map<String, Object> health() {
        Map<String, Object> response = new LinkedHashMap<>();
        HealthStatusProbe probe = healthStatusProbeProvider.getIfAvailable();
        response.put("status", probe != null && probe.isHealthy() ? "ok" : "degraded");
        return response;
    }
}
