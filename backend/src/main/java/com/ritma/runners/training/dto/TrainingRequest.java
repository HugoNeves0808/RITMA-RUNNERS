package com.ritma.runners.training.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

public record TrainingRequest(
        LocalDate trainingDate,
        LocalTime trainingTime,
        String name,
        UUID trainingTypeId,
        String notes,
        UUID associatedRaceId,
        Recurrence recurrence
) {
    public record Recurrence(
            Boolean enabled,
            Integer intervalWeeks,
            LocalDate untilDate,
            List<Integer> daysOfWeek
    ) {
    }
}
