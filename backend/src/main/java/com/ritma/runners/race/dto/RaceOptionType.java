package com.ritma.runners.race.dto;

import java.util.Arrays;

import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

public enum RaceOptionType {
    RACE_TYPES("race-types", "Race type", "user_race_types", "user_races", "race_type_id"),
    TEAMS("teams", "Team", "user_teams", "user_races", "team_id"),
    CIRCUITS("circuits", "Circuit", "user_circuits", "user_races", "circuit_id"),
    SHOES("shoes", "Shoe", "user_shoes", "user_race_results", "shoe_id");

    private final String pathValue;
    private final String label;
    private final String tableName;
    private final String referenceTableName;
    private final String referenceColumnName;

    RaceOptionType(String pathValue,
                   String label,
                   String tableName,
                   String referenceTableName,
                   String referenceColumnName) {
        this.pathValue = pathValue;
        this.label = label;
        this.tableName = tableName;
        this.referenceTableName = referenceTableName;
        this.referenceColumnName = referenceColumnName;
    }

    public String pathValue() {
        return pathValue;
    }

    public String label() {
        return label;
    }

    public String tableName() {
        return tableName;
    }

    public String referenceTableName() {
        return referenceTableName;
    }

    public String referenceColumnName() {
        return referenceColumnName;
    }

    public static RaceOptionType fromPathValue(String value) {
        return Arrays.stream(values())
                .filter(optionType -> optionType.pathValue.equalsIgnoreCase(value))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid race option type."));
    }
}
