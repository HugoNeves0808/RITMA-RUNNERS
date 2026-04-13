package com.ritma.runners.race.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record RaceTypeOptionResponse(
        UUID id,
        String name,
        BigDecimal targetKm,
        boolean isDefault,
        boolean archived
) {
    public RaceTypeOptionResponse(UUID id, String name, BigDecimal targetKm) {
        this(id, name, targetKm, false, false);
    }

    public RaceTypeOptionResponse(UUID id, String name, BigDecimal targetKm, boolean isDefault) {
        this(id, name, targetKm, isDefault, false);
    }
}
