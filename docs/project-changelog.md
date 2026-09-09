# Project Changelog

## 2026-09-09

- Completed the first whole-repository feature-based architecture pass: canonicalized shared and feature imports, split owned configuration, and moved feed contracts into the domain layer.
- Hardened the feed API cursor boundary and removed presentation-to-infrastructure type dependencies in Kudos and Profile flows.
- Simplified Kudo form state updates through one typed field updater, reducing repeated state merge callbacks without changing form behavior.
- Declared the direct Base UI dependency and updated generator, lint, and E2E fixture paths for the new layout.
- Added Axios, Zustand, and TanStack Query as the client-state/data foundation.
- Added a shared query provider and HTTP client.
- Added a feature-based Kudos feed slice with a typed API route and infinite query.
- Added a Zustand store for the homepage widget state.
