package com.ritma.runners.race.repository;

import java.sql.Time;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.ritma.runners.race.dto.RaceOptionType;
import com.ritma.runners.race.dto.RaceOptionUsageItemResponse;
import com.ritma.runners.race.dto.RaceCalendarItemResponse;
import com.ritma.runners.race.dto.RaceQueryFilters;
import com.ritma.runners.race.dto.RaceTableItemResponse;
import com.ritma.runners.race.dto.RaceTypeOptionResponse;

@Repository
public class RaceRepository {

    private final ObjectProvider<JdbcTemplate> jdbcTemplateProvider;

    public RaceRepository(ObjectProvider<JdbcTemplate> jdbcTemplateProvider) {
        this.jdbcTemplateProvider = jdbcTemplateProvider;
    }

    public List<RaceCalendarItemResponse> findCalendarRacesForMonth(UUID userId,
                                                                    LocalDate startDate,
                                                                    LocalDate endDate,
                                                                    RaceQueryFilters filters) {
        return findCalendarRacesForRange(userId, startDate, endDate, filters);
    }

    public List<RaceCalendarItemResponse> findCalendarRacesForRange(UUID userId,
                                                                    LocalDate startDate,
                                                                    LocalDate endDate,
                                                                    RaceQueryFilters filters) {
        StringBuilder sql = new StringBuilder("""
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
                """);
        List<Object> args = new ArrayList<>(List.of(userId, startDate, endDate));
        appendRaceFilters(sql, args, filters);
        sql.append("""
                ORDER BY ur.race_date ASC, ur.race_time ASC NULLS LAST, lower(ur.name) ASC
                """);

        return jdbcTemplate().query(
                sql.toString(),
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
                args.toArray()
        );
    }

    public List<RaceTableItemResponse> findTableRaces(UUID userId, RaceQueryFilters filters) {
        StringBuilder sql = new StringBuilder("""
                SELECT
                    ur.id,
                    ROW_NUMBER() OVER (
                        ORDER BY ur.race_date ASC, ur.race_time ASC NULLS LAST, lower(ur.name) ASC
                    ) AS race_number,
                    ur.race_date,
                    ur.race_time,
                    ur.race_status::text AS race_status,
                    ur.name,
                    ur.location,
                    ur.race_type_id,
                    urt.name AS race_type_name,
                    urr.official_time,
                    urr.chip_time,
                    urr.pace_per_km
                FROM user_races ur
                LEFT JOIN user_race_types urt ON urt.id = ur.race_type_id
                LEFT JOIN user_race_results urr ON urr.user_race_id = ur.id
                WHERE ur.user_id = ?
                """);
        List<Object> args = new ArrayList<>(List.of(userId));
        appendRaceFilters(sql, args, filters);
        sql.append("""
                ORDER BY
                    CASE WHEN ur.race_date IS NULL THEN 1 ELSE 0 END,
                    EXTRACT(YEAR FROM ur.race_date) DESC NULLS LAST,
                    ur.race_date DESC NULLS LAST,
                    ur.race_time DESC NULLS LAST,
                    lower(ur.name) ASC
                """);

        return jdbcTemplate().query(
                sql.toString(),
                (rs, rowNum) -> new RaceTableItemResponse(
                        rs.getObject("id", UUID.class),
                        rs.getInt("race_number"),
                        rs.getObject("race_date", LocalDate.class),
                        getNullableLocalTime(rs.getTime("race_time")),
                        rs.getString("race_status"),
                        rs.getString("name"),
                        rs.getString("location"),
                        rs.getObject("race_type_id", UUID.class),
                        rs.getString("race_type_name"),
                        getNullableInteger(rs, "official_time"),
                        getNullableInteger(rs, "chip_time"),
                        getNullableInteger(rs, "pace_per_km")
                ),
                args.toArray()
        );
    }

