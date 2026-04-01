package com.ritma.runners.best_effort.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.ritma.runners.best_effort.dto.BestEffortCategoryResponse;
import com.ritma.runners.best_effort.dto.BestEffortItemResponse;
import com.ritma.runners.best_effort.dto.BestEffortResponse;
import com.ritma.runners.best_effort.repository.BestEffortRepository;
import com.ritma.runners.best_effort.repository.BestEffortRepository.BestEffortRaceRow;

@Service
public class BestEffortService {

    private static final BigDecimal CATEGORY_DISTANCE_MARGIN_KM = new BigDecimal("0.20");
    private static final int GOOD_POSITION_LIMIT = 10;
    private static final Pattern DISTANCE_PATTERN = Pattern.compile("(\\d+(?:[\\.,]\\d+)?)\\s*(km|k|m|mi|mile|miles)\\b");

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
        BigDecimal expectedDistanceKm = inferExpectedDistanceKm(categoryName);

        List<BestEffortItemResponse> efforts = rows.stream()
                .sorted(buildRankingComparator(categoryName))
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
                        efforts.get(index).isGeneralClassificationPodium(),
                        efforts.get(index).ageGroupClassification(),
                        efforts.get(index).isAgeGroupClassificationPodium(),
                        efforts.get(index).teamClassification(),
                        efforts.get(index).isTeamClassificationPodium(),
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

    private Comparator<BestEffortRaceRow> buildRankingComparator(String categoryName) {
        return Comparator
                .comparing(BestEffortRaceRow::chipTimeSeconds, Comparator.nullsLast(Integer::compareTo))
                .thenComparing(BestEffortRaceRow::pacePerKmSeconds, Comparator.nullsLast(Integer::compareTo))
                .thenComparing(BestEffortRaceRow::officialTimeSeconds, Comparator.nullsLast(Integer::compareTo))
                .thenComparing(BestEffortRaceRow::raceDate, Comparator.nullsLast(java.time.LocalDate::compareTo))
                .thenComparing(BestEffortRaceRow::raceName, String.CASE_INSENSITIVE_ORDER)
                .thenComparing(BestEffortRaceRow::raceId);
    }

    private BestEffortItemResponse toResponse(BestEffortRaceRow row, BigDecimal expectedDistanceKm) {
        boolean podium = isPodium(row.generalClassification(), row.isGeneralClassificationPodium())
                || isPodium(row.ageGroupClassification(), row.isAgeGroupClassificationPodium())
                || isPodium(row.teamClassification(), row.isTeamClassificationPodium());
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
                row.isGeneralClassificationPodium(),
                row.ageGroupClassification(),
                row.isAgeGroupClassificationPodium(),
                row.teamClassification(),
                row.isTeamClassificationPodium(),
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

        if (row.chipTimeSeconds() == null) {
            return false;
        }

        if (expectedDistanceKm == null) {
            return true;
        }

        if (row.realKm() == null) {
            return false;
        }

        BigDecimal minimumAcceptedDistance = expectedDistanceKm.subtract(CATEGORY_DISTANCE_MARGIN_KM);
        return row.realKm().compareTo(minimumAcceptedDistance) >= 0;
    }

    private String buildRankingNote(BestEffortRaceRow row, BigDecimal expectedDistanceKm) {
        if (!Boolean.TRUE.equals(row.isValidForCategoryRanking())) {
            return "Excluded from category ranking";
        }

        if (expectedDistanceKm == null) {
            return "Valid for ranking";
        }

        if (row.realKm() == null) {
            return "Missing real distance";
        }

        BigDecimal minimumAcceptedDistance = expectedDistanceKm.subtract(CATEGORY_DISTANCE_MARGIN_KM);
        if (row.realKm().compareTo(minimumAcceptedDistance) < 0) {
            return "Below category distance";
        }

        return "Valid for ranking";
    }

    private BigDecimal inferExpectedDistanceKm(String categoryName) {
        if (categoryName == null) {
            return null;
        }

        String normalized = categoryName.trim().toLowerCase(Locale.ROOT);
        if (normalized.isEmpty()) {
            return null;
        }

        if (normalized.contains("maratona") || normalized.contains("marathon")) {
            if (normalized.contains("meia") || normalized.contains("half")) {
                return new BigDecimal("21.0975");
            }
            return new BigDecimal("42.195");
        }

        Matcher matcher = DISTANCE_PATTERN.matcher(normalized);
        if (!matcher.find()) {
            return null;
        }

        BigDecimal value = new BigDecimal(matcher.group(1).replace(',', '.'));
        String unit = matcher.group(2);

        if ("m".equals(unit) && value.compareTo(new BigDecimal("100")) >= 0) {
            return value.divide(new BigDecimal("1000"), 4, RoundingMode.HALF_UP).stripTrailingZeros();
        }

        if ("mi".equals(unit) || "mile".equals(unit) || "miles".equals(unit)) {
            return value.multiply(new BigDecimal("1.60934")).setScale(4, RoundingMode.HALF_UP).stripTrailingZeros();
        }

        return value.stripTrailingZeros();
    }

    private boolean isPodium(Integer classification, Boolean podiumFlag) {
        return Boolean.TRUE.equals(podiumFlag) || (classification != null && classification <= 3);
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
