# Trainings

Custom trainings are now available through `/api/trainings` and are scoped to the authenticated user.

This area supports:

- table listing with search and filter support
- create and edit flows for single trainings
- recurring series creation
- completion toggling
- delete-only-this vs delete-whole-series
- user-managed custom training types
- create options that include available races, even though the current web flow no longer uses manual race association

## `GET /api/trainings/table`

Returns the authenticated user's trainings for the web `Treinos` page.

Optional query params:

- `search`
  free-text search applied to the training name
- `statuses`
  optional repeated filter for one or more training statuses
  example: `statuses=PLANEADO&statuses=REALIZADO`
- `trainingTypeIds`
  optional repeated filter for one or more custom training type ids
- `associations`
  legacy filter parameter kept in the backend contract; the current web flow does not expose it in the UI

Postman:

- Method: `GET`
- URL: `{{baseUrl}}/api/trainings/table?search=tempo&statuses=PLANEADO&trainingTypeIds=uuid-1`
- Auth: `Bearer Token`
- Token: `{{token}}`

Expected response example:

```json
{
  "trainings": [
    {
      "id": "uuid",
      "trainingDate": "2026-04-29",
      "trainingTime": "19:00:00",
      "name": "Base semanal Porto 10K",
      "trainingTypeId": "uuid",
      "trainingTypeName": "Rodagem",
      "notes": null,
      "trainingStatus": "AGENDADO",
      "completed": false,
      "associatedRaceId": null,
      "associatedRaceName": null,
      "associatedRaceDate": null,
      "seriesId": "uuid",
      "seriesIntervalWeeks": 1,
      "seriesUntilDate": "2026-05-02",
      "seriesDaysOfWeek": [2, 4]
    }
  ]
}
```

## `GET /api/trainings/create/options`

Returns the options needed by the create and edit drawer.

Current payload includes:

- `trainingTypes`
- `races`

Postman:

- Method: `GET`
- URL: `{{baseUrl}}/api/trainings/create/options`
- Auth: `Bearer Token`

## `GET /api/trainings/filters/options`

Returns training-type options for the sidebar filters.

Postman:

- Method: `GET`
- URL: `{{baseUrl}}/api/trainings/filters/options`
- Auth: `Bearer Token`

## `GET /api/trainings/{trainingId}`

Returns one training row by id.

Postman:

- Method: `GET`
- URL: `{{baseUrl}}/api/trainings/{{trainingId}}`
- Auth: `Bearer Token`

## `POST /api/trainings`

Creates one training or a generated recurring series, depending on the payload.

Notes:

- `associatedRaceId` is still accepted by the backend contract
- the current web flow sends `null` and instead places trainings between dated race blocks in the UI
- when recurrence is enabled, the backend creates all matching occurrences for the requested weekday pattern

Postman:

- Method: `POST`
- URL: `{{baseUrl}}/api/trainings`
- Auth: `Bearer Token`

Example payload:

```json
{
  "trainingDate": "2026-04-21",
  "trainingTime": "19:00:00",
  "name": "Base semanal Porto 10K",
  "trainingTypeId": "uuid",
  "notes": "Rodagem controlada",
  "associatedRaceId": null,
  "recurrence": {
    "enabled": true,
    "intervalWeeks": 1,
    "untilDate": "2026-05-02",
    "daysOfWeek": [2, 4]
  }
}
```

## `PUT /api/trainings/{trainingId}`

Updates one training item.

Current note:

- editing an item that belongs to a series updates only that record

Postman:

- Method: `PUT`
- URL: `{{baseUrl}}/api/trainings/{{trainingId}}`
- Auth: `Bearer Token`

## `PUT /api/trainings/{trainingId}/completion`

Marks one training as completed or not completed.

Query params:

- `completed`
  boolean flag

Postman:

- Method: `PUT`
- URL: `{{baseUrl}}/api/trainings/{{trainingId}}/completion?completed=true`
- Auth: `Bearer Token`

## `DELETE /api/trainings/{trainingId}`

Deletes one training or the full series.

Query params:

- `scope`
  accepts `single` or `series`
  defaults to `single`

Postman:

- Method: `DELETE`
- URL: `{{baseUrl}}/api/trainings/{{trainingId}}?scope=series`
- Auth: `Bearer Token`

## `GET /api/trainings/types`

Returns the authenticated user's custom training types.

Optional query params:

- `includeArchived`
  defaults to `false`

## `POST /api/trainings/types`

Creates one custom training type.

## `PUT /api/trainings/types/{trainingTypeId}`

Renames one custom training type.

## `DELETE /api/trainings/types/{trainingTypeId}`

Archives or removes one custom training type according to backend rules.

## Current Web Notes

- the `Treinos` page is currently labeled as in development
- races are shown as dated collapsible blocks and trainings are placed between those race dates
- past race blocks receive a completed visual state
- stale past trainings that are still `PLANEADO` raise a header warning and can be bulk-marked as completed from the modal
