# RITMA RUNNERS Mobile

Initial mobile base for the RITMA RUNNERS ecosystem.

## Current scope

- `Login` screen
- `Future Goals` public screen
- persisted mobile authentication flow
- forced password change flow on first login
- request-account flow aligned with frontend feedback states
- lightweight internal navigator prepared to evolve later

## Run locally

```powershell
cd mobile
npm install
npm run start
```

Then use Expo to open the app on:

- Android emulator
- iOS simulator
- Expo Go

## Notes

- The mobile project is intentionally separate from the website.
- The current API base URL is read from `mobile/.env` through `EXPO_PUBLIC_API_BASE_URL`.
- If you test on a physical device, use your machine IP instead of `localhost`.
- Restart Expo with `npx expo start -c` after changing `.env` values.
