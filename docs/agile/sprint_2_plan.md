# Sprint 2 Planning

**Sprint Goal:** Implement the core file organization logic and finalize preview/history features.
**Dates:** Feb 25, 2026 - Feb 27, 2026


## Planned Tickets/User Stories
1. **[[Issue #18]](https://github.com/edwardchanneu/ClutterCut/issues/18)**: Implement Folder Selection via Native OS File Picker - *Assigned to: hcarminati*
2. **[[Issue #19]](https://github.com/edwardchanneu/ClutterCut/issues/19)**: Implement Rule Configuration — File Extension Condition - *Assigned to: hcarminati*
3. **[[Issue #20]](https://github.com/edwardchanneu/ClutterCut/issues/20)**: Implement Rule Configuration — Name Contains Condition - *Assigned to: hcarminati*
4. **[[Issue #21]](https://github.com/edwardchanneu/ClutterCut/issues/21)**: Implement Multi-Rule Management (Add & Delete Rules) - *Assigned to: edwardchanneu*
5. **[[Issue #22]](https://github.com/edwardchanneu/ClutterCut/issues/22)**: Implement Rule Validation - *Assigned to: edwardchanneu*
6. **[[Issue #23]](https://github.com/edwardchanneu/ClutterCut/issues/23)**: Implement Preview Screen - *Assigned to: edwardchanneu*
7. **[[Issue #27]](https://github.com/edwardchanneu/ClutterCut/issues/27)**: Write Playwright E2E Tests — Organize Flow (Guest & Authenticated) Through Preview - *Assigned to: edwardchanneu*

## Risks and Mitigations
- **Risk**: File moving logic could corrupt user data if there are naming collisions.
- **Mitigation**: Implement a dry-run preview screen (T-05/T-06) that shows exactly what will happen before any `fs` changes occur. Use timestamps or UUIDs for file name collisions.
