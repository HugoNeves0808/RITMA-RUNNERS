# RITMA RUNNERS

`Release 3.0.0` is the latest completed release, and `4.0.0` is now being prepared as the next project milestone.

RITMA RUNNERS is now a working multi-client platform for managing running races, planning custom trainings, reviewing best efforts, and supporting admin approval flows across web, mobile, and backend layers.

## Release Status

- Latest completed release: `3.0.0`
- Current milestone in preparation: `4.0.0`
- Latest completed release date: `2026-04-17`
- Current milestone target date: `TBD`
- Phase status: release 1, release 2, and release 3 completed, release 4 in preparation
- Scope covered: backend API, web client, mobile client, PostgreSQL persistence, authentication, race management, custom trainings, best efforts, and admin flows

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

## Deploy On Render

This repo now includes a root `render.yaml` Blueprint that can create:

- `ritma-runners-api`: Spring Boot backend as a Render web service
- `ritma-runners-web`: Vite frontend as a Render static site
- `ritma-runners-db`: Render Postgres

### Important Render Limits

Render's current free offering is useful, but there are two important constraints to be aware of:

- Free Render Postgres databases expire `30 days` after creation. If you create one on `2026-04-27`, it expires around `2026-05-27`.
- Free Render web services cannot send outbound SMTP traffic on ports `25`, `465`, or `587`.

Because of that, the best long-term free setup is usually:

- frontend on Render static site
- backend on Render web service
- database on an external free PostgreSQL provider instead of free Render Postgres

### Option 1: Deploy Everything From `render.yaml`

Use this if you want the fastest initial migration and you accept the `30-day` database expiry on free Render Postgres.

1. Push this repository to GitHub.
2. In Render, open `Blueprints`.
3. Create a new Blueprint from the repository.
4. Render will detect the root `render.yaml`.
5. When prompted for secret values, provide the mail and admin values you actually want to use.
6. After deploy finishes, open the `ritma-runners-web` URL.

The frontend receives `VITE_API_BASE_URL` automatically from the backend service URL, and the backend receives the frontend URL automatically for CORS.

### Option 2: Render For App Hosting + External Free PostgreSQL

Use this if you want to stay free beyond the Render database trial window.

1. Create a free PostgreSQL database outside Render.
2. Create the `ritma-runners-api` web service from the `backend/` folder.
3. Set these backend environment variables in Render:

```text
PGHOST=<db-host>
PGPORT=<db-port>
PGDATABASE=<db-name>
PGUSER=<db-user>
PGPASSWORD=<db-password>
JWT_SECRET=<strong-random-secret>
JWT_EXPIRATION_MINUTES=10080
APP_CORS_ALLOWED_ORIGINS=<your-frontend-render-url>
APP_BOOTSTRAP_ADMIN_ENABLED=false
```

4. Create the `ritma-runners-web` static site from the `frontend/` folder.
5. Set this frontend environment variable:

```text
VITE_API_BASE_URL=<your-backend-render-url>
```

6. In the frontend static-site settings, add a rewrite rule:

```text
/*  ->  /index.html
```

Action should be `Rewrite`, not `Redirect`, so React Router keeps working on refresh and deep links.

### Render Build Settings

If you prefer setting up the services manually instead of using the Blueprint, use these values.

Backend:

```text
Root Directory: backend
Environment: Java
Build Command: chmod +x ./mvnw && ./mvnw clean package -DskipTests
Start Command: java -jar target/ritma-runners-backend-*.jar
Health Check Path: /api/health
```

Frontend:

```text
Root Directory: frontend
Environment: Static Site
Build Command: npm ci && npm run build
Publish Directory: dist
```

### Mail On Free Render

This backend currently exposes SMTP-driven configuration, but Render documents that free web services cannot send outbound traffic on SMTP ports `25`, `465`, and `587`.

If you need email features later, use one of these approaches:

- move the backend to a paid Render instance
- switch to an email provider with an HTTP API instead of SMTP
- keep the mail-related environment variables unset until you are ready to support email delivery

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
- See `docs/changelog/releases/4.0.0.md` for the release 4 notes in preparation.
- See `docs/changelog/releases/3.0.0.md` for the release 3 notes.
- See `docs/changelog/releases/2.0.0.md` for the release 2 notes.
- See `docs/changelog/releases/1.0.0.md` for the release 1 notes.
- See `docs/api/README.md` for the API documentation index.
- See `docs/api/overview.md` for setup, access flow, and client navigation notes.
- See `docs/api/auth.md`, `docs/api/races.md`, `docs/api/best-efforts.md`, `docs/api/admin.md`, and `docs/api/system.md` for the endpoint reference split by domain.

## Release Summary

Release `1.0.0` established the first complete usable platform slice of RITMA RUNNERS. Release `2.0.0` expanded that foundation with additional web polish, race management refinements, and podium history. Release `3.0.0` completed the next localization and UI-consistency phase, and the project is now moving through the `4.0.0` preparation cycle.
