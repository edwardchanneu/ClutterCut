# Sprint 2 Planning

**Sprint Goal:** Implement the core file organization logic and finalize preview/history features.
**Dates:** (Week 2)

## Team Capacity and Roles
- **Desktop Developer**: 100% Capacity, Focus: Node `fs` operations, Rule Engine
- **Frontend Developer**: 100% Capacity, Focus: Rules UI, Preview UI, History page

## Planned Tickets/User Stories
1. **[T-05]**: Build Organize Screen with multi-step flow (Select Folder -> Rules -> Preview). - *Assigned to: Frontend Dev*
2. **[T-06]**: Implement Rule Engine in React state to group files before moving. - *Assigned to: Frontend Dev*
3. **[T-07]**: Write `fs` node service to safely move files and handle collisions. - *Assigned to: Desktop Dev*
4. **[T-08]**: Persist rules and organization summaries to Supabase database. - *Assigned to: Desktop Dev*
5. **[T-09]**: Write E2E Playwright tests for the complete 'Guest' and 'Authenticated' user flows. - *Assigned to: Frontend + Desktop Pair*

## Risks and Mitigations
- **Risk**: File moving logic could corrupt user data if there are naming collisions.
- **Mitigation**: Implement a dry-run preview screen (T-05/T-06) that shows exactly what will happen before any `fs` changes occur. Use timestamps or UUIDs for file name collisions.
