package com.ritma.runners.user_settings.service;

import java.nio.charset.StandardCharsets;
import java.io.ByteArrayOutputStream;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.ritma.runners.user_settings.dto.UserDataTransferPayload;
import com.ritma.runners.user_settings.repository.UserDataTransferRepository;

@Service
public class UserDataTransferService {
    private static final String FORMAT_VERSION = "1.0";
    private static final List<String> USER_COLUMNS = List.of(
            "email",
            "password_hash",
            "role",
            "force_password_change",
            "created_at",
            "updated_at",
            "account_status",
            "last_login_at"
    );

    private final UserDataTransferRepository repository;
    private final ObjectMapper objectMapper;

    public UserDataTransferService(UserDataTransferRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    public String exportJson(UUID userId) {
        try {
            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(buildPayload(userId));
        } catch (Exception exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not generate the export file.");
        }
    }

    public String exportSql(UUID userId) {
        UserDataTransferPayload payload = buildPayload(userId);
        StringBuilder sql = new StringBuilder();
        String exportedUserId = stringValue(payload.user(), "id");

        sql.append("-- RITMA RUNNERS user export").append('\n');
        sql.append("-- format_version: ").append(FORMAT_VERSION).append('\n');
        sql.append("-- exported_at: ").append(payload.exportedAt()).append('\n');
        sql.append("BEGIN;").append('\n').append('\n');

        sql.append("DELETE FROM user_access_events WHERE user_id = ").append(sqlLiteral(exportedUserId, null)).append(';').append('\n');
        sql.append("DELETE FROM user_custom_trainings WHERE user_id = ").append(sqlLiteral(exportedUserId, null)).append(';').append('\n');
        sql.append("DELETE FROM user_custom_training_types WHERE user_id = ").append(sqlLiteral(exportedUserId, null)).append(';').append('\n');
        sql.append("DELETE FROM user_races WHERE user_id = ").append(sqlLiteral(exportedUserId, null)).append(';').append('\n');
        sql.append("DELETE FROM user_shoes WHERE user_id = ").append(sqlLiteral(exportedUserId, null)).append(';').append('\n');
        sql.append("DELETE FROM user_teams WHERE user_id = ").append(sqlLiteral(exportedUserId, null)).append(';').append('\n');
        sql.append("DELETE FROM user_circuits WHERE user_id = ").append(sqlLiteral(exportedUserId, null)).append(';').append('\n');
        sql.append("DELETE FROM user_race_types WHERE user_id = ").append(sqlLiteral(exportedUserId, null)).append(';').append('\n');
        sql.append("DELETE FROM user_settings WHERE user_id = ").append(sqlLiteral(exportedUserId, null)).append(';').append('\n');
        sql.append("DELETE FROM users WHERE id = ").append(sqlLiteral(exportedUserId, null)).append(';').append('\n').append('\n');

        appendInsert(sql, "users", List.of(payload.user()));
        appendInsert(sql, "user_settings", payload.userSettings() == null ? List.of() : List.of(payload.userSettings()));
        appendInsert(sql, "user_shoes", payload.shoes());
        appendInsert(sql, "user_teams", payload.teams());
        appendInsert(sql, "user_circuits", payload.circuits());
        appendInsert(sql, "user_race_types", payload.raceTypes());
        appendInsert(sql, "user_races", payload.races());
        appendInsert(sql, "user_custom_training_types", payload.trainingTypes());
        appendInsert(sql, "user_custom_trainings", payload.trainings());
        appendInsert(sql, "user_access_events", payload.accessEvents());

        sql.append('\n').append("COMMIT;").append('\n');
        return sql.toString();
    }

    public byte[] exportExcel(UUID userId) {
        UserDataTransferPayload payload = buildPayload(userId);

        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);

            writeSummarySheet(workbook, headerStyle, payload);
            writeSheet(workbook, headerStyle, "Utilizador", payload.user() == null ? List.of() : List.of(payload.user()));
            writeSheet(workbook, headerStyle, "Definicoes", payload.userSettings() == null ? List.of() : List.of(payload.userSettings()));
            writeSheet(workbook, headerStyle, "Acessos", payload.accessEvents());
            writeSheet(workbook, headerStyle, "Sapatilhas", payload.shoes());
            writeSheet(workbook, headerStyle, "Equipas", payload.teams());
            writeSheet(workbook, headerStyle, "Circuitos", payload.circuits());
            writeSheet(workbook, headerStyle, "TiposProva", payload.raceTypes());
            writeSheet(workbook, headerStyle, "Competicoes", payload.races());
            writeSheet(workbook, headerStyle, "TiposTreino", payload.trainingTypes());
            writeSheet(workbook, headerStyle, "Treinos", payload.trainings());

            workbook.write(outputStream);
            return outputStream.toByteArray();
        } catch (Exception exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not generate the Excel export file.");
        }
    }

    @Transactional
    public void importJson(UUID currentUserId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please choose a JSON export file first.");
        }

        UserDataTransferPayload payload;
        try {
            payload = objectMapper.readValue(file.getBytes(), UserDataTransferPayload.class);
        } catch (Exception exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The selected file is not a valid export file.");
        }

        if (payload == null || payload.user() == null || payload.formatVersion() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The selected file is missing required export data.");
        }

        try {
            repository.executeStatement("DELETE FROM user_access_events WHERE user_id = " + sqlLiteral(currentUserId.toString(), null));
            repository.executeStatement("DELETE FROM user_custom_trainings WHERE user_id = " + sqlLiteral(currentUserId.toString(), null));
            repository.executeStatement("DELETE FROM user_custom_training_types WHERE user_id = " + sqlLiteral(currentUserId.toString(), null));
            repository.executeStatement("DELETE FROM user_races WHERE user_id = " + sqlLiteral(currentUserId.toString(), null));
            repository.executeStatement("DELETE FROM user_shoes WHERE user_id = " + sqlLiteral(currentUserId.toString(), null));
            repository.executeStatement("DELETE FROM user_teams WHERE user_id = " + sqlLiteral(currentUserId.toString(), null));
            repository.executeStatement("DELETE FROM user_circuits WHERE user_id = " + sqlLiteral(currentUserId.toString(), null));
            repository.executeStatement("DELETE FROM user_race_types WHERE user_id = " + sqlLiteral(currentUserId.toString(), null));
            repository.executeStatement("DELETE FROM user_settings WHERE user_id = " + sqlLiteral(currentUserId.toString(), null));

            repository.executeStatement(buildUserUpdateSql(currentUserId, payload.user()));
            appendImportStatements("user_settings", payload.userSettings() == null ? List.of() : List.of(withUserId(payload.userSettings(), currentUserId)));
            appendImportStatements("user_shoes", withUserId(payload.shoes(), currentUserId));
            appendImportStatements("user_teams", withUserId(payload.teams(), currentUserId));
            appendImportStatements("user_circuits", withUserId(payload.circuits(), currentUserId));
            appendImportStatements("user_race_types", withUserId(payload.raceTypes(), currentUserId));
            appendImportStatements("user_races", withUserId(payload.races(), currentUserId));
            appendImportStatements("user_custom_training_types", withUserId(payload.trainingTypes(), currentUserId));
            appendImportStatements("user_custom_trainings", withUserId(payload.trainings(), currentUserId));
            appendImportStatements("user_access_events", withUserId(payload.accessEvents(), currentUserId));
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Import could not be completed because some data conflicts with the current database.");
        }
    }

    private UserDataTransferPayload buildPayload(UUID userId) {
        Map<String, Object> user = requireRow(repository.findUser(userId), "User not found.");
        Map<String, Object> userSettings = repository.findUserSettings(userId);
        List<Map<String, Object>> accessEvents = repository.findUserAccessEvents(userId);
        List<Map<String, Object>> shoes = repository.findUserShoes(userId);
        List<Map<String, Object>> teams = repository.findUserTeams(userId);
        List<Map<String, Object>> circuits = repository.findUserCircuits(userId);
        List<Map<String, Object>> raceTypes = repository.findUserRaceTypes(userId);
        List<Map<String, Object>> races = repository.findUserRaces(userId);
        List<Map<String, Object>> trainingTypes = repository.findUserTrainingTypes(userId);
        List<Map<String, Object>> trainings = repository.findUserTrainings(userId);

        Map<String, Integer> counts = new LinkedHashMap<>();
        counts.put("accessEvents", accessEvents.size());
        counts.put("shoes", shoes.size());
        counts.put("teams", teams.size());
        counts.put("circuits", circuits.size());
        counts.put("raceTypes", raceTypes.size());
        counts.put("races", races.size());
        counts.put("trainingTypes", trainingTypes.size());
        counts.put("trainings", trainings.size());

        return new UserDataTransferPayload(
                FORMAT_VERSION,
                OffsetDateTime.now().format(DateTimeFormatter.ISO_OFFSET_DATE_TIME),
                counts,
                user,
                userSettings,
                accessEvents,
                shoes,
                teams,
                circuits,
                raceTypes,
                races,
                trainingTypes,
                trainings
        );
    }

    private void appendImportStatements(String tableName, List<Map<String, Object>> rows) {
        for (Map<String, Object> row : rows) {
            repository.executeStatement(buildInsertStatement(tableName, row));
        }
    }

    private void appendInsert(StringBuilder sql, String tableName, List<Map<String, Object>> rows) {
        if (rows == null || rows.isEmpty()) {
            return;
        }

        for (Map<String, Object> row : rows) {
            sql.append(buildInsertStatement(tableName, row)).append('\n');
        }
        sql.append('\n');
    }

    private String buildInsertStatement(String tableName, Map<String, Object> row) {
        List<String> columns = new ArrayList<>(row.keySet());
        String joinedColumns = String.join(", ", columns);
        String joinedValues = columns.stream()
                .map(column -> sqlLiteral(row.get(column), column))
                .reduce((left, right) -> left + ", " + right)
                .orElse("");

        return "INSERT INTO " + tableName + " (" + joinedColumns + ") VALUES (" + joinedValues + ");";
    }

    private void writeSummarySheet(XSSFWorkbook workbook, CellStyle headerStyle, UserDataTransferPayload payload) {
        XSSFSheet sheet = workbook.createSheet("Resumo");
        int rowIndex = 0;

        rowIndex = writeKeyValueRow(sheet, rowIndex, headerStyle, "Versao do formato", payload.formatVersion());
        rowIndex = writeKeyValueRow(sheet, rowIndex, headerStyle, "Exportado em", payload.exportedAt());
        rowIndex = writeKeyValueRow(sheet, rowIndex, headerStyle, "Email", payload.user() == null ? null : payload.user().get("email"));
        rowIndex++;

        Row headerRow = sheet.createRow(rowIndex++);
        createCell(headerRow, 0, "Tabela", headerStyle);
        createCell(headerRow, 1, "Registos", headerStyle);

        for (Map.Entry<String, Integer> entry : payload.counts().entrySet()) {
            Row row = sheet.createRow(rowIndex++);
            createCell(row, 0, entry.getKey(), null);
            createCell(row, 1, entry.getValue(), null);
        }

        sheet.autoSizeColumn(0);
        sheet.autoSizeColumn(1);
    }

    private int writeKeyValueRow(XSSFSheet sheet, int rowIndex, CellStyle headerStyle, String label, Object value) {
        Row row = sheet.createRow(rowIndex);
        createCell(row, 0, label, headerStyle);
        createCell(row, 1, value, null);
        return rowIndex + 1;
    }

    private void writeSheet(XSSFWorkbook workbook, CellStyle headerStyle, String sheetName, List<Map<String, Object>> rows) {
        XSSFSheet sheet = workbook.createSheet(sheetName);
        if (rows == null || rows.isEmpty()) {
            Row row = sheet.createRow(0);
            createCell(row, 0, "Sem registos", headerStyle);
            sheet.autoSizeColumn(0);
            return;
        }

        List<String> columns = new ArrayList<>(rows.get(0).keySet());
        Row headerRow = sheet.createRow(0);
        for (int index = 0; index < columns.size(); index++) {
            createCell(headerRow, index, columns.get(index), headerStyle);
        }

        for (int rowIndex = 0; rowIndex < rows.size(); rowIndex++) {
            Row row = sheet.createRow(rowIndex + 1);
            Map<String, Object> values = rows.get(rowIndex);
            for (int columnIndex = 0; columnIndex < columns.size(); columnIndex++) {
                createCell(row, columnIndex, values.get(columns.get(columnIndex)), null);
            }
        }

        for (int index = 0; index < columns.size(); index++) {
            sheet.autoSizeColumn(index);
        }
    }

    private void createCell(Row row, int columnIndex, Object value, CellStyle style) {
        Cell cell = row.createCell(columnIndex);
        if (style != null) {
            cell.setCellStyle(style);
        }

        if (value == null) {
            cell.setCellValue("");
            return;
        }

        if (value instanceof Number number) {
            cell.setCellValue(number.doubleValue());
            return;
        }

        if (value instanceof Boolean bool) {
            cell.setCellValue(bool);
            return;
        }

        if (value instanceof List<?> list) {
            cell.setCellValue(list.stream().map(String::valueOf).reduce((left, right) -> left + ", " + right).orElse(""));
            return;
        }

        cell.setCellValue(String.valueOf(value));
    }

    private String buildUserUpdateSql(UUID currentUserId, Map<String, Object> exportedUser) {
        List<String> assignments = USER_COLUMNS.stream()
                .filter(exportedUser::containsKey)
                .map(column -> column + " = " + sqlLiteral(exportedUser.get(column), column))
                .toList();

        return "UPDATE users SET " + String.join(", ", assignments) + " WHERE id = " + sqlLiteral(currentUserId.toString(), null) + ";";
    }

    private List<Map<String, Object>> withUserId(List<Map<String, Object>> rows, UUID currentUserId) {
        List<Map<String, Object>> normalizedRows = new ArrayList<>();
        for (Map<String, Object> row : rows == null ? List.<Map<String, Object>>of() : rows) {
            normalizedRows.add(withUserId(row, currentUserId));
        }
        return normalizedRows;
    }

    private Map<String, Object> withUserId(Map<String, Object> row, UUID currentUserId) {
        Map<String, Object> nextRow = new LinkedHashMap<>(row);
        nextRow.put("user_id", currentUserId.toString());
        return nextRow;
    }

    private Map<String, Object> requireRow(Map<String, Object> row, String message) {
        if (row == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, message);
        }
        return row;
    }

    private String stringValue(Map<String, Object> row, String key) {
        Object value = row.get(key);
        return value == null ? "" : String.valueOf(value);
    }

    private String sqlLiteral(Object value, String columnName) {
        if (value == null) {
            return "NULL";
        }

        if (value instanceof Boolean bool) {
            return bool ? "TRUE" : "FALSE";
        }

        if (value instanceof Number number) {
            return number.toString();
        }

        if (value instanceof List<?> list) {
            if (list.isEmpty()) {
                return "ARRAY[]::smallint[]";
            }

            String values = list.stream()
                    .map(item -> sqlLiteral(item, columnName))
                    .reduce((left, right) -> left + ", " + right)
                    .orElse("");
            return "ARRAY[" + values + "]";
        }

        String stringValue = String.valueOf(value);
        String escaped = stringValue.replace("'", "''");

        if (columnName != null && columnName.toLowerCase(Locale.ROOT).endsWith("_id")) {
            return "'" + escaped + "'::uuid";
        }

        return "'" + escaped + "'";
    }
}
