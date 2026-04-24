package com.ritma.runners.user_settings.repository;

import java.sql.Array;
import java.sql.ResultSetMetaData;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class UserDataTransferRepository {
    private final ObjectProvider<JdbcTemplate> jdbcTemplateProvider;

    public UserDataTransferRepository(ObjectProvider<JdbcTemplate> jdbcTemplateProvider) {
        this.jdbcTemplateProvider = jdbcTemplateProvider;
    }

    public Map<String, Object> findUser(UUID userId) {
        List<Map<String, Object>> rows = queryRows("SELECT * FROM users WHERE id = ?", userId);
        return rows.isEmpty() ? null : rows.get(0);
    }

    public Map<String, Object> findUserSettings(UUID userId) {
        List<Map<String, Object>> rows = queryRows("SELECT * FROM user_settings WHERE user_id = ?", userId);
        return rows.isEmpty() ? null : rows.get(0);
    }

    public List<Map<String, Object>> findUserAccessEvents(UUID userId) {
        return queryRows("SELECT * FROM user_access_events WHERE user_id = ? ORDER BY accessed_at DESC, created_at DESC", userId);
    }

    public List<Map<String, Object>> findUserShoes(UUID userId) {
        return queryRows("SELECT * FROM user_shoes WHERE user_id = ? ORDER BY created_at, name", userId);
    }

    public List<Map<String, Object>> findUserTeams(UUID userId) {
        return queryRows("SELECT * FROM user_teams WHERE user_id = ? ORDER BY created_at, name", userId);
    }

    public List<Map<String, Object>> findUserCircuits(UUID userId) {
        return queryRows("SELECT * FROM user_circuits WHERE user_id = ? ORDER BY created_at, name", userId);
    }

    public List<Map<String, Object>> findUserRaceTypes(UUID userId) {
        return queryRows("SELECT * FROM user_race_types WHERE user_id = ? ORDER BY created_at, name", userId);
    }

    public List<Map<String, Object>> findUserRaces(UUID userId) {
        return queryRows("SELECT * FROM user_races WHERE user_id = ? ORDER BY race_date NULLS LAST, created_at, name", userId);
    }

    public List<Map<String, Object>> findUserTrainingTypes(UUID userId) {
        return queryRows("SELECT * FROM user_custom_training_types WHERE user_id = ? ORDER BY created_at, name", userId);
    }

    public List<Map<String, Object>> findUserTrainings(UUID userId) {
        return queryRows("SELECT * FROM user_custom_trainings WHERE user_id = ? ORDER BY training_date, created_at, name", userId);
    }

    public void executeStatement(String sql) {
        jdbcTemplate().execute(sql);
    }

    private JdbcTemplate jdbcTemplate() {
        return jdbcTemplateProvider.getObject();
    }

    private List<Map<String, Object>> queryRows(String sql, Object... args) {
        return jdbcTemplate().query(sql, rs -> {
            List<Map<String, Object>> rows = new ArrayList<>();
            ResultSetMetaData metadata = rs.getMetaData();
            int columnCount = metadata.getColumnCount();

            while (rs.next()) {
                Map<String, Object> row = new LinkedHashMap<>();
                for (int index = 1; index <= columnCount; index++) {
                    row.put(metadata.getColumnLabel(index), normalizeValue(rs.getObject(index)));
                }
                rows.add(row);
            }

            return rows;
        }, args);
    }

    private Object normalizeValue(Object value) {
        if (value == null) {
            return null;
        }

        if (value instanceof Array array) {
            try {
                Object rawArray = array.getArray();
                if (rawArray instanceof Object[] objectArray) {
                    List<Object> values = new ArrayList<>();
                    for (Object item : objectArray) {
                        values.add(normalizeValue(item));
                    }
                    return values;
                }
            } catch (Exception ignored) {
                return null;
            }
        }

        if (value instanceof UUID || value instanceof Enum<?> || value instanceof java.time.LocalDate || value instanceof java.time.LocalTime) {
            return value.toString();
        }

        if (value instanceof OffsetDateTime offsetDateTime) {
            return offsetDateTime.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
        }

        return value;
    }
}