    public List<RaceTypeOptionResponse> findRaceTypes(UUID userId) {
        String sql = """
                SELECT id, name
                FROM user_race_types
                WHERE user_id = ?
                  AND archived = FALSE
                ORDER BY lower(name) ASC
                """;

        return jdbcTemplate().query(
                sql,
                (rs, rowNum) -> new RaceTypeOptionResponse(
                        rs.getObject("id", UUID.class),
                        rs.getString("name")
                ),
                userId
        );
    }

    public List<RaceTypeOptionResponse> findTeams(UUID userId) {
        return findNamedOptions(userId, RaceOptionType.TEAMS.tableName());
    }

    public List<RaceTypeOptionResponse> findCircuits(UUID userId) {
        return findNamedOptions(userId, RaceOptionType.CIRCUITS.tableName());
    }

    public List<RaceTypeOptionResponse> findShoes(UUID userId) {
        return findNamedOptions(userId, RaceOptionType.SHOES.tableName());
    }

    public List<RaceTypeOptionResponse> findManagedOptions(UUID userId, RaceOptionType optionType) {
        return findNamedOptions(userId, optionType.tableName());
    }

    public List<Integer> findAvailableYears(UUID userId) {
        return jdbcTemplate().query(
                """
                        SELECT DISTINCT EXTRACT(YEAR FROM race_date)::int AS year
                        FROM user_races
                        WHERE user_id = ?
                          AND race_date IS NOT NULL
                        ORDER BY year DESC
                        """,
                (rs, rowNum) -> rs.getInt("year"),
                userId
        );
    }

    public boolean raceExists(UUID userId, UUID raceId) {
        Integer count = jdbcTemplate().queryForObject(
                """
                        SELECT COUNT(*)
                        FROM user_races
                        WHERE user_id = ?
                          AND id = ?
                        """,
                Integer.class,
                userId,
                raceId
        );

        return count != null && count > 0;
    }

    public boolean raceTypeExists(UUID userId, UUID raceTypeId) {
        return namedOptionExists(userId, raceTypeId, RaceOptionType.RACE_TYPES.tableName());
    }

    public boolean teamExists(UUID userId, UUID teamId) {
        return namedOptionExists(userId, teamId, RaceOptionType.TEAMS.tableName());
    }

    public boolean circuitExists(UUID userId, UUID circuitId) {
        return namedOptionExists(userId, circuitId, RaceOptionType.CIRCUITS.tableName());
    }

    public boolean shoeExists(UUID userId, UUID shoeId) {
        return namedOptionExists(userId, shoeId, RaceOptionType.SHOES.tableName());
    }

    public UUID createManagedOption(UUID userId, RaceOptionType optionType, String name) {
        return jdbcTemplate().queryForObject(
                "INSERT INTO " + optionType.tableName() + " (user_id, name) VALUES (?, ?) RETURNING id",
                UUID.class,
                userId,
                name
        );
    }

    public boolean managedOptionExists(UUID userId, RaceOptionType optionType, UUID optionId) {
        return namedOptionExists(userId, optionId, optionType.tableName());
    }

    public void updateManagedOption(UUID userId, RaceOptionType optionType, UUID optionId, String name) {
        jdbcTemplate().update(
                "UPDATE " + optionType.tableName() + " SET name = ? WHERE user_id = ? AND id = ?",
                name,
                userId,
                optionId
        );
    }

    public int countManagedOptionUsage(UUID userId, RaceOptionType optionType, UUID optionId) {
        Integer count;
        if (optionType == RaceOptionType.RACE_TYPES
                || optionType == RaceOptionType.TEAMS
                || optionType == RaceOptionType.CIRCUITS) {
            count = jdbcTemplate().queryForObject(
                    "SELECT COUNT(*) FROM " + optionType.referenceTableName() + " WHERE user_id = ? AND " + optionType.referenceColumnName() + " = ?",
                    Integer.class,
                    userId,
                    optionId
            );
        } else {
            count = jdbcTemplate().queryForObject(
                    "SELECT COUNT(*) FROM " + optionType.referenceTableName()
                            + " ref JOIN user_races ur ON ur.id = ref.user_race_id WHERE ur.user_id = ? AND ref." + optionType.referenceColumnName() + " = ?",
                    Integer.class,
                    userId,
                    optionId
            );
        }

        return count == null ? 0 : count;
    }

