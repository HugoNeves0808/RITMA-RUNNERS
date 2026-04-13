package com.ritma.runners.podium.dto;

import java.util.List;

public record PodiumHistoryResponse(
        List<PodiumHistoryItemResponse> items
) {
}
