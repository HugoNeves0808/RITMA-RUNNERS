## Best Efforts

### `GET /api/best-efforts`

Authenticated endpoint that returns the current user's best-effort categories grouped by race type.

Current behavior:

- groups races by normalized race-type name
- infers the category target distance from the race-type label when possible
- orders races inside each category by:
  1. chip time
  2. shortest pace
  3. official time
  4. oldest race date
- marks each race with a ranking note such as:
  - `Valid for ranking`
  - `Below category distance`
  - `Excluded from category ranking`
- counts valid races per category and returns the full ranked list so the clients can show top cards and longer rankings from the same payload

Current ranking note rules:

- `Excluded from category ranking` when `is_valid_for_category_ranking = false`
- `Below category distance` when the race is still category-valid but its `realKm` is below the minimum accepted distance
- `Valid for ranking` when the race is category-valid, has chip time, and meets the inferred minimum accepted distance

Current minimum accepted distance rule:

- the backend currently uses `target distance - 0.10 km`

Response shape:

```json
{
  "categories": [
    {
      "categoryKey": "10k",
      "categoryName": "10K",
      "expectedDistanceKm": 10.0,
      "validEffortCount": 6,
      "totalEffortCount": 8,
      "efforts": [
        {
          "raceId": "0f5f0c4f-8e61-4d32-9c0d-5f7e2b0c0d11",
          "raceName": "City 10K",
          "raceDate": "2024-04-07",
          "raceTypeName": "10K",
          "realKm": 10.0,
          "chipTimeSeconds": 2525,
          "officialTimeSeconds": 2532,
          "pacePerKmSeconds": 253,
          "generalClassification": null,
          "isGeneralClassificationPodium": false,
          "ageGroupClassification": null,
          "isAgeGroupClassificationPodium": false,
          "teamClassification": null,
          "isTeamClassificationPodium": false,
          "validForBestEffortRanking": true,
          "rankingNote": "Valid for ranking",
          "classificationPodium": false,
          "classificationGoodPosition": false,
          "overallRank": 1
        }
      ]
    }
  ]
}
```

Postman:

- Method: `GET`
- URL: `{{baseUrl}}/api/best-efforts`
- Auth: Bearer token required

Notes:

- the current web client hides `excluded` races from the main podium/table ranking views, but still exposes their count and a filtered modal list
- clicking a best-effort race in the web modal reuses the same race-details drawer, edit drawer, and delete flow used in `Races`
- the current web tooltips use shorter copy for `valid` and `excluded` states to keep the ranking explanation compact
