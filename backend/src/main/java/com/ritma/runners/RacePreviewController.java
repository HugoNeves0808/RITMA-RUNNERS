package com.ritma.runners;

import java.math.BigDecimal;
import java.sql.Date;
import java.sql.Time;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173")
public class RacePreviewController {

    private final ObjectProvider<JdbcTemplate> jdbcTemplateProvider;

    public RacePreviewController(ObjectProvider<JdbcTemplate> jdbcTemplateProvider) {
        this.jdbcTemplateProvider = jdbcTemplateProvider;
    }

    @GetMapping("/races")
    public List<RacePreviewResponse> listRaces() {
        JdbcTemplate jdbcTemplate = jdbcTemplateProvider.getIfAvailable();
        if (jdbcTemplate == null) {
            return Collections.emptyList();
        }

        String sql = """
                SELECT
                    id,
                    user_id,
                    name,
                    race_status,
                    race_date,
                    race_time,
                    real_km,
                    elevation,
                    archived,
                    is_valid_for_category_ranking
                FROM user_races
                ORDER BY created_at DESC
                LIMIT 10
                """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> new RacePreviewResponse(
                rs.getObject("id", UUID.class),
                rs.getObject("user_id", UUID.class),
                rs.getString("name"),
                rs.getString("race_status"),
                rs.getObject("race_date", Date.class),
                rs.getObject("race_time", Time.class),
                rs.getBigDecimal("real_km"),
                getNullableInteger(rs, "elevation"),
                rs.getBoolean("archived"),
                rs.getBoolean("is_valid_for_category_ranking")
        ));
    }

    @GetMapping("/db-check")
    public DatabaseCheckResponse databaseCheck() {
        JdbcTemplate jdbcTemplate = jdbcTemplateProvider.getIfAvailable();
        if (jdbcTemplate == null) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Database not configured");
        }

        Integer raceCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM user_races", Integer.class);
        String databaseName = jdbcTemplate.queryForObject("SELECT current_database()", String.class);

        return new DatabaseCheckResponse(databaseName, raceCount == null ? 0 : raceCount);
    }

    private Integer getNullableInteger(java.sql.ResultSet rs, String columnName) throws java.sql.SQLException {
        int value = rs.getInt(columnName);
        return rs.wasNull() ? null : value;
    }

    public record RacePreviewResponse(
            UUID id,
            UUID userId,
            String name,
            String raceStatus,
            Date raceDate,
            Time raceTime,
            BigDecimal realKm,
            Integer elevation,
            boolean archived,
            boolean isValidForCategoryRanking
    ) {
    }

    public record DatabaseCheckResponse(
            String database,
            int raceCount
    ) {
    }
}
