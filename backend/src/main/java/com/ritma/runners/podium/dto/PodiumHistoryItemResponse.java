package com.ritma.runners.podium.dto;

import java.time.LocalDate;
import java.util.UUID;

public record PodiumHistoryItemResponse(
        String podiumKey,
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
        String podiumType,
        int podiumPosition
) {
}
