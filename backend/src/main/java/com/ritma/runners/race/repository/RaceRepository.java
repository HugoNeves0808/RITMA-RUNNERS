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
import com.ritma.runners.race.dto.RaceDetailResponse;
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
                    ur.circuit_id,
                    uc.name AS circuit_name,
                    ur.race_type_id,
                    urt.name AS race_type_name,
                    ur.official_time,
                    ur.chip_time,
                    ur.pace_per_km
                FROM user_races ur
                LEFT JOIN user_circuits uc ON uc.id = ur.circuit_id
                LEFT JOIN user_race_types urt ON urt.id = ur.race_type_id
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
                        rs.getObject("circuit_id", UUID.class),
                        rs.getString("circuit_name"),
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
                SELECT id, name, target_km
                FROM user_race_types
                WHERE user_id = ?
                  AND archived = FALSE
                ORDER BY lower(name) ASC
                """;

        return jdbcTemplate().query(
                sql,
                (rs, rowNum) -> new RaceTypeOptionResponse(
                        rs.getObject("id", UUID.class),
                        rs.getString("name"),
                        rs.getBigDecimal("target_km")
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
        if (optionType == RaceOptionType.RACE_TYPES) {
            return findRaceTypes(userId);
        }

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

    public int deleteRace(UUID userId, UUID raceId) {
        return jdbcTemplate().update(
                """
                        DELETE FROM user_races
                        WHERE user_id = ?
                          AND id = ?
                        """,
                userId,
                raceId
        );
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

    public RaceTypeOptionResponse createManagedOption(UUID userId, RaceOptionType optionType, String name, BigDecimal targetKm) {
        if (optionType == RaceOptionType.RACE_TYPES) {
            return jdbcTemplate().queryForObject(
                    "INSERT INTO " + optionType.tableName() + " (user_id, name, target_km) VALUES (?, ?, ?) RETURNING id, name, target_km",
                    (rs, rowNum) -> new RaceTypeOptionResponse(
                            rs.getObject("id", UUID.class),
                            rs.getString("name"),
                            rs.getBigDecimal("target_km")
                    ),
                    userId,
                    name,
                    targetKm
            );
        }

        UUID optionId = jdbcTemplate().queryForObject(
                "INSERT INTO " + optionType.tableName() + " (user_id, name) VALUES (?, ?) RETURNING id",
                UUID.class,
                userId,
                name
        );

        return new RaceTypeOptionResponse(optionId, name, null);
    }

    public boolean managedOptionExists(UUID userId, RaceOptionType optionType, UUID optionId) {
        return namedOptionExists(userId, optionId, optionType.tableName());
    }

    public RaceTypeOptionResponse updateManagedOption(UUID userId, RaceOptionType optionType, UUID optionId, String name, BigDecimal targetKm) {
        if (optionType == RaceOptionType.RACE_TYPES) {
            return jdbcTemplate().queryForObject(
                    "UPDATE " + optionType.tableName() + " SET name = ?, target_km = ? WHERE user_id = ? AND id = ? RETURNING id, name, target_km",
                    (rs, rowNum) -> new RaceTypeOptionResponse(
                            rs.getObject("id", UUID.class),
                            rs.getString("name"),
                            rs.getBigDecimal("target_km")
                    ),
                    name,
                    targetKm,
                    userId,
                    optionId
            );
        }

        jdbcTemplate().update(
                "UPDATE " + optionType.tableName() + " SET name = ? WHERE user_id = ? AND id = ?",
                name,
                userId,
                optionId
        );
        return new RaceTypeOptionResponse(optionId, name, null);
    }

    public int countManagedOptionUsage(UUID userId, RaceOptionType optionType, UUID optionId) {
        Integer count = jdbcTemplate().queryForObject(
                "SELECT COUNT(*) FROM " + optionType.referenceTableName() + " WHERE user_id = ? AND " + optionType.referenceColumnName() + " = ?",
                Integer.class,
                userId,
                optionId
        );

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
        return jdbcTemplate().query(
                "SELECT id, name, race_date FROM user_races WHERE user_id = ? AND " + optionType.referenceColumnName()
                        + " = ? ORDER BY race_date DESC NULLS LAST, lower(name) ASC",
                (rs, rowNum) -> new RaceOptionUsageItemResponse(
                        rs.getObject("id", UUID.class),
                        rs.getString("name"),
                        rs.getObject("race_date", LocalDate.class),
                        optionType == RaceOptionType.SHOES ? "Race results" : "Race data"
                ),
                userId,
                optionId
        );
    }

    public int detachManagedOptionUsage(UUID userId, RaceOptionType optionType, UUID optionId) {
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
        jdbcTemplate().update(
                """
                        UPDATE user_races
                        SET official_time = ?,
                            chip_time = ?,
                            pace_per_km = ?
                        WHERE id = ?
                        """,
                officialTimeSeconds,
                chipTimeSeconds,
                pacePerKmSeconds,
                raceId
        );
    }

    public void updateRace(UUID userId,
                           UUID raceId,
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
                           boolean isValidForCategoryRanking,
                           Integer officialTimeSeconds,
                           Integer chipTimeSeconds,
                           Integer pacePerKmSeconds,
                           UUID shoeId,
                           Integer generalClassification,
                           Integer ageGroupClassification,
                           Integer teamClassification,
                           String preRaceConfidence,
                           String raceDifficulty,
                           String finalSatisfaction,
                           String painInjuries,
                           String analysisNotes,
                           Boolean wouldRepeatThisRace) {
        jdbcTemplate().update(
                """
                        UPDATE user_races
                        SET race_status = ?::race_status,
                            race_date = ?,
                            race_time = ?,
                            name = ?,
                            location = ?,
                            team_id = ?,
                            circuit_id = ?,
                            race_type_id = ?,
                            real_km = ?,
                            elevation = ?,
                            is_valid_for_category_ranking = ?,
                            official_time = ?,
                            chip_time = ?,
                            pace_per_km = ?,
                            shoe_id = ?,
                            general_classification = ?,
                            age_group_classification = ?,
                            team_classification = ?,
                            pre_race_confidence = ?,
                            race_difficulty = ?,
                            final_satisfaction = ?,
                            pain_injuries = ?,
                            analysis_notes = ?,
                            would_repeat_this_race = ?
                        WHERE user_id = ?
                          AND id = ?
                        """,
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
                isValidForCategoryRanking,
                officialTimeSeconds,
                chipTimeSeconds,
                pacePerKmSeconds,
                shoeId,
                generalClassification,
                ageGroupClassification,
                teamClassification,
                preRaceConfidence,
                raceDifficulty,
                finalSatisfaction,
                painInjuries,
                analysisNotes,
                wouldRepeatThisRace,
                userId,
                raceId
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
                                        Integer ageGroupClassification,
                                        Integer teamClassification) {
        jdbcTemplate().update(
                """
                        UPDATE user_races
                        SET official_time = ?,
                            chip_time = ?,
                            pace_per_km = ?,
                            shoe_id = ?,
                            general_classification = ?,
                            age_group_classification = ?,
                            team_classification = ?
                        WHERE id = ?
                        """,
                officialTimeSeconds,
                chipTimeSeconds,
                pacePerKmSeconds,
                shoeId,
                generalClassification,
                ageGroupClassification,
                teamClassification,
                raceId
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

    public RaceDetailResponse findRaceDetail(UUID userId, UUID raceId) {
        List<RaceDetailResponse> results = jdbcTemplate().query(
                """
                        SELECT
                            ur.id,
                            ur.race_status::text AS race_status,
                            ur.race_date,
                            ur.race_time,
                            ur.name,
                            ur.location,
                            ur.team_id,
                            ut.name AS team_name,
                            ur.circuit_id,
                            uc.name AS circuit_name,
                            ur.race_type_id,
                            urt.name AS race_type_name,
                            ur.real_km,
                            ur.elevation,
                            ur.is_valid_for_category_ranking,
                            ur.official_time,
                            ur.chip_time,
                            ur.pace_per_km,
                            ur.shoe_id,
                            us.name AS shoe_name,
                            ur.general_classification,
                            ur.age_group_classification,
                            ur.team_classification,
                            ur.pre_race_confidence,
                            ur.race_difficulty,
                            ur.final_satisfaction,
                            ur.pain_injuries,
                            ur.analysis_notes,
                            ur.would_repeat_this_race
                        FROM user_races ur
                        LEFT JOIN user_teams ut ON ut.id = ur.team_id
                        LEFT JOIN user_circuits uc ON uc.id = ur.circuit_id
                        LEFT JOIN user_race_types urt ON urt.id = ur.race_type_id
                        LEFT JOIN user_shoes us ON us.id = ur.shoe_id
                        WHERE ur.user_id = ?
                          AND ur.id = ?
                        """,
                (rs, rowNum) -> new RaceDetailResponse(
                        rs.getObject("id", UUID.class),
                        new RaceDetailResponse.RaceData(
                                rs.getString("race_status"),
                                rs.getObject("race_date", LocalDate.class),
                                getNullableLocalTime(rs.getTime("race_time")),
                                rs.getString("name"),
                                rs.getString("location"),
                                rs.getObject("team_id", UUID.class),
                                rs.getString("team_name"),
                                rs.getObject("circuit_id", UUID.class),
                                rs.getString("circuit_name"),
                                rs.getObject("race_type_id", UUID.class),
                                rs.getString("race_type_name"),
                                rs.getBigDecimal("real_km"),
                                getNullableInteger(rs, "elevation"),
                                rs.getObject("is_valid_for_category_ranking", Boolean.class)
                        ),
                        new RaceDetailResponse.RaceResults(
                                getNullableInteger(rs, "official_time"),
                                getNullableInteger(rs, "chip_time"),
                                getNullableInteger(rs, "pace_per_km"),
                                rs.getObject("shoe_id", UUID.class),
                                rs.getString("shoe_name"),
                                getNullableInteger(rs, "general_classification"),
                                getNullableInteger(rs, "age_group_classification"),
                                getNullableInteger(rs, "team_classification")
                        ),
                        new RaceDetailResponse.RaceAnalysis(
                                rs.getString("pre_race_confidence"),
                                rs.getString("race_difficulty"),
                                rs.getString("final_satisfaction"),
                                rs.getString("pain_injuries"),
                                rs.getString("analysis_notes"),
                                rs.getObject("would_repeat_this_race", Boolean.class)
                        )
                ),
                userId,
                raceId
        );

        return results.isEmpty() ? null : results.get(0);
    }

    private List<RaceTypeOptionResponse> findNamedOptions(UUID userId, String tableName) {
        return jdbcTemplate().query(
                "SELECT id, name, NULL::numeric AS target_km FROM " + tableName + " WHERE user_id = ? ORDER BY lower(name) ASC",
                (rs, rowNum) -> new RaceTypeOptionResponse(
                        rs.getObject("id", UUID.class),
                        rs.getString("name"),
                        rs.getBigDecimal("target_km")
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
                        UPDATE user_races
                        SET pre_race_confidence = ?,
                            race_difficulty = ?,
                            final_satisfaction = ?,
                            pain_injuries = ?,
                            analysis_notes = ?,
                            would_repeat_this_race = ?
                        WHERE id = ?
                        """,
                preRaceConfidence,
                raceDifficulty,
                finalSatisfaction,
                painInjuries,
                analysisNotes,
                wouldRepeatThisRace,
                raceId
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
