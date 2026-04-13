package com.ritma.runners.best_effort.service;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.ritma.runners.best_effort.dto.BestEffortCategoryResponse;
import com.ritma.runners.best_effort.dto.BestEffortItemResponse;
import com.ritma.runners.best_effort.dto.BestEffortResponse;
import com.ritma.runners.best_effort.repository.BestEffortRepository;
import com.ritma.runners.best_effort.repository.BestEffortRepository.BestEffortRaceRow;

@Service
public class BestEffortService {

    private static final BigDecimal CATEGORY_DISTANCE_EXCLUDED_MARGIN_KM = new BigDecimal("0.10");
    private static final int GOOD_POSITION_LIMIT = 10;

    private final BestEffortRepository bestEffortRepository;

    public BestEffortService(BestEffortRepository bestEffortRepository) {
        this.bestEffortRepository = bestEffortRepository;
    }

    public BestEffortResponse getBestEfforts(UUID userId) {
        Map<String, List<BestEffortRaceRow>> racesByCategory = bestEffortRepository.findBestEffortCandidates(userId).stream()
                .collect(Collectors.groupingBy(
                        row -> normalizeCategoryKey(row.raceTypeName()),
                        Collectors.toList()
                ));

        List<BestEffortCategoryResponse> categories = racesByCategory.entrySet().stream()
                .map(entry -> buildCategory(entry.getKey(), entry.getValue()))
                .sorted(Comparator.comparing(BestEffortCategoryResponse::categoryName, String.CASE_INSENSITIVE_ORDER))
                .toList();

        return new BestEffortResponse(categories);
    }

    private BestEffortCategoryResponse buildCategory(String categoryKey, List<BestEffortRaceRow> rows) {
        String categoryName = rows.get(0).raceTypeName();
        BigDecimal expectedDistanceKm = rows.get(0).targetKm();

        List<BestEffortItemResponse> efforts = rows.stream()
                .sorted(buildRankingComparator())
                .map(row -> toResponse(row, expectedDistanceKm))
                .toList();

        List<BestEffortItemResponse> rankedEfforts = java.util.stream.IntStream.range(0, efforts.size())
                .mapToObj(index -> new BestEffortItemResponse(
                        efforts.get(index).raceId(),
                        efforts.get(index).raceName(),
                        efforts.get(index).raceDate(),
                        efforts.get(index).raceTypeName(),
                        efforts.get(index).realKm(),
                        efforts.get(index).chipTimeSeconds(),
                        efforts.get(index).officialTimeSeconds(),
                        efforts.get(index).pacePerKmSeconds(),
                        efforts.get(index).generalClassification(),
                        efforts.get(index).ageGroupClassification(),
                        efforts.get(index).teamClassification(),
                        efforts.get(index).validForBestEffortRanking(),
                        efforts.get(index).rankingNote(),
                        efforts.get(index).classificationPodium(),
                        efforts.get(index).classificationGoodPosition(),
                        index + 1
                ))
                .toList();

        int validEffortCount = (int) rankedEfforts.stream()
                .filter(BestEffortItemResponse::validForBestEffortRanking)
                .count();

        return new BestEffortCategoryResponse(
                categoryKey,
                categoryName,
                expectedDistanceKm,
                validEffortCount,
                rankedEfforts.size(),
                rankedEfforts
        );
    }

    private Comparator<BestEffortRaceRow> buildRankingComparator() {
        return Comparator
                .comparing(BestEffortRaceRow::chipTimeSeconds, Comparator.nullsLast(Integer::compareTo))
                .thenComparing(BestEffortRaceRow::pacePerKmSeconds, Comparator.nullsLast(Integer::compareTo))
                .thenComparing(BestEffortRaceRow::officialTimeSeconds, Comparator.nullsLast(Integer::compareTo))
                .thenComparing(BestEffortRaceRow::raceDate, Comparator.nullsLast(java.time.LocalDate::compareTo))
                .thenComparing(BestEffortRaceRow::raceName, String.CASE_INSENSITIVE_ORDER)
                .thenComparing(BestEffortRaceRow::raceId);
    }

    private BestEffortItemResponse toResponse(BestEffortRaceRow row, BigDecimal expectedDistanceKm) {
        boolean podium = isPodium(row.generalClassification())
                || isPodium(row.ageGroupClassification())
                || isPodium(row.teamClassification());
        boolean goodPosition = podium
                || isGoodPosition(row.generalClassification())
                || isGoodPosition(row.ageGroupClassification())
                || isGoodPosition(row.teamClassification());

        return new BestEffortItemResponse(
                row.raceId(),
                row.raceName(),
                row.raceDate(),
                row.raceTypeName(),
                row.realKm(),
                row.chipTimeSeconds(),
                row.officialTimeSeconds(),
                row.pacePerKmSeconds(),
                row.generalClassification(),
                row.ageGroupClassification(),
                row.teamClassification(),
                isValidForBestEffortRanking(row, expectedDistanceKm),
                buildRankingNote(row, expectedDistanceKm),
                podium,
                goodPosition,
                0
        );
    }

    private boolean isValidForBestEffortRanking(BestEffortRaceRow row, BigDecimal expectedDistanceKm) {
        if (!Boolean.TRUE.equals(row.isValidForCategoryRanking())) {
            return false;
        }

        if (expectedDistanceKm == null || row.realKm() == null) {
            return false;
        }

        return row.realKm().compareTo(getMinimumAcceptedDistance(expectedDistanceKm)) >= 0;
    }

    private String buildRankingNote(BestEffortRaceRow row, BigDecimal expectedDistanceKm) {
        if (!Boolean.TRUE.equals(row.isValidForCategoryRanking())) {
            return "Excluded from category ranking";
        }

        if (expectedDistanceKm == null) {
            return "Missing category target";
        }

        if (row.realKm() == null) {
            return "Missing real distance";
        }

        BigDecimal minimumAcceptedDistance = getMinimumAcceptedDistance(expectedDistanceKm);
        if (row.realKm().compareTo(minimumAcceptedDistance) < 0) {
            return "Excluded from category ranking";
        }

        return "Valid for ranking";
    }

    private BigDecimal getMinimumAcceptedDistance(BigDecimal expectedDistanceKm) {
        return expectedDistanceKm.subtract(CATEGORY_DISTANCE_EXCLUDED_MARGIN_KM).max(BigDecimal.ZERO);
    }

    private boolean isPodium(Integer classification) {
        return classification != null && classification <= 3;
    }

    private boolean isGoodPosition(Integer classification) {
        return classification != null && classification <= GOOD_POSITION_LIMIT;
    }

    private String normalizeCategoryKey(String categoryName) {
        if (categoryName == null) {
            return "uncategorized";
        }

        String normalizedKey = categoryName.trim()
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-|-$", "");

        return normalizedKey.isEmpty() ? "uncategorized" : normalizedKey;
    }
}
