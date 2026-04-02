package com.ritma.runners.race.dto;

import java.math.BigDecimal;

public record ManageRaceOptionRequest(
        String name,
        BigDecimal targetKm
) {
}
