package com.ritma.runners.race.dto;

import java.util.List;
import java.util.UUID;

public record DeleteRacesRequest(
        List<UUID> raceIds
) {
}
