# RITMA RUNNERS

Initial solution setup with a clear separation between frontend and backend.

## Purpose

RITMA RUNNERS is being prepared to register, organize, and plan running races.

At this stage, the goal is only to keep the solution cleanly split into:

- a dedicated `frontend` project
- a dedicated `backend` project

Detailed domain structure, modules, business rules, and API design are intentionally deferred.

## Structure

- `frontend/`: React + TypeScript application created with Vite and prepared to use Ant Design and Font Awesome.
- `backend/`: Spring Boot application prepared as the API base, with PostgreSQL planned in the stack.
- `CHANGELOG.md`: short project history with a more detailed summary of each relevant commit.

## Tech stack

- Frontend: React + TypeScript
- Backend: Spring Boot
- Database: PostgreSQL
- UI library: Ant Design
- Icons: Font Awesome
- Deploy target: Vercel

## Prerequisites

Install these tools on a new machine before working on the project:

- `Git`
- `Node.js 20.x` or newer
- `npm` (comes with Node.js)
- `Java 17`

You do not need to install Maven globally.
The backend uses the Maven Wrapper: `mvnw` / `mvnw.cmd`.

## New machine setup

From a fresh machine:

```powershell
git clone https://github.com/HugoNeves0808/RITMA-RUNNERS.git
cd RITMA-RUNNERS
```

Install frontend dependencies:

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

No extra installation is required for the backend beyond Java 17.
The first backend run downloads Maven locally through the wrapper.

## Project conventions

- Project-facing text and commit messages should be written in English.
- Conversation with the user can be in Portuguese.
- Do not use Docker for this project.
- Keep frontend and backend as separate projects.
- Avoid defining domain structure, modules, or endpoints prematurely unless explicitly requested.

## Current phase notes

- Domain, modules, endpoints, and detailed internal structure have not been defined yet.
- PostgreSQL is now wired in the backend through environment-based datasource configuration.
- Flyway applies the initial database schema automatically on backend startup.
- The authenticated `Races` area in web and mobile now has a structural base for switching between `Calendar` and `Table` views, ready for future feature work.
- The web `Races` area now includes functional `Monthly` and `Yearly` calendar views backed by authenticated race data from the backend.
- The mobile `Races` area now includes functional `Monthly` and `Yearly` calendar views backed by the same authenticated backend calendar data, with a compact monthly summary layout and a readable full-year overview adapted for smaller screens.
- The backend now also exposes authenticated `Races` table endpoints for grouped yearly listing, race-type options, inline updates, and deletion, including `location`, `officialTime`, `raceTime`, and `raceStatus` data needed by both clients.
- The web `Races` page now opens by default in `Table` mode with a card-based yearly list, a header-level `Current year` / `All years` selector, direct per-race actions, and a `Coming Up` block that highlights registered races for the current week or the next upcoming registered race.
- The web `Races` filters now use collapsible checkbox groups for `Years`, `Race status`, and `Race types`, keep `Calendar mode` as a true switcher, let users manage `race types` directly from the filter title, and show undated `In List` races through a separate top section that follows the `In List (without date)` filter exactly.
- The web `Races` list now adapts each card to the race status, using denser inline rows for `Cancelled`, `Not registered`, `Did not start`, and `Did not finish`, while `Registered` races now surface `circuit` and planned start `time` directly in the main metrics area.
- The web `Best Efforts`, `Users`, and `Pending approvals` pages now share the same filter-card visual language as `Races`, including matching search-input icons, collapsible filter groups, orange checkbox styling, and compact section counters.
- The web `Best Efforts` category summary now keeps `total` as a static count while only `valid` and `excluded` open drill-down race lists, which removes the redundant all-races modal path.
- Web filters across `Races`, `Best Efforts`, `Users`, and `Pending approvals` now survive a browser refresh but are cleared when the user leaves that page and comes back later.
- The web login form now validates the `Email` field on blur instead of immediately while typing, which avoids premature validation noise during sign-in.
- The mobile `Races` page now also opens by default in `Table` mode, includes a matching `Coming Up` block, and uses a shared filters icon that opens switcher-style controls for `Monthly` / `Yearly` calendar mode or `Current year` / `All years` table scope.
- The web and mobile `Races` table views now share a closer visual language, including lighter `REGISTERED` accents, refined `Coming Up` emphasis, and tighter filter/switcher sizing.
- The mobile `Races` table now also supports opening a full race-details modal with `Race data`, `Results`, and `Analysis` sections, matching the existing backend detail payload already used on the web.

## Database configuration

The backend reads PostgreSQL connection settings from environment variables:

- `PGHOST`
- `PGPORT`
- `PGDATABASE`
- `PGUSER`
- `PGPASSWORD`

Default local fallback values are:

```text
PGHOST=localhost
PGPORT=5432
PGDATABASE=ritmarunners
PGUSER=postgres
PGPASSWORD=postgres
```

The initial schema lives in:

- `backend/src/main/resources/db/migration/V1__initial_schema.sql`

## Running the project

Start the backend:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

Start the frontend in a second terminal:

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

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8081`

The Maven wrapper downloads Maven locally into the `.mvn/` folder on first execution.
The backend runs on port `8081` by default.

## Mobile environment

The mobile app reads its public API URL from:

- `mobile/.env`

Expected variable:

```text
EXPO_PUBLIC_API_BASE_URL=http://<your-machine-ip>:8081
```

Use your local machine IP when testing on a physical device with Expo Go.

## First-time verification

After starting both applications:

- open `http://localhost:5173`
- confirm the frontend loads
- confirm the frontend status card reports that the backend is reachable
- confirm the backend health endpoint responds at `http://localhost:8081/api/health`

Expected health response:

```json
{
  "status": "ok"
}
```

## Useful commands

Frontend:

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

## Connectivity test

With both projects running:

- the backend responds at `http://localhost:8081/api/health`
- the frontend shows on the initial screen whether it was able to communicate with that endpoint

## Troubleshooting

If the backend does not start:

- confirm Java 17 is installed with `java -version`
- confirm port `8081` is free
- confirm PostgreSQL is running and the configured database exists
- run `.\mvnw.cmd test` inside `backend`

If the frontend does not start:

- confirm Node.js is installed with `node -v`
- confirm dependencies were installed with `npm install`
- run `npm run build` inside `frontend`

If the mobile app does not start:

- confirm dependencies were installed with `npm install` inside `mobile`
- confirm `mobile/.env` points to the correct backend machine IP
- restart Expo with cache cleanup using `npx expo start -c`
- confirm the backend is reachable from the device at `http://<your-machine-ip>:8081/api/health`

If frontend cannot reach backend:

- confirm backend is running on `http://localhost:8081`
- open `http://localhost:8081/api/health` directly in the browser
- confirm the frontend is running on `http://localhost:5173`

## Notes for future work

- Add real PostgreSQL configuration when the backend data model is ready.
- Replace the temporary health-check flow with real API integration once the first endpoints are defined.
- Introduce internal folder structure only when there is enough domain clarity to justify it.
