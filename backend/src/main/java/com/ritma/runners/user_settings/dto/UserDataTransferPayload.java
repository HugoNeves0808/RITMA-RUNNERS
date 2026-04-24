package com.ritma.runners.user_settings.dto;

import java.util.List;
import java.util.Map;

public record UserDataTransferPayload(
        String formatVersion,
        String exportedAt,
        Map<String, Integer> counts,
        Map<String, Object> user,
        Map<String, Object> userSettings,
        List<Map<String, Object>> accessEvents,
        List<Map<String, Object>> shoes,
        List<Map<String, Object>> teams,
        List<Map<String, Object>> circuits,
        List<Map<String, Object>> raceTypes,
        List<Map<String, Object>> races,
        List<Map<String, Object>> trainingTypes,
        List<Map<String, Object>> trainings
) {
}
