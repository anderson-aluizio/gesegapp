# Geseg

Mobile app for safety checklist management built with React Native and Expo.

## Tech Stack

- **Framework:** Expo SDK 54 + React Native 0.81
- **Navigation:** Expo Router
- **UI:** React Native Paper
- **Database:** SQLite (expo-sqlite)
- **State:** React Context
- **Error Tracking:** Sentry

## Features

- User authentication
- Checklist creation and management
- Team shift management (turno)
- Data synchronization with server
- Offline-first with local SQLite storage
- Reports and statistics

## Setup

```bash
# Install dependencies
yarn install

# Copy environment file
cp .env.example .env

# Start development server
yarn start

# Run on Android
yarn android

# Run on iOS
yarn ios
```

## Environment Variables

```
EXPO_PUBLIC_API_URL=https://your-api-url.com/api
LOCAL_VERSION=0.0.1
```

## Project Structure

```
src/
├── app/              # Routes (Expo Router)
│   ├── (tabs)/       # Authenticated screens
│   └── checklist/    # Checklist screens
├── components/       # Reusable components
├── contexts/         # React contexts (Auth, Theme)
├── database/         # SQLite models and migrations
├── hooks/            # Custom hooks
├── services/         # API services
├── types/            # TypeScript types
└── utils/            # Utility functions
```

## Build

```bash
# Build APK
eas build --platform android --profile preview

# Build for production
eas build --platform android --profile production
```
