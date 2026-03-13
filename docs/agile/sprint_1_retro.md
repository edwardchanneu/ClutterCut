# Sprint 1 Retrospective

**Date:** Feb 26, 2026

## What went well?
- Fast initial setup achieved using Electron-Vite template.
- Successful integration with Supabase for user authentication, including session persistence.
- E2E testing framework (Playwright) was set up early, validating the auth flows.
- Implemented Guest Mode early to unblock non-authenticated features.
- Successfully configured cross-platform automated GitHub Releases via CI/CD.

## What could be improved?
- The CI pipeline for automated testing failed initially due to environment variable configurations.
- Some team members found the boundary between the `main` process and `renderer` process confusing at first.

## Action Items for Next Sprint
1. Document environment variable requirements clearly in `.env.example`.
2. Consolidate IPC channels into a `shared` folder so both main and renderer have strong typings.
3. Begin core file manipulation logic (read/move) in the main process.

