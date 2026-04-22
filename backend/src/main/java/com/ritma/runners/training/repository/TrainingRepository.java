package com.ritma.runners.training.repository;

import java.sql.Array;
import java.sql.Time;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.ritma.runners.training.dto.AssociatedRaceOptionResponse;
import com.ritma.runners.training.dto.TrainingFilters;
import com.ritma.runners.training.dto.TrainingTableItemResponse;
import com.ritma.runners.training.dto.TrainingTypeOptionResponse;

@Repository
public class TrainingRepository {
    private static final String TRAINING_STATUS_SQL = """
            CASE
                WHEN uct.completed_at IS NOT NULL THEN 'REALIZADO'
                WHEN uct.training_date < CURRENT_DATE + INTERVAL '7 days' THEN 'PLANEADO'
                ELSE 'AGENDADO'
            END
            """;

    private final ObjectProvider<JdbcTemplate> jdbcTemplateProvider;

    public TrainingRepository(ObjectProvider<JdbcTemplate> jdbcTemplateProvider) {
        this.jdbcTemplateProvider = jdbcTemplateProvider;
    }

    public List<TrainingTableItemResponse> findTrainings(UUID userId, TrainingFilters filters) {
        StringBuilder sql = new StringBuilder("""
                SELECT
                    uct.id,
                    uct.training_date,
                    uct.training_time,
                    uct.created_at,
                    uct.name,
                    uct.training_type_id,
                    uctt.name AS training_type_name,
                    uct.notes,
                    """ + TRAINING_STATUS_SQL + """
                     AS training_status,
                    (uct.completed_at IS NOT NULL) AS completed,
                    uct.associated_race_id,
                    ur.name AS associated_race_name,
                    ur.race_date AS associated_race_date,
                    uct.series_id,
                    uct.series_interval_weeks,
                    uct.series_until_date,
                    uct.series_days_of_week
                FROM user_custom_trainings uct
                LEFT JOIN user_custom_training_types uctt ON uctt.id = uct.training_type_id
                LEFT JOIN user_races ur ON ur.id = uct.associated_race_id
                WHERE uct.user_id = ?
                """);
        List<Object> args = new ArrayList<>(List.of(userId));
        appendTrainingFilters(sql, args, filters);
        sql.append("""
                ORDER BY
                    CASE WHEN uct.associated_race_id IS NULL THEN 1 ELSE 0 END,
                    ur.race_date DESC NULLS LAST,
                    lower(ur.name) ASC NULLS LAST,
                    uct.training_date ASC,
                    uct.training_time ASC NULLS LAST,
                    CASE WHEN uct.training_time IS NULL THEN uct.created_at END DESC NULLS LAST,
                    lower(uct.name) ASC
                """);

        return jdbcTemplate().query(
                sql.toString(),
                (rs, rowNum) -> new TrainingTableItemResponse(
                        rs.getObject("id", UUID.class),
                        rs.getObject("training_date", LocalDate.class),
                        getNullableLocalTime(rs.getTime("training_time")),
                        rs.getObject("created_at", OffsetDateTime.class),
                        rs.getString("name"),
                        rs.getObject("training_type_id", UUID.class),
                        rs.getString("training_type_name"),
                        rs.getString("notes"),
                        rs.getString("training_status"),
                        rs.getBoolean("completed"),
                        rs.getObject("associated_race_id", UUID.class),
                        rs.getString("associated_race_name"),
                        rs.getObject("associated_race_date", LocalDate.class),
                        rs.getObject("series_id", UUID.class),
                        getNullableInteger(rs, "series_interval_weeks"),
                        rs.getObject("series_until_date", LocalDate.class),
                        readDayOfWeekArray(rs.getArray("series_days_of_week"))
                ),
                args.toArray()
        );
    }

