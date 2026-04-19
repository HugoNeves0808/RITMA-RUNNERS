package com.ritma.runners.training.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

public record TrainingTableItemResponse(
        UUID id,
        LocalDate trainingDate,
        LocalTime trainingTime,
        String name,
        UUID trainingTypeId,
        String trainingTypeName,
        String notes,
        String trainingStatus,
        boolean completed,
        UUID associatedRaceId,
        String associatedRaceName,
        LocalDate associatedRaceDate,
        UUID seriesId,
        Integer seriesIntervalWeeks,
        LocalDate seriesUntilDate,
        List<Integer> seriesDaysOfWeek
) {
}
