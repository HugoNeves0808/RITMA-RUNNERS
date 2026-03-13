# RITMA RUNNERS Mobile

Initial mobile base for the RITMA RUNNERS ecosystem.

## Current scope

- `Login` screen
- `Future Goals` public screen
- simple internal navigator for the current two-screen phase
- lightweight auth/request-account service layer prepared to evolve later

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
- The current API base URL is defined in `src/constants/config.ts`.
- If you test on a physical device, you will probably need to replace `localhost` with your machine IP.
