# Game of Life Frontend — Microfrontends + Storybook

## Overview
This repository contains the Game of Life frontend implemented as a modern microfrontend architecture using Vite, React 18, and Module Federation. It includes a Shell application that composes two MFEs (Board and Controls), shared packages for API client and types, and a production-ready Storybook with MSW for interaction testing.

Core goals: composability, fast DX (Vite), strong typing, and verifiable UI through Storybook + Test Runner.

## Tech Stack
- React 18 + TypeScript (Vite)
- Module Federation (@originjs/vite-plugin-federation)
- TanStack Query for server-state and caching
- Storybook 8 (react-vite) with MSW (msw + msw-storybook-addon)
- Yarn 4 (Berry) workspaces
- Docker + docker-compose for local orchestration

## Monorepo Structure
- apps/
  - board-mfe/ — Board microfrontend
  - controls-mfe/ — Controls microfrontend
  - shell/ — Host that composes MFEs
- packages/
  - types/ — Shared TypeScript contracts
  - api-client/ — Axios-based API client and hooks
- .storybook/ — Storybook config (discovers stories under apps/* and packages/*, MSW enabled)
- storybook-static/ — Static export of Storybook (build output)

## Prerequisites
- Node 20+
- Corepack enabled (provides Yarn 4)
- Docker (optional, for compose-based dev)

Enable Corepack once:

```
corepack enable
```

Install dependencies:

```
yarn install
```

Yarn 4.9.4 is pinned via packageManager in package.json.

## Development
Start everything locally (Shell + Board + Controls) with fixed preview ports for MFEs:

```
yarn dev
```

- Shell: http://localhost:3000
- Board preview: http://localhost:5177
- Controls preview: http://localhost:5178

Environment variables:
- BACKEND_URL (Shell proxy target, default http://localhost:8080)
- VITE_API_URL (MFE API base URL during build/preview; default http://localhost:8080)
- BOARD_REMOTE / CONTROLS_REMOTE (Module Federation remotes for Shell; defaults match the fixed preview ports)

Run apps individually if preferred:

```
yarn workspace @gol/board-mfe dev
yarn workspace @gol/controls-mfe dev
BOARD_REMOTE=http://localhost:5177/assets/remoteEntry.js \
  CONTROLS_REMOTE=http://localhost:5178/assets/remoteEntry.js \
  yarn workspace @gol/shell dev --port 3000
```

## Storybook
Run Storybook locally:

```
yarn storybook
```

- Opens on http://localhost:6006
- MSW is configured; the generated worker is served from public/mockServiceWorker.js

Build static Storybook:

```
yarn build-storybook
```

The static site is emitted to storybook-static/.

## UI Testing with Storybook Test Runner
Install Playwright browsers once:

```
yarn sb:browsers
```

Run tests in two ways:
- Against a running Storybook instance (recommended while developing):
  ```
  yarn storybook
  yarn test:storybook:local
  ```
- Full run (CI-like):
  ```
  yarn test:storybook
  ```

## Linting and Type Checking
- Type check: `yarn typecheck`
- Lint (strict, max 5 warnings): `yarn lint:eslint`
- Auto-fix: `yarn lint:fix`
- Combined: `yarn lint`

## Build
- Shell only: `yarn build:shell`
- Board only: `yarn build:board`
- All workspaces that support build: `yarn build:all`

## Docker
Run the stack using docker-compose with live-reload via bind mounts:

```
docker compose up -d storybook board_mfe controls_mfe shell
```

- Storybook: http://localhost:6006
- Board MFE: http://localhost:5177
- Controls MFE: http://localhost:5178
- Shell: http://localhost:3000

Note: Compose uses Yarn for installs inside containers. Volumes mount your working copy for fast iteration.

## Module Federation and Types
The Shell imports remote modules exposed by MFEs. Ambient module declarations are provided to give TypeScript safety for remote imports.

## Firebase Hosting (optional)
Deploy static Storybook and Vite build outputs to Firebase Hosting:

1) Install tools and initialize (no secrets committed):
```
npm i -g firebase-tools
firebase login
firebase init hosting
```
2) Build artifacts to host (examples):
```
yarn build-storybook                # emits storybook-static/
yarn workspace @gol/shell build     # emits apps/shell/dist
```
3) Deploy:
```
firebase deploy --only hosting
```
Configure firebase.json public directories to point at storybook-static/ or apps’ dist/ folders.

## License
This project is licensed under the MIT License. See LICENSE for details.