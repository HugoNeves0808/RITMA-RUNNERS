package com.ritma.runners.podium.service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.ritma.runners.podium.dto.PodiumHistoryItemResponse;
import com.ritma.runners.podium.dto.PodiumHistoryResponse;
import com.ritma.runners.podium.repository.PodiumRepository;
import com.ritma.runners.podium.repository.PodiumRepository.PodiumRaceRow;

@Service
public class PodiumService {

    private final PodiumRepository podiumRepository;

    public PodiumService(PodiumRepository podiumRepository) {
        this.podiumRepository = podiumRepository;
    }

    public PodiumHistoryResponse getPodiumHistory(UUID userId) {
        List<PodiumHistoryItemResponse> items = podiumRepository.findPodiumRaces(userId).stream()
                .flatMap(row -> toPodiumItems(row).stream())
                .toList();

        return new PodiumHistoryResponse(items);
    }

    private List<PodiumHistoryItemResponse> toPodiumItems(PodiumRaceRow row) {
        List<PodiumHistoryItemResponse> items = new ArrayList<>();

        addIfPodium(items, row, "GENERAL", row.generalClassification());
        addIfPodium(items, row, "AGE_GROUP", row.ageGroupClassification());
        addIfPodium(items, row, "TEAM", row.teamClassification());

        return items;
    }

    private void addIfPodium(
            List<PodiumHistoryItemResponse> items,
            PodiumRaceRow row,
            String podiumType,
            Integer classification
    ) {
        if (classification == null || classification > 5) {
            return;
        }

        items.add(new PodiumHistoryItemResponse(
                row.raceId() + ":" + podiumType,
                row.raceId(),
                row.raceName(),
                row.raceDate(),
                row.location(),
                row.raceTypeName(),
                row.teamName(),
                row.circuitName(),
                row.officialTimeSeconds(),
                row.chipTimeSeconds(),
                row.pacePerKmSeconds(),
                podiumType,
                classification
        ));
    }
}
