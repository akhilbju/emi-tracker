# EMI Tracker — React + .NET 8 + Capacitor Android

Personal EMI tracker with a responsive dashboard, local-first data, EMI creation/editing, recurrence, due-date tracking, bank filtering and payment history.

## Run the frontend
Requires Node.js 20+.
```bash
cd frontend
npm install
npm run dev
```

## Android package
Install Android Studio and the Android SDK, then:
```bash
cd frontend
npm install
npm install -D @capacitor/cli
npm run build
npx cap add android
npx cap sync android
npx cap open android
```
Run/build the Android project from Android Studio. After frontend edits: `npm run build && npx cap sync android`.

## Optional .NET 8 API
```bash
cd backend/EmiTracker.Api
dotnet run
```
`GET /api/health` checks the service. EMI data is stored locally by the React app and does not require the API.

## EMI features
- Add/edit/delete a plan: name, bank/lender, amount, first due date, recurrence (monthly, weekly, yearly, one-time), and remaining occurrences.
- Leave occurrence count empty for ongoing/unlimited recurrence.
- Bank filtering and name search.
- Dashboard totals, upcoming due items, and payment history.
- Reconciliation advances past due occurrences on app startup, reduces remaining count, and creates an **Auto-assumed paid** history item. This is a convenience assumption, not confirmation from the bank.
- Data persists in localStorage on the device/browser.

## Seed data assumptions
Original seven entries are preloaded. Unspecified bank values are “Not specified”; My Phone due date is initialized to day 1 because the original due day was not provided. Edit this on the app.


## EMI due notifications
On a native Android build, the app schedules a local notification for **9:00 AM on the day before each active EMI due date**. The app requests notification permission when notification scheduling is first attempted. When an EMI is edited, marked paid, deleted, or its schedule advances, the app refreshes its pending reminder. Browser preview does not schedule Android notifications.
