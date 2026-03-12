# Changelog

This file keeps a short, slightly more detailed record of what was done in each relevant commit.

## Format

- One entry per relevant commit
- English only
- Keep it concise
- Focus on what changed and why it matters

## Entries

### `Unreleased` - Add initial PostgreSQL schema integration

- Enabled backend datasource configuration through PostgreSQL environment variables.
- Added Flyway to manage database schema changes from versioned SQL migrations.
- Created the initial PostgreSQL schema for users, settings, races, results, analysis, shoes, teams, circuits, and race types.
- Added primary keys, foreign keys, uniqueness rules, indexes, enum types, and consistency checks in the initial migration.
- Isolated backend tests from the datasource so the Spring context can still be validated without a live database.

### `bfd5311` - Set up separate frontend and backend foundations

- Created a dedicated `frontend` project with Vite, React, and TypeScript.
- Added Ant Design and Font Awesome to match the intended UI stack.
- Replaced the default frontend screen with a project-specific landing page.
- Created a dedicated `backend` Spring Boot project as the initial API base.
- Added Maven Wrapper support so the backend can run without a global Maven installation.
- Aligned the backend with Java 17 to match the current local environment.
- Set the backend default port to `8081` to avoid the existing local conflict on `8080`.
- Added a temporary `GET /api/health` endpoint for frontend-to-backend connectivity checks.
- Connected the frontend to the backend health endpoint and surfaced the result in the UI.
- Added onboarding and run instructions to the project documentation.

### `b2719fe` - Initial commit

- Added the initial repository with the base `README.md`.
