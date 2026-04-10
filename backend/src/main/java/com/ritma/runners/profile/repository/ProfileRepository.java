package com.ritma.runners.profile.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.ritma.runners.profile.dto.ProfileSummaryResponse;

@Repository
public class ProfileRepository {

    private final ObjectProvider<JdbcTemplate> jdbcTemplateProvider;

    public ProfileRepository(ObjectProvider<JdbcTemplate> jdbcTemplateProvider) {
        this.jdbcTemplateProvider = jdbcTemplateProvider;
    }

    public int countTotalRaces(UUID userId) {
        Integer count = jdbcTemplate().queryForObject(
                """
                        SELECT COUNT(*)
                        FROM user_races
                        WHERE user_id = ?
                          AND archived = FALSE
                        """,
                Integer.class,
                userId
        );

        return count == null ? 0 : count;
    }

    public int countCompletedRaces(UUID userId) {
        Integer count = jdbcTemplate().queryForObject(
                """
                        SELECT COUNT(*)
                        FROM user_races
                        WHERE user_id = ?
                          AND archived = FALSE
                          AND race_status = 'COMPLETED'::race_status
                        """,
                Integer.class,
                userId
        );

        return count == null ? 0 : count;
    }

    public int countPodiums(UUID userId) {
        Integer count = jdbcTemplate().queryForObject(
                """
                        SELECT COUNT(*)
                        FROM user_races
                        WHERE user_id = ?
                          AND archived = FALSE
                          AND (
                              (general_classification IS NOT NULL AND general_classification <= 3)
                              OR (age_group_classification IS NOT NULL AND age_group_classification <= 3)
                              OR (team_classification IS NOT NULL AND team_classification <= 3)
                          )
                        """,
                Integer.class,
                userId
        );

        return count == null ? 0 : count;
    }

    public String findFavoriteRaceType(UUID userId) {
        List<String> matches = jdbcTemplate().query(
                """
                        SELECT urt.name
                        FROM user_races ur
                        JOIN user_race_types urt ON urt.id = ur.race_type_id
                        WHERE ur.user_id = ?
                          AND ur.archived = FALSE
                          AND urt.name IS NOT NULL
                        GROUP BY urt.name
                        ORDER BY COUNT(*) DESC, lower(urt.name) ASC
                        LIMIT 1
                        """,
                (rs, rowNum) -> rs.getString("name"),
                userId
        );

        return matches.isEmpty() ? null : matches.get(0);
    }

    public List<ProfileSummaryResponse.RaceTypeSummary> findRaceTypeSummaries(UUID userId) {
        return jdbcTemplate().query(
                """
                        SELECT
                            urt.name AS race_type_name,
                            COUNT(*)::int AS race_count,
                            COALESCE(SUM(
                                CASE
                                    WHEN ur.race_status = 'COMPLETED'::race_status
                                     AND ur.chip_time IS NOT NULL
                                     AND ur.is_valid_for_category_ranking = TRUE
                                     AND ur.real_km IS NOT NULL
                                     AND urt.target_km IS NOT NULL
                                     AND ur.real_km >= GREATEST(urt.target_km - 0.30, 0)
                                    THEN 1
                                    ELSE 0
                                END
                            ), 0)::int AS best_efforts_tracked
                        FROM user_races ur
                        JOIN user_race_types urt ON urt.id = ur.race_type_id
                        WHERE ur.user_id = ?
                          AND ur.archived = FALSE
                          AND urt.name IS NOT NULL
                        GROUP BY urt.name
                        ORDER BY race_count DESC, lower(urt.name) ASC
                        """,
                (rs, rowNum) -> new ProfileSummaryResponse.RaceTypeSummary(
                        rs.getString("race_type_name"),
                        rs.getInt("race_count"),
                        rs.getInt("best_efforts_tracked")
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
}
