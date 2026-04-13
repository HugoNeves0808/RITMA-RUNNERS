package com.ritma.runners.podium.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class PodiumRepository {

    private final ObjectProvider<JdbcTemplate> jdbcTemplateProvider;

    public PodiumRepository(ObjectProvider<JdbcTemplate> jdbcTemplateProvider) {
        this.jdbcTemplateProvider = jdbcTemplateProvider;
    }

    public List<PodiumRaceRow> findPodiumRaces(UUID userId) {
        return jdbcTemplate().query(
                """
                        SELECT
                            ur.id AS race_id,
                            ur.name AS race_name,
                            ur.race_date,
                            ur.location,
                            urt.name AS race_type_name,
                            ut.name AS team_name,
                            uc.name AS circuit_name,
                            ur.official_time,
                            ur.chip_time,
                            ur.pace_per_km,
                            ur.general_classification,
                            ur.age_group_classification,
                            ur.team_classification
                        FROM user_races ur
                        LEFT JOIN user_race_types urt ON urt.id = ur.race_type_id
                        LEFT JOIN user_teams ut ON ut.id = ur.team_id
                        LEFT JOIN user_circuits uc ON uc.id = ur.circuit_id
                        WHERE ur.user_id = ?
                          AND ur.archived = FALSE
                          AND ur.race_status = 'COMPLETED'::race_status
                          AND (
                              (ur.general_classification IS NOT NULL AND ur.general_classification <= 3)
                              OR (ur.age_group_classification IS NOT NULL AND ur.age_group_classification <= 3)
                              OR (ur.team_classification IS NOT NULL AND ur.team_classification <= 3)
                          )
                        ORDER BY ur.race_date DESC NULLS LAST, ur.created_at DESC, lower(ur.name) ASC
                        """,
                (rs, rowNum) -> new PodiumRaceRow(
                        UUID.fromString(rs.getString("race_id")),
                        rs.getString("race_name"),
                        rs.getObject("race_date", LocalDate.class),
                        rs.getString("location"),
                        rs.getString("race_type_name"),
                        rs.getString("team_name"),
                        rs.getString("circuit_name"),
                        getNullableInteger(rs, "official_time"),
                        getNullableInteger(rs, "chip_time"),
                        getNullableInteger(rs, "pace_per_km"),
                        getNullableInteger(rs, "general_classification"),
                        getNullableInteger(rs, "age_group_classification"),
                        getNullableInteger(rs, "team_classification")
                ),
                userId
        );
    }

    private Integer getNullableInteger(java.sql.ResultSet rs, String columnLabel) throws java.sql.SQLException {
        int value = rs.getInt(columnLabel);
        return rs.wasNull() ? null : value;
    }

    private JdbcTemplate jdbcTemplate() {
        JdbcTemplate jdbcTemplate = jdbcTemplateProvider.getIfAvailable();
        if (jdbcTemplate == null) {
            throw new IllegalStateException("JdbcTemplate is not available");
        }
        return jdbcTemplate;
    }

    public record PodiumRaceRow(
            UUID raceId,
            String raceName,
            LocalDate raceDate,
            String location,
            String raceTypeName,
            String teamName,
            String circuitName,
            Integer officialTimeSeconds,
            Integer chipTimeSeconds,
            Integer pacePerKmSeconds,
            Integer generalClassification,
            Integer ageGroupClassification,
            Integer teamClassification
    ) {
    }
}
