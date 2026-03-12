# Sprint 2 Planning

**Sprint Goal:** Implement the core file organization logic and finalize preview/history features.
**Dates:** (Week 2)

## Team Capacity and Roles
- **Desktop Developer**: 100% Capacity, Focus: Node `fs` operations, Rule Engine
- **Frontend Developer**: 100% Capacity, Focus: Rules UI, Preview UI, History page

## Planned Tickets/User Stories
1. **[[Issue #8]](https://github.com/edwardchanneu/ClutterCut/issues/8)**: Implement guest mode (no auth, no history) - *Assigned to: Frontend Dev*
2. **[[Issue #25]](https://github.com/edwardchanneu/ClutterCut/issues/25)**: E2E tests and configured CI - *Assigned to: Desktop Dev*
3. **[[Issue #26]](https://github.com/edwardchanneu/ClutterCut/issues/26)**: Configure GitHub releases for macOS and Windows distribution - *Assigned to: Desktop Dev*
4. **[[Issue #14]](https://github.com/edwardchanneu/ClutterCut/issues/14)**: Implement Sign Out - *Assigned to: Frontend Dev*
5. **[[Issue #15]](https://github.com/edwardchanneu/ClutterCut/issues/15)**: Implement In-App Sign Up via Supabase Auth - *Assigned to: Frontend Dev*

## Risks and Mitigations
- **Risk**: File moving logic could corrupt user data if there are naming collisions.
- **Mitigation**: Implement a dry-run preview screen (T-05/T-06) that shows exactly what will happen before any `fs` changes occur. Use timestamps or UUIDs for file name collisions.
