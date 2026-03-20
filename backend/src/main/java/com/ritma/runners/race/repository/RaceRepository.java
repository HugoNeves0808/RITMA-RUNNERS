package com.ritma.runners.race.repository;

import java.sql.Time;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.ritma.runners.race.dto.RaceCalendarItemResponse;
import com.ritma.runners.race.dto.RaceTableItemResponse;
import com.ritma.runners.race.dto.RaceTypeOptionResponse;

@Repository
public class RaceRepository {

    private final ObjectProvider<JdbcTemplate> jdbcTemplateProvider;

    public RaceRepository(ObjectProvider<JdbcTemplate> jdbcTemplateProvider) {
        this.jdbcTemplateProvider = jdbcTemplateProvider;
    }

    public List<RaceCalendarItemResponse> findCalendarRacesForMonth(UUID userId, LocalDate startDate, LocalDate endDate) {
        return findCalendarRacesForRange(userId, startDate, endDate);
    }

    public List<RaceCalendarItemResponse> findCalendarRacesForRange(UUID userId, LocalDate startDate, LocalDate endDate) {
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

    public List<RaceTableItemResponse> findTableRaces(UUID userId) {
        String sql = """
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
                  AND ur.race_date IS NOT NULL
                ORDER BY EXTRACT(YEAR FROM ur.race_date) DESC, ur.race_date DESC, ur.race_time DESC NULLS LAST, lower(ur.name) ASC
                """;

        return jdbcTemplate().query(
                sql,
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
                userId
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
        Integer count = jdbcTemplate().queryForObject(
                """
                        SELECT COUNT(*)
                        FROM user_race_types
                        WHERE user_id = ?
                          AND id = ?
                        """,
                Integer.class,
                userId,
                raceTypeId
        );

        return count != null && count > 0;
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

    private LocalTime getNullableLocalTime(Time value) {
        return value != null ? value.toLocalTime() : null;
    }

    private Integer getNullableInteger(java.sql.ResultSet rs, String columnName) throws java.sql.SQLException {
        int value = rs.getInt(columnName);
        return rs.wasNull() ? null : value;
    }
}
