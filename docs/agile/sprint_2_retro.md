# Sprint 2 Retrospective

**Date:** Feb 27, 2026

## What went well?
- The preview screen provides a great user experience and caught several potential file organization bugs during development.
- Successfully implemented complex multi-rule management and validation (extensions and name-contains rules).
- E2E tests using Playwright are incredibly stable and correctly mock the Electron `dialog` module.

## What could be improved?
- The `fs` operations are currently synchronous in some areas, which could block the Electron main thread on very large folders.
- Test coverage for the React components could be higher, relying heavily on E2E tests currently.

## Action Items for Next Project/Phase
1. Refactor file moving logic in the main process to use streams or asynchronous batches for better performance on large folders.
2. Add unit tests for individual React components using Vitest and React Testing Library.
3. Add a feature to "Undo" an organization run by reading the database snapshots.

