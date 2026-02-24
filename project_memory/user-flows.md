# User Flow Descriptions — ClutterCut

---

## Primary Flow (Authenticated, Online)

```
/login → /organize → /organize/rules → /organize/preview → /organize/success → /history
```

---

## Guest Flow

```
/login (click "Continue as Guest") → /organize → /organize/rules → /organize/preview → /organize/success
```

- History nav hidden for guests
- No Supabase writes

---

## Undo Flow

```
/history → expand entry → click "Undo" → confirmation dialog → undo executes → post-undo summary → entry marked "undone" → new entry added to history representing the undo
```

---

## Offline Authenticated Flow

```
App launch (cached session) → /organize → /organize/rules → /organize/preview → /organize/success
→ run saved to local JSON queue
→ synced to Supabase on reconnect
→ pending indicator shown in /history until synced
```
