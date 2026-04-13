## Podiums

### `GET /api/podiums`

Authenticated endpoint that returns the current user's podium history ordered from the most recent race result to the oldest.

Current behavior:

- reads completed races for the authenticated user
- creates one history item per podium type achieved in the same race
- supports these podium types:
  - `GENERAL`
  - `AGE_GROUP`
  - `TEAM`
- considers positions `1` through `5` as podium positions for this product area
- returns repeated race metadata when the same race generated more than one podium record

Response shape:

```json
{
  "items": [
    {
      "podiumKey": "6b93a4b0-2b2d-4f4f-9f4d-9c19d7a07d11:GENERAL",
      "raceId": "6b93a4b0-2b2d-4f4f-9f4d-9c19d7a07d11",
      "raceName": "Braga 10K",
      "raceDate": "2025-02-11",
      "location": "Braga",
      "raceTypeName": "10 km Race",
      "teamName": null,
      "circuitName": null,
      "officialTimeSeconds": 2360,
      "chipTimeSeconds": 2355,
      "pacePerKmSeconds": 236,
      "podiumType": "GENERAL",
      "podiumPosition": 1
    }
  ]
}
```

Postman:

- Method: `GET`
- URL: `{{baseUrl}}/api/podiums`
- Auth: Bearer token required

Current client usage:

- web `Podiums` consumes `/api/podiums` and renders a timeline grouped by year
- the web page supports search, podium-type filters, and dynamic year filters based only on returned podium years
- clicking a podium card opens the shared race-details drawer and reuses the same edit and delete flows already used by `Races`

Testing data:

- `docs/sql/podium-history-test-data.sql` seeds completed races with `GENERAL`, `AGE_GROUP`, and `TEAM` podiums for both `user@ritma.com` and `admin@ritma.com`