    public int deleteManagedOption(UUID userId, RaceOptionType optionType, UUID optionId) {
        return jdbcTemplate().update(
                "DELETE FROM " + optionType.tableName() + " WHERE user_id = ? AND id = ?",
                userId,
                optionId
        );
    }

    public List<RaceOptionUsageItemResponse> findManagedOptionUsage(UUID userId, RaceOptionType optionType, UUID optionId) {
        if (optionType == RaceOptionType.SHOES) {
            return jdbcTemplate().query(
                    """
                            SELECT ur.id, ur.name, ur.race_date
                            FROM user_race_results urr
                            JOIN user_races ur ON ur.id = urr.user_race_id
                            WHERE ur.user_id = ?
                              AND urr.shoe_id = ?
                            ORDER BY ur.race_date DESC NULLS LAST, lower(ur.name) ASC
                            """,
                    (rs, rowNum) -> new RaceOptionUsageItemResponse(
                            rs.getObject("id", UUID.class),
                            rs.getString("name"),
                            rs.getObject("race_date", LocalDate.class),
                            "Race results"
                    ),
                    userId,
                    optionId
            );
        }

        return jdbcTemplate().query(
                "SELECT id, name, race_date FROM user_races WHERE user_id = ? AND " + optionType.referenceColumnName()
                        + " = ? ORDER BY race_date DESC NULLS LAST, lower(name) ASC",
                (rs, rowNum) -> new RaceOptionUsageItemResponse(
                        rs.getObject("id", UUID.class),
                        rs.getString("name"),
                        rs.getObject("race_date", LocalDate.class),
                        "Race data"
                ),
                userId,
                optionId
        );
    }

    public int detachManagedOptionUsage(UUID userId, RaceOptionType optionType, UUID optionId) {
        if (optionType == RaceOptionType.SHOES) {
            return jdbcTemplate().update(
                    """
                            UPDATE user_race_results urr
                            SET shoe_id = NULL
                            FROM user_races ur
                            WHERE ur.id = urr.user_race_id
                              AND ur.user_id = ?
                              AND urr.shoe_id = ?
                            """,
                    userId,
                    optionId
            );
        }

        return jdbcTemplate().update(
                "UPDATE user_races SET " + optionType.referenceColumnName() + " = NULL WHERE user_id = ? AND "
                        + optionType.referenceColumnName() + " = ?",
                userId,
                optionId
        );
    }

    public void updateRace(UUID userId, UUID raceId, LocalDate raceDate, String name, String location, UUID raceTypeId) {
        jdbcTemplate().update(
                """
                        UPDATE user_races
                        SET race_date = ?, name = ?, location = ?, race_type_id = ?
                        WHERE user_id = ?
                          AND id = ?
                        """,
                raceDate,
                name,
                location,
                raceTypeId,
                userId,
                raceId
        );
    }

    public void upsertRaceResult(UUID raceId, Integer officialTimeSeconds, Integer chipTimeSeconds, Integer pacePerKmSeconds) {
        if (officialTimeSeconds == null && chipTimeSeconds == null && pacePerKmSeconds == null) {
            Integer count = jdbcTemplate().queryForObject(
                    """
                            SELECT COUNT(*)
                            FROM user_race_results
                            WHERE user_race_id = ?
                            """,
                    Integer.class,
                    raceId
            );

            if (count == null || count == 0) {
                return;
            }
        }

        jdbcTemplate().update(
                """
                        INSERT INTO user_race_results (user_race_id, official_time, chip_time, pace_per_km)
                        VALUES (?, ?, ?, ?)
                        ON CONFLICT (user_race_id)
                        DO UPDATE
                        SET official_time = EXCLUDED.official_time,
                            chip_time = EXCLUDED.chip_time,
                            pace_per_km = EXCLUDED.pace_per_km
                        """,
                raceId,
                officialTimeSeconds,
                chipTimeSeconds,
                pacePerKmSeconds
        );
    }