    public List<TrainingTypeOptionResponse> findTrainingTypes(UUID userId, boolean includeArchived) {
        StringBuilder sql = new StringBuilder("""
                SELECT id, name, archived
                FROM user_custom_training_types
                WHERE user_id = ?
                """);

        if (!includeArchived) {
            sql.append(" AND archived = FALSE");
        }

        sql.append(" ORDER BY lower(name) ASC");

        return jdbcTemplate().query(
                sql.toString(),
                (rs, rowNum) -> new TrainingTypeOptionResponse(
                        rs.getObject("id", UUID.class),
                        rs.getString("name"),
                        rs.getBoolean("archived")
                ),
                userId
        );
    }

    public List<AssociatedRaceOptionResponse> findAssociatedRaceOptions(UUID userId) {
        return jdbcTemplate().query(
                """
                        SELECT id, name, race_date, race_status
                        FROM user_races
                        WHERE user_id = ?
                        ORDER BY race_date DESC NULLS LAST, lower(name) ASC
                        """,
                (rs, rowNum) -> new AssociatedRaceOptionResponse(
                        rs.getObject("id", UUID.class),
                        rs.getString("name"),
                        rs.getObject("race_date", LocalDate.class),
                        rs.getString("race_status")
                ),
                userId
        );
    }

    public boolean trainingExists(UUID userId, UUID trainingId) {
        Integer count = jdbcTemplate().queryForObject(
                """
                        SELECT COUNT(*)
                        FROM user_custom_trainings
                        WHERE user_id = ?
                          AND id = ?
                        """,
                Integer.class,
                userId,
                trainingId
        );
        return count != null && count > 0;
    }

    public boolean trainingTypeExists(UUID userId, UUID trainingTypeId) {
        Integer count = jdbcTemplate().queryForObject(
                """
                        SELECT COUNT(*)
                        FROM user_custom_training_types
                        WHERE user_id = ?
                          AND id = ?
                        """,
                Integer.class,
                userId,
                trainingTypeId
        );
        return count != null && count > 0;
    }

