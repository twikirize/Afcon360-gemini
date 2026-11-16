# Pamoja Mobile — Cross-Platform User App (iOS & Android)

Built with **React Native (Expo SDK 52 + TypeScript)** targeting the Pamoja User API (`app/auth/mobile_api.py`, `/api/home/feed`, `/api/events`, `/api/accommodation/*`, `/api/transport/*`, `/api/wallet*`).

## Included User Screens
- **Home**: Pamoja welcome banner, quick service shortcuts, unified discovery feed
- **Events & Pass Checkout**: Search events, inspect venue & dates, select ticket tier, confirm registration
- **Stays**: Filter verified properties by city and book nights
- **Rides**: Request standard/executive/shuttle pickups and view scheduled corridor shuttles
- **Wallet**: View multi-currency balance, top up via Mobile Money, send payments, inspect ledger activity
- **Account**: Sign in / register with `expo-secure-store` Bearer token persistence

## Run on iOS & Android Locally
```bash
cd mobile-app
npm install
EXPO_PUBLIC_API_URL=https://your-pamoja-backend.example.com npx expo start
```
- Press `i` to launch the **iOS Simulator** (macOS / Xcode)
- Press `a` to launch the **Android Emulator** (Android Studio)
- Or build standalone iOS `.ipa` / Android `.apk` / `.aab` binaries with `npx eas build --platform all`