    public UUID createRace(UUID userId,
                           String raceStatus,
                           LocalDate raceDate,
                           LocalTime raceTime,
                           String name,
                           String location,
                           UUID teamId,
                           UUID circuitId,
                           UUID raceTypeId,
                           BigDecimal realKm,
                           Integer elevation,
                           boolean isValidForCategoryRanking) {
        return jdbcTemplate().queryForObject(
                """
                        INSERT INTO user_races (
                            user_id,
                            race_status,
                            race_date,
                            race_time,
                            name,
                            location,
                            team_id,
                            circuit_id,
                            race_type_id,
                            real_km,
                            elevation,
                            is_valid_for_category_ranking
                        )
                        VALUES (?, ?::race_status, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        RETURNING id
                        """,
                UUID.class,
                userId,
                raceStatus,
                raceDate,
                raceTime,
                name,
                location,
                teamId,
                circuitId,
                raceTypeId,
                realKm,
                elevation,
                isValidForCategoryRanking
        );
    }

    public void upsertRaceResultDetails(UUID raceId,
                                        Integer officialTimeSeconds,
                                        Integer chipTimeSeconds,
                                        Integer pacePerKmSeconds,
                                        UUID shoeId,
                                        Integer generalClassification,
                                        Boolean isGeneralClassificationPodium,
                                        Integer ageGroupClassification,
                                        Boolean isAgeGroupClassificationPodium,
                                        Integer teamClassification,
                                        Boolean isTeamClassificationPodium) {
        jdbcTemplate().update(
                """
                        INSERT INTO user_race_results (
                            user_race_id,
                            official_time,
                            chip_time,
                            pace_per_km,
                            shoe_id,
                            general_classification,
                            is_general_classification_podium,
                            age_group_classification,
                            is_age_group_classification_podium,
                            team_classification,
                            is_team_classification_podium
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        ON CONFLICT (user_race_id)
                        DO UPDATE
                        SET official_time = EXCLUDED.official_time,
                            chip_time = EXCLUDED.chip_time,
                            pace_per_km = EXCLUDED.pace_per_km,
                            shoe_id = EXCLUDED.shoe_id,
                            general_classification = EXCLUDED.general_classification,
                            is_general_classification_podium = EXCLUDED.is_general_classification_podium,
                            age_group_classification = EXCLUDED.age_group_classification,
                            is_age_group_classification_podium = EXCLUDED.is_age_group_classification_podium,
                            team_classification = EXCLUDED.team_classification,
                            is_team_classification_podium = EXCLUDED.is_team_classification_podium
                        """,
                raceId,
                officialTimeSeconds,
                chipTimeSeconds,
                pacePerKmSeconds,
                shoeId,
                generalClassification,
                isGeneralClassificationPodium != null && isGeneralClassificationPodium,
                ageGroupClassification,
                isAgeGroupClassificationPodium != null && isAgeGroupClassificationPodium,
                teamClassification,
                isTeamClassificationPodium != null && isTeamClassificationPodium
        );
    }

    private boolean namedOptionExists(UUID userId, UUID optionId, String tableName) {
        Integer count = jdbcTemplate().queryForObject(
                "SELECT COUNT(*) FROM " + tableName + " WHERE user_id = ? AND id = ?",
                Integer.class,
                userId,
                optionId
        );

        return count != null && count > 0;
    }

    private List<RaceTypeOptionResponse> findNamedOptions(UUID userId, String tableName) {
        return jdbcTemplate().query(
                "SELECT id, name FROM " + tableName + " WHERE user_id = ? ORDER BY lower(name) ASC",
                (rs, rowNum) -> new RaceTypeOptionResponse(
                        rs.getObject("id", UUID.class),
                        rs.getString("name")
                ),
                userId
        );
    }