    public boolean associatedRaceExists(UUID userId, UUID raceId) {
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

    public UUID createTraining(UUID userId,
                               LocalDate trainingDate,
                               LocalTime trainingTime,
                               String name,
                               UUID trainingTypeId,
                               String notes,
                               UUID associatedRaceId,
                               UUID seriesId,
                               Integer seriesIntervalWeeks,
                               LocalDate seriesUntilDate,
                               List<Integer> seriesDaysOfWeek) {
        return jdbcTemplate().queryForObject(
                """
                        INSERT INTO user_custom_trainings (
                            user_id,
                            training_date,
                            training_time,
                            name,
                            training_type_id,
                            notes,
                            associated_race_id,
                            series_id,
                            series_interval_weeks,
                            series_until_date,
                            series_days_of_week
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        RETURNING id
                        """,
                UUID.class,
                userId,
                trainingDate,
                trainingTime,
                name,
                trainingTypeId,
                notes,
                associatedRaceId,
                seriesId,
                seriesIntervalWeeks,
                seriesUntilDate,
                toShortArray(seriesDaysOfWeek)
        );
    }

    public void updateTraining(UUID userId,
                               UUID trainingId,
                               LocalDate trainingDate,
                               LocalTime trainingTime,
                               String name,
                               UUID trainingTypeId,
                               String notes,
                               UUID associatedRaceId,
                               UUID seriesId,
                               Integer seriesIntervalWeeks,
                               LocalDate seriesUntilDate,
                               List<Integer> seriesDaysOfWeek) {
        jdbcTemplate().update(
                """
                        UPDATE user_custom_trainings
                        SET training_date = ?,
                            training_time = ?,
                            name = ?,
                            training_type_id = ?,
                            notes = ?,
                            associated_race_id = ?,
                            series_id = ?,
                            series_interval_weeks = ?,
                            series_until_date = ?,
                            series_days_of_week = ?
                        WHERE user_id = ?
                          AND id = ?
                        """,
                trainingDate,
                trainingTime,
                name,
                trainingTypeId,
                notes,
                associatedRaceId,
                seriesId,
                seriesIntervalWeeks,
                seriesUntilDate,
                toShortArray(seriesDaysOfWeek),
                userId,
                trainingId
        );
    }

    public void updateTrainingCompleted(UUID userId, UUID trainingId, boolean completed) {
        jdbcTemplate().update(
                """
                        UPDATE user_custom_trainings
                        SET completed_at = ?
                        WHERE user_id = ?
                          AND id = ?
                        """,
                completed ? LocalDateTime.now() : null,
                userId,
                trainingId
        );
    }

    public void deleteTraining(UUID userId, UUID trainingId) {
        jdbcTemplate().update(
                """
                        DELETE FROM user_custom_trainings
                        WHERE user_id = ?
                          AND id = ?
                        """,
                userId,
                trainingId
        );
    }

    public void deleteTrainingSeries(UUID userId, UUID seriesId) {
        jdbcTemplate().update(
                """
                        DELETE FROM user_custom_trainings
                        WHERE user_id = ?
                          AND series_id = ?
                        """,
                userId,
                seriesId
        );
    }

    public TrainingTableItemResponse findTraining(UUID userId, UUID trainingId) {
        List<TrainingTableItemResponse> results = jdbcTemplate().query(
                """
                        SELECT
                            uct.id,
                            uct.training_date,
                            uct.training_time,
                            uct.created_at,
                            uct.name,
                            uct.training_type_id,
                            uctt.name AS training_type_name,
                            uct.notes,
                            """ + TRAINING_STATUS_SQL + """
                             AS training_status,
                            (uct.completed_at IS NOT NULL) AS completed,
                            uct.associated_race_id,
                            ur.name AS associated_race_name,
                            ur.race_date AS associated_race_date,
                            uct.series_id,
                            uct.series_interval_weeks,
                            uct.series_until_date,
                            uct.series_days_of_week
                        FROM user_custom_trainings uct
                LEFT JOIN user_custom_training_types uctt ON uctt.id = uct.training_type_id
                        LEFT JOIN user_races ur ON ur.id = uct.associated_race_id
                        WHERE uct.user_id = ?
                          AND uct.id = ?
                        """,
                (rs, rowNum) -> new TrainingTableItemResponse(
                        rs.getObject("id", UUID.class),
                        rs.getObject("training_date", LocalDate.class),
                        getNullableLocalTime(rs.getTime("training_time")),
                        rs.getObject("created_at", OffsetDateTime.class),
                        rs.getString("name"),
                        rs.getObject("training_type_id", UUID.class),
                        rs.getString("training_type_name"),
                        rs.getString("notes"),
                        rs.getString("training_status"),
                        rs.getBoolean("completed"),
                        rs.getObject("associated_race_id", UUID.class),
                        rs.getString("associated_race_name"),
                        rs.getObject("associated_race_date", LocalDate.class),
                        rs.getObject("series_id", UUID.class),
                        getNullableInteger(rs, "series_interval_weeks"),
                        rs.getObject("series_until_date", LocalDate.class),
                        readDayOfWeekArray(rs.getArray("series_days_of_week"))
                ),
                userId,
                trainingId
        );

        return results.isEmpty() ? null : results.get(0);
    }

    public TrainingTypeOptionResponse createTrainingType(UUID userId, String name) {
        return jdbcTemplate().queryForObject(
                """
                        INSERT INTO user_custom_training_types (user_id, name)
                        VALUES (?, ?)
                        RETURNING id, name, archived
                        """,
                (rs, rowNum) -> new TrainingTypeOptionResponse(
                        rs.getObject("id", UUID.class),
                        rs.getString("name"),
                        rs.getBoolean("archived")
                ),
                userId,
                name
        );
    }

    public TrainingTypeOptionResponse updateTrainingType(UUID userId, UUID trainingTypeId, String name) {
        return jdbcTemplate().queryForObject(
                """
                        UPDATE user_custom_training_types
                        SET name = ?
                        WHERE user_id = ?
                          AND id = ?
                        RETURNING id, name, archived
                        """,
                (rs, rowNum) -> new TrainingTypeOptionResponse(
                        rs.getObject("id", UUID.class),
                        rs.getString("name"),
                        rs.getBoolean("archived")
                ),
                name,
                userId,
                trainingTypeId
        );
    }

    public TrainingTypeOptionResponse updateTrainingTypeArchived(UUID userId, UUID trainingTypeId, boolean archived) {
        return jdbcTemplate().queryForObject(
                """
                        UPDATE user_custom_training_types
                        SET archived = ?
                        WHERE user_id = ?
                          AND id = ?
                        RETURNING id, name, archived
                        """,
                (rs, rowNum) -> new TrainingTypeOptionResponse(
                        rs.getObject("id", UUID.class),
                        rs.getString("name"),
                        rs.getBoolean("archived")
                ),
                archived,
                userId,
                trainingTypeId
        );
    }

    public void deleteTrainingType(UUID userId, UUID trainingTypeId) {
        jdbcTemplate().update(
                """
                        DELETE FROM user_custom_training_types
                        WHERE user_id = ?
                          AND id = ?
                        """,
                userId,
                trainingTypeId
        );
    }

    public int countTrainingTypeUsage(UUID userId, UUID trainingTypeId) {
        Integer count = jdbcTemplate().queryForObject(
                """
                        SELECT COUNT(*)
                        FROM user_custom_trainings
                        WHERE user_id = ?
                          AND training_type_id = ?
                        """,
                Integer.class,
                userId,
                trainingTypeId
        );
        return count == null ? 0 : count;
    }

    private void appendTrainingFilters(StringBuilder sql, List<Object> args, TrainingFilters filters) {
        if (filters == null) {
            return;
        }

        if (filters.search() != null) {
            sql.append(" AND lower(uct.name) LIKE ?");
            args.add("%" + filters.search().toLowerCase(Locale.ROOT) + "%");
        }

        if (!filters.statuses().isEmpty()) {
            sql.append(" AND (").append(TRAINING_STATUS_SQL).append(") IN (");
            sql.append(String.join(", ", Collections.nCopies(filters.statuses().size(), "?")));
            sql.append(")");
            args.addAll(filters.statuses());
        }

        if (!filters.trainingTypeIds().isEmpty()) {
            sql.append(" AND uct.training_type_id IN (");
            sql.append(String.join(", ", Collections.nCopies(filters.trainingTypeIds().size(), "?")));
            sql.append(")");
            args.addAll(filters.trainingTypeIds());
        }

        if (!filters.associations().isEmpty()) {
            List<String> normalizedAssociations = filters.associations().stream()
                    .map(value -> value.trim().toLowerCase(Locale.ROOT))
                    .toList();
            boolean includeAssociated = normalizedAssociations.contains("associated");
            boolean includeIndividual = normalizedAssociations.contains("individual");
            if (includeAssociated ^ includeIndividual) {
                sql.append(includeAssociated ? " AND uct.associated_race_id IS NOT NULL" : " AND uct.associated_race_id IS NULL");
            }
        }
    }

    private Short[] toShortArray(List<Integer> values) {
        if (values == null || values.isEmpty()) {
            return null;
        }

        return values.stream()
                .map(Integer::shortValue)
                .toArray(Short[]::new);
    }

    private List<Integer> readDayOfWeekArray(Array value) throws java.sql.SQLException {
        if (value == null) {
            return List.of();
        }

        Object rawArray = value.getArray();
        if (!(rawArray instanceof Short[] days)) {
            return List.of();
        }

        List<Integer> normalizedDays = new ArrayList<>(days.length);
        for (Short day : days) {
            if (day != null) {
                normalizedDays.add(day.intValue());
            }
        }
        return normalizedDays;
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
