# API Documentation

The API documentation is now split into logical files for easier navigation.

## Release Context

- Latest completed release: `1.0.0`
- Current milestone in preparation: `2.0.1`
- Latest completed release date: `2026-04-07`
- Current milestone target date: `2026-04-08`
- Phase status: release 1 completed, release 2 in preparation

## Sections

- [`overview.md`](./overview.md): release context, base URL, Postman setup, seed accounts, access flow, and client-navigation notes
- [`system.md`](./system.md): health and technical system endpoints
- [`auth.md`](./auth.md): authentication and account-access endpoints
- [`races.md`](./races.md): races, calendars, create/edit flows, and managed race options
- [`best-efforts.md`](./best-efforts.md): best-effort ranking endpoint
- [`admin.md`](./admin.md): admin overview, users, and pending approvals
- [`testing.md`](./testing.md): suggested Postman order and implementation notes

## Base URL

```text
http://localhost:8081
```

## Current Backend Notes

- the local datasource and Flyway configuration explicitly target the `public` schema
- the tracked local `.env` sets `JWT_EXPIRATION_MINUTES=10080`
- `application.yml` still keeps `120` as the fallback JWT expiration when no environment override is provided