    public void upsertRaceAnalysis(UUID raceId,
                                   String preRaceConfidence,
                                   String raceDifficulty,
                                   String finalSatisfaction,
                                   String painInjuries,
                                   String analysisNotes,
                                   Boolean wouldRepeatThisRace) {
        jdbcTemplate().update(
                """
                        INSERT INTO user_race_analysis (
                            user_race_id,
                            pre_race_confidence,
                            race_difficulty,
                            final_satisfaction,
                            pain_injuries,
                            analysis_notes,
                            would_repeat_this_race
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                        ON CONFLICT (user_race_id)
                        DO UPDATE
                        SET pre_race_confidence = EXCLUDED.pre_race_confidence,
                            race_difficulty = EXCLUDED.race_difficulty,
                            final_satisfaction = EXCLUDED.final_satisfaction,
                            pain_injuries = EXCLUDED.pain_injuries,
                            analysis_notes = EXCLUDED.analysis_notes,
                            would_repeat_this_race = EXCLUDED.would_repeat_this_race
                        """,
                raceId,
                preRaceConfidence,
                raceDifficulty,
                finalSatisfaction,
                painInjuries,
                analysisNotes,
                wouldRepeatThisRace
        );
    }

    public int countExistingRaces(UUID userId, List<UUID> raceIds) {
        if (raceIds.isEmpty()) {
            return 0;
        }

        String placeholders = String.join(", ", java.util.Collections.nCopies(raceIds.size(), "?"));
        List<Object> args = new ArrayList<>();
        args.add(userId);
        args.addAll(raceIds);

        Integer count = jdbcTemplate().queryForObject(
                """
                        SELECT COUNT(*)
                        FROM user_races
                        WHERE user_id = ?
                          AND id IN ("""
                        + placeholders
                        + ")",
                Integer.class,
                args.toArray()
        );

        return count == null ? 0 : count;
    }

    public int deleteRaces(UUID userId, List<UUID> raceIds) {
        if (raceIds.isEmpty()) {
            return 0;
        }

        String placeholders = String.join(", ", java.util.Collections.nCopies(raceIds.size(), "?"));
        List<Object> args = new ArrayList<>();
        args.add(userId);
        args.addAll(raceIds);

        return jdbcTemplate().update(
                """
                        DELETE FROM user_races
                        WHERE user_id = ?
                          AND id IN ("""
                        + placeholders
                        + ")",
                args.toArray()
        );
    }

    private JdbcTemplate jdbcTemplate() {
        JdbcTemplate jdbcTemplate = jdbcTemplateProvider.getIfAvailable();
        if (jdbcTemplate == null) {
            throw new IllegalStateException("JdbcTemplate is not available");
        }
        return jdbcTemplate;
    }

    private void appendRaceFilters(StringBuilder sql, List<Object> args, RaceQueryFilters filters) {
        if (filters == null) {
            return;
        }

        if (filters.search() != null) {
            sql.append(" AND lower(ur.name) LIKE ?");
            args.add("%" + filters.search().toLowerCase(java.util.Locale.ROOT) + "%");
        }

        if (!filters.statuses().isEmpty()) {
            sql.append(" AND ur.race_status::text IN (");
            sql.append(String.join(", ", Collections.nCopies(filters.statuses().size(), "?")));
            sql.append(")");
            args.addAll(filters.statuses());
        }

        if (!filters.years().isEmpty()) {
            sql.append(" AND EXTRACT(YEAR FROM ur.race_date)::int IN (");
            sql.append(String.join(", ", Collections.nCopies(filters.years().size(), "?")));
            sql.append(")");
            args.addAll(filters.years());
        }

        if (!filters.raceTypeIds().isEmpty()) {
            sql.append(" AND ur.race_type_id IN (");
            sql.append(String.join(", ", Collections.nCopies(filters.raceTypeIds().size(), "?")));
            sql.append(")");
            args.addAll(filters.raceTypeIds());
        }
    }

    private LocalTime getNullableLocalTime(Time value) {
        return value != null ? value.toLocalTime() : null;
    }

    private Integer getNullableInteger(java.sql.ResultSet rs, String columnName) throws java.sql.SQLException {
        int value = rs.getInt(columnName);
        return rs.wasNull() ? null : value;
    }
}
