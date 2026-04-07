### `GET /api/health`

Public endpoint that checks if the backend is alive.

Expected response:

```json
{
  "status": "ok"
}
```

Current note:

- the endpoint can also return `"degraded"` when the optional health probe is available and reports an unhealthy state

Postman:

- Method: `GET`
- URL: `{{baseUrl}}/api/health`
- Auth: none

### `GET /api/db-check`

Admin-only technical endpoint that confirms database access and returns basic database details.

Expected response example:

```json
{
  "database": "ritmarunners",
  "raceCount": 0
}
```

Postman:

- Method: `GET`
- URL: `{{baseUrl}}/api/db-check`
- Auth: `Bearer Token`
- Token: admin token only
