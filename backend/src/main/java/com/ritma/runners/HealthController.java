package com.ritma.runners;

import java.util.LinkedHashMap;
import java.util.Map;

import javax.sql.DataSource;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
public class HealthController {

    private final ObjectProvider<DataSource> dataSourceProvider;
    private final ObjectProvider<JdbcTemplate> jdbcTemplateProvider;

    public HealthController(ObjectProvider<DataSource> dataSourceProvider,
                            ObjectProvider<JdbcTemplate> jdbcTemplateProvider) {
        this.dataSourceProvider = dataSourceProvider;
        this.jdbcTemplateProvider = jdbcTemplateProvider;
    }

    @GetMapping("/api/health")
    public Map<String, Object> health() {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("status", "ok");
        response.put("application", "ritma-runners-backend");
        response.put("databaseConfigured", dataSourceProvider.getIfAvailable() != null);

        JdbcTemplate jdbcTemplate = jdbcTemplateProvider.getIfAvailable();
        if (jdbcTemplate != null) {
            String databaseName = jdbcTemplate.queryForObject("SELECT current_database()", String.class);
            response.put("databaseStatus", "connected");
            response.put("databaseName", databaseName);
        } else {
            response.put("databaseStatus", "not-configured");
        }

        return response;
    }
}
