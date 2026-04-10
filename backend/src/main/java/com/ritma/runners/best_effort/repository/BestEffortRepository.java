package com.ritma.runners.best_effort.repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class BestEffortRepository {

    private final ObjectProvider<JdbcTemplate> jdbcTemplateProvider;

    public BestEffortRepository(ObjectProvider<JdbcTemplate> jdbcTemplateProvider) {
        this.jdbcTemplateProvider = jdbcTemplateProvider;
    }

    public List<BestEffortRaceRow> findBestEffortCandidates(UUID userId) {
        return jdbcTemplate().query(
                """
                        SELECT
                            ur.id,
                            ur.name,
                            ur.race_date,
                            ur.real_km,
                            ur.is_valid_for_category_ranking,
                            urt.name AS race_type_name,
                            urt.target_km,
                            ur.chip_time,
                            ur.official_time,
                            ur.pace_per_km,
                            ur.general_classification,
                            ur.age_group_classification,
                            ur.team_classification
                        FROM user_races ur
                        LEFT JOIN user_race_types urt ON urt.id = ur.race_type_id
                        WHERE ur.user_id = ?
                          AND ur.archived = FALSE
                          AND ur.race_status = 'COMPLETED'::race_status
                          AND ur.chip_time IS NOT NULL
                          AND urt.name IS NOT NULL
                        ORDER BY lower(urt.name) ASC, ur.race_date ASC NULLS LAST, lower(ur.name) ASC
                        """,
                (rs, rowNum) -> new BestEffortRaceRow(
                        rs.getObject("id", UUID.class),
                        rs.getString("name"),
                        rs.getObject("race_date", LocalDate.class),
                        rs.getString("race_type_name"),
                        rs.getBigDecimal("target_km"),
                        rs.getBigDecimal("real_km"),
                        rs.getObject("is_valid_for_category_ranking", Boolean.class),
                        getNullableInteger(rs, "chip_time"),
                        getNullableInteger(rs, "official_time"),
                        getNullableInteger(rs, "pace_per_km"),
                        getNullableInteger(rs, "general_classification"),
                        getNullableInteger(rs, "age_group_classification"),
                        getNullableInteger(rs, "team_classification")
                ),
                userId
        );
    }

    private JdbcTemplate jdbcTemplate() {
        JdbcTemplate jdbcTemplate = jdbcTemplateProvider.getIfAvailable();
        if (jdbcTemplate == null) {
            throw new IllegalStateException("JdbcTemplate is not available");
        }
        return jdbcTemplate;
    }

    private Integer getNullableInteger(java.sql.ResultSet rs, String columnName) throws java.sql.SQLException {
        int value = rs.getInt(columnName);
        return rs.wasNull() ? null : value;
    }

    public record BestEffortRaceRow(
            UUID raceId,
            String raceName,
            LocalDate raceDate,
            String raceTypeName,
            BigDecimal targetKm,
            BigDecimal realKm,
            Boolean isValidForCategoryRanking,
            Integer chipTimeSeconds,
            Integer officialTimeSeconds,
            Integer pacePerKmSeconds,
            Integer generalClassification,
            Integer ageGroupClassification,
            Integer teamClassification
    ) {
    }
}
