# UI Component Behavior (from Mockups) — ClutterCut

Reference the 7 provided mockup screenshots when implementing UI. Key behavioral notes per screen:

---

## Login Screen (/mockups/Image 7.png)

- Centered card layout on a light gray (`#F8FAFB`) background
- Email + password inputs with rounded corners, light gray fill
- Single black "Login" CTA button (full width, `border-radius: 8px`)
- "Continue as Guest" link below the button (not shown in all mockups — add it per PRD §3.2)
- Demo hint text: "Demo: Just click login to continue" — **remove this in production builds**

---

## Folder Selection Screen (/mockups/Image 1.png)

- App chrome: "ClutterCut" wordmark top-left, "History" button top-right (hidden for guests)
- White card with "Select Folder to Organize" heading
- "Browse" button opens native OS folder picker
- Selected path displayed in a monospace code block below
- Full-width black "Start Organizing" CTA at card bottom
- The CTA label in the PRD is "Start Organizing" but the route navigates to `/organize/rules` — keep label consistent with the mockup

---

## Rule Configuration Screen (/mockups/Image 4.png)

- "Back" button top-left (returns to `/organize`)
- White card with "Configure Organization Rules ℹ" heading and folder path subtitle in blue/muted text
- Each rule row contains: numbered badge, Condition dropdown, Value input, Move to Folder input, trash icon button
- "+ Add Rule" full-width dashed/outlined button below rules
- "Preview Changes" full-width black CTA at card bottom
- Rule rows are numbered starting at 1; numbers must update when rules are deleted

---

## Preview Screen (/mockups/Image 3.png)

- "← Back to Rules" button top-left (preserves rule state)
- White card with "Preview Changes" heading and file count subtitle
- Files grouped by destination folder with folder icon, folder name, file count badge
- Each file listed with a `- ` prefix
- "Cancel" (outline) and "Approve & Organize" (black, with ✓ icon) buttons at card bottom side-by-side

---

## Success Screen (/mockups/Image 2.png)

- Centered card, green circular checkmark icon
- "Files Organized Successfully!" heading
- Subtitle: "Your files have been organized according to your rules."
- "View History" (outline) and "Organize Another Folder" (black) buttons side-by-side
- No files affected count shown in mockup — PRD requires it; add it as a subtitle line

---

## History Screen — List View (/mockups/Image 6.png)

- "← Back to Dashboard" button top-left
- White card with "Organization History" heading
- Each run entry: folder path (bold), timestamp + files affected (muted), chevron expand button, "Undo" button with ↺ icon
- Entries in reverse chronological order
- No empty state shown in mockup — implement one for when history is empty

---

## History Screen — Expanded Entry (/mockups/Image 5.png)

- Expanded entry shows "Rules Applied:" section with numbered rule rows (e.g., `Name contains homework → HW`)
- Rule rows use monospace for keyword and destination
- "File Moves:" section mirrors Preview grouping layout (folder icon, folder name, file count, file list)
- Undo button remains visible in the expanded state
