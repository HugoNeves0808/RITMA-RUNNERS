package com.ritma.runners.training.dto;

import java.time.LocalDate;
import java.util.UUID;

public record AssociatedRaceOptionResponse(
        UUID id,
        String name,
        LocalDate raceDate
) {
}
