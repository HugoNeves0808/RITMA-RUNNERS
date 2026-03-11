# RITMA RUNNERS

Initial solution setup with a clear separation between frontend and backend.

## Structure

- `frontend/`: React + TypeScript application created with Vite and prepared to use Ant Design and Font Awesome.
- `backend/`: Spring Boot application prepared as the API base, with PostgreSQL planned in the stack.

## Current phase notes

- Domain, modules, endpoints, and detailed internal structure have not been defined yet.
- The backend starts without a configured datasource so this initial setup phase is not blocked.

## Running the projects

Frontend:

```powershell
cd frontend
npm install
npm run dev
```

Backend:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

The Maven wrapper downloads Maven locally into the `.mvn/` folder on first execution.
The backend runs on port `8081` by default.

## Connectivity test

With both projects running:

- the backend responds at `http://localhost:8081/api/health`
- the frontend shows on the initial screen whether it was able to communicate with that endpoint
