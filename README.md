# RITMA RUNNERS

`Release 1.0.0` marks the completion of the first main phase of the project.

RITMA RUNNERS is now a working multi-client platform for managing running races, reviewing best efforts, and supporting admin approval flows across web, mobile, and backend layers.

## Release Status

- Current milestone: `1.0.0`
- Release date: `2026-04-07`
- Phase status: first major project phase completed
- Scope covered: backend API, web client, mobile client, PostgreSQL persistence, authentication, race management, best efforts, and admin flows

## Product Scope In Release 1.0.0

### Web

- Authenticated shell with role-aware navigation
- Login, request-account, remember-me, and forced password change flows
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
- Seed accounts and mail-backed approval notification support

## Repository Structure

- `backend/`: Spring Boot API and Flyway migrations
- `frontend/`: React + TypeScript web client built with Vite
- `mobile/`: Expo + React Native mobile client
- `CHANGELOG.md`: release history and implementation milestones
- `RITMAAPIDOCUMENTATION.md`: working API reference and flow notes

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
- sign in with a seeded account
- confirm the authenticated `Races` area opens

Expected health response:

```json
{
  "status": "ok"
}
```

## Seed Accounts

- `admin@ritma.com` / `pass1234`
- `user@ritma.com` / `pass1234`

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

- See `CHANGELOG.md` for the implementation history and release framing.
- See `RITMAAPIDOCUMENTATION.md` for endpoint details, authentication flow, and Postman guidance.

## Release Summary

Release `1.0.0` establishes the first complete usable platform slice of RITMA RUNNERS. The project is no longer just a setup or prototype base; it now includes the primary authenticated product flows, cross-client race management, best-effort analysis, and admin approval operations needed for the first major milestone.
