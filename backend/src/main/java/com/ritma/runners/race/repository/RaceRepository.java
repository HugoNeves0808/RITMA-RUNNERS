package com.ritma.runners.race.repository;

import java.sql.Time;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.ritma.runners.race.dto.RaceCalendarItemResponse;

@Repository
public class RaceRepository {

    private final ObjectProvider<JdbcTemplate> jdbcTemplateProvider;

    public RaceRepository(ObjectProvider<JdbcTemplate> jdbcTemplateProvider) {
        this.jdbcTemplateProvider = jdbcTemplateProvider;
    }

    public List<RaceCalendarItemResponse> findCalendarRacesForMonth(UUID userId, LocalDate startDate, LocalDate endDate) {
        String sql = """
                SELECT
                    ur.id,
                    ur.name,
                    urt.name AS race_type_name,
                    ur.race_status::text AS race_status,
                    ur.race_date,
                    ur.race_time,
                    ur.real_km,
                    ur.elevation,
                    ur.archived,
                    ur.is_valid_for_category_ranking
                FROM user_races ur
                LEFT JOIN user_race_types urt ON urt.id = ur.race_type_id
                WHERE ur.user_id = ?
                  AND ur.race_date IS NOT NULL
                  AND ur.race_date >= ?
                  AND ur.race_date <= ?
                ORDER BY ur.race_date ASC, ur.race_time ASC NULLS LAST, lower(ur.name) ASC
                """;

        return jdbcTemplate().query(
                sql,
                (rs, rowNum) -> new RaceCalendarItemResponse(
                        rs.getObject("id", UUID.class),
                        rs.getString("name"),
                        rs.getString("race_type_name"),
                        rs.getString("race_status"),
                        rs.getObject("race_date", LocalDate.class),
                        getNullableLocalTime(rs.getTime("race_time")),
                        rs.getBigDecimal("real_km"),
                        getNullableInteger(rs, "elevation"),
                        rs.getBoolean("archived"),
                        rs.getBoolean("is_valid_for_category_ranking")
                ),
                userId,
                startDate,
                endDate
        );
    }

    private JdbcTemplate jdbcTemplate() {
        JdbcTemplate jdbcTemplate = jdbcTemplateProvider.getIfAvailable();
        if (jdbcTemplate == null) {
            throw new IllegalStateException("JdbcTemplate is not available");
        }
        return jdbcTemplate;
    }

    private LocalTime getNullableLocalTime(Time value) {
        return value != null ? value.toLocalTime() : null;
    }

    private Integer getNullableInteger(java.sql.ResultSet rs, String columnName) throws java.sql.SQLException {
        int value = rs.getInt(columnName);
        return rs.wasNull() ? null : value;
    }
}
