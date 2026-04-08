# RITMA RUNNERS

`Release 1.0.0` remains the latest completed release, and `2.0.0` is now being prepared as the next project milestone.

RITMA RUNNERS is now a working multi-client platform for managing running races, reviewing best efforts, and supporting admin approval flows across web, mobile, and backend layers.

## Release Status

- Latest completed release: `1.0.0`
- Current milestone in preparation: `2.0.0`
- Latest completed release date: `2026-04-07`
- Current milestone target date: `2026-04-08`
- Phase status: release 1 completed, release 2 in preparation
- Scope covered: backend API, web client, mobile client, PostgreSQL persistence, authentication, race management, best efforts, and admin flows

## Product Scope In Release 1.0.0

### Web

- Authenticated shell with role-aware navigation
- Login, request-account, remember-me, forced password change, and logout confirmation flows
- `Races` area with `List` and `Calendar` modes
- Monthly and yearly race calendar views
- Card-based race list with filters, bucket list flow, race details, add/edit/delete actions, and managed race options
- `Best Efforts` dashboard with podiums, rankings, drill-down flows, and race-type management
- Admin overview, user list, and pending approvals pages

### Mobile

- Expo-based authenticated application
- Login, session restore, forced password change, and logout flows
- `Races` table and calendar experiences
- Monthly and yearly calendar support
- Add-race flow and race-details modal
- Managed race-option flows for race types, teams, circuits, and shoes
- Admin overview, user list, and pending approvals screens

### Backend

- Spring Boot API with JWT authentication and role-based authorization
- PostgreSQL datasource with Flyway migrations
- Account request and approval flow
- Authenticated race listing, calendar, detail, create, update, and delete endpoints
- Best efforts ranking endpoint
- Admin overview, user-list, and pending-approval endpoints

## Repository Structure

- `backend/`: Spring Boot API and Flyway migrations
- `frontend/`: React + TypeScript web client built with Vite
- `mobile/`: Expo + React Native mobile client
- `docs/`: centralized documentation, changelog, and release notes

## Tech Stack

- Web: React 19, TypeScript, Vite, Ant Design, Font Awesome
- Mobile: Expo, React Native, TypeScript
- Backend: Spring Boot 3, Java 17, Spring Security, Flyway
- Database: PostgreSQL
- Auth: JWT

## Prerequisites

Install these tools before running the project locally:

- `Git`
- `Node.js 20.x` or newer
- `npm`
- `Java 17`
- `PostgreSQL`

Maven does not need to be installed globally because the backend uses the Maven Wrapper.

## Local Setup

```powershell
git clone https://github.com/HugoNeves0808/RITMA-RUNNERS.git
cd RITMA-RUNNERS
```

Install web dependencies:

```powershell
cd frontend
npm install
cd ..
```

Install mobile dependencies:

```powershell
cd mobile
npm install
cd ..
```

The backend downloads Maven automatically on first run through `mvnw` / `mvnw.cmd`.

## Environment Configuration

### Backend

The backend reads PostgreSQL settings from environment variables:

- `PGHOST`
- `PGPORT`
- `PGDATABASE`
- `PGUSER`
- `PGPASSWORD`

Default local fallback values:

```text
PGHOST=localhost
PGPORT=5432
PGDATABASE=ritmarunners
PGUSER=postgres
PGPASSWORD=postgres
```

JWT and mail-related settings are also environment-driven. In the tracked local setup, `JWT_EXPIRATION_MINUTES=10080`, which keeps development sessions valid for 7 days.

### Mobile

The mobile app reads its public API URL from `mobile/.env`:

```text
EXPO_PUBLIC_API_BASE_URL=http://<your-machine-ip>:8081
```

Use your machine IP when testing with Expo Go on a physical device.

## Running The Project

Start the backend:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

Start the web client in a second terminal:

```powershell
cd frontend
npm run dev
```

Start the mobile app in a third terminal:

```powershell
cd mobile
npm run start
```

Default local URLs:

- Web: `http://localhost:5173`
- Backend: `http://localhost:8081`

## Verification Checklist

After startup:

- open `http://localhost:5173`
- confirm the login page loads
- confirm `http://localhost:8081/api/health` responds
- sign in with an existing account from your local database
- confirm the authenticated `Races` area opens

Expected health response:

```json
{
  "status": "ok"
}
```

## Useful Commands

Web:

```powershell
cd frontend
npm run dev
```

```powershell
cd frontend
npm run build
```

Mobile:

```powershell
cd mobile
npm run start
```

Backend:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

```powershell
cd backend
.\mvnw.cmd test
```

## Documentation

- See `docs/README.md` for the documentation index.
- See `docs/changelog/README.md` for the release-organized changelog.
- See `docs/changelog/releases/2.0.0.md` for the release 2 notes in preparation.
- See `docs/changelog/releases/1.0.0.md` for the release 1 notes.
- See `docs/api/README.md` for the API documentation index.
- See `docs/api/overview.md` for setup, access flow, and client navigation notes.
- See `docs/api/auth.md`, `docs/api/races.md`, `docs/api/best-efforts.md`, `docs/api/admin.md`, and `docs/api/system.md` for the endpoint reference split by domain.

## Release Summary

Release `1.0.0` established the first complete usable platform slice of RITMA RUNNERS. The project is now moving through the `2.0.0` preparation cycle with incremental UX and product refinements on top of that first major milestone.
