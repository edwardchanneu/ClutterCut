# ClutterCut: Building a Trust-First File Organizer with AI-Assisted Development

How we built a transparent and reversible desktop file organization tool and what we learned about engineering with AI along the way.

## The Problem We Wanted to Solve

Most people's file systems are a mess. Lecture slides, half-finished homework, research papers, random screenshots all sitting in one flat pile that grows by the week. Automated organization tools do exist, but the most common complaint about them is not that they don't work. It's that they can't be trusted. The first time a tool silently moves a file somewhere unexpected and there's no way to find it or undo it, that's usually the last time someone uses it.

That insight became the core of ClutterCut: a cross-platform Electron desktop application for organizing files using user-defined rules, built around a non-negotiable pre-execution preview and a full undo system. Before writing a single line of code, we used Claude to simulate Mom Test interviews across three user archetypes we drew from our own experience: a freelance designer, a CS grad student, and an everyday office worker. The personas weren't invented arbitrarily, they reflect real categories of file system pain we were already familiar with. Claude played each persona and responded to our questions in character, surfacing the kinds of concerns, workarounds, and deal-breakers each user type would realistically have.

We built ClutterCut over five sprints as our full-stack application project, using AI assistance extensively throughout. This post is about both the product and the process.

## Architecture Decisions

The tech stack centers on Electron for the desktop shell, React for the UI, and Supabase for authentication and cloud persistence. All file system operations, like reading directories, moving files, capturing snapshots, run exclusively in the Electron main process via Node.js `fs` APIs. The renderer process never touches the file system directly. Communication between them happens over IPC (Inter-Process Communication), which keeps security boundaries clean and makes file operations easier to test in isolation.

For server state management we used TanStack Query, which handles caching and loading states for the history screen without requiring manual fetch logic in components. This paid off on the history screen specifically, which involves several async dependencies (e.g. fetching runs, expanding details, triggering undos) and TanStack Query kept that complexity from bleeding into component code.

The most interesting architectural decision was the snapshot format. When a user approves an organization run, we capture a before-snapshot and an after-snapshot of the target directory as JSON. The before-snapshot is a flat array of top-level filenames and subdirectory names. The after-snapshot uses a key structural distinction: folders that ClutterCut moved files into are represented as objects (with their contents as arrays), while pre-existing folders that were not touched remain as plain strings. That difference is what the undo system keys off of, it reads the delta between the two snapshots to determine exactly which files ClutterCut moved and where they came from, rather than inferring it from file metadata after the fact.

This is a small design detail with a large impact on reliability. Undo doesn't guess. It has a precise record.

## The Features That Matter

The core flow of our application is: 
- Select a folder 
- Configure rules 
- Preview changes 
- Approve 
- Success

Rules support two condition types: 
- File extension matching (case-insensitive) 
- Name-contains matching. 

Each rule specifies a destination folder name. Rules are evaluated top-to-bottom, first match wins. Unmatched files are left in place.

The preview screen is the product's primary trust mechanism. Before a single file moves, the user sees every planned operation grouped by destination folder, with a total file count and the option to navigate back and revise rules without losing their configuration. Nothing happens until the user explicitly clicks "Approve & Organize."

The undo system records every run in Supabase's `organization_runs` table, which stores the rules array as JSONB, both snapshots, and metadata including `undone`, `is_undo`, and `parent_run_id`. This explicit linking perfectly maps each undo back to its source operation. Row Level Security on the Supabase table ensures users can only access their own records.

For offline support, authenticated users who lose connectivity can still run the full organize flow. Completed runs are serialized to a JSON queue file in Electron's `userData` directory, surviving app restarts, and synced to Supabase automatically when connectivity is restored. The UI shows a persistent offline indicator and marks pending-sync runs in the history list until the sync is confirmed.

## Engineering With AI: What Actually Happened

We used Claude throughout the project for drafting the PRD, generating GitHub Issues, building an `.antigravityrules` file for our AI coding assistant, and for implementation itself. The experience clarified some things about AI-assisted development that aren't obvious until you've run into the failure modes directly. The most important artifact we produced was not a feature. It was a rules file.

Early on, when we prompted our coding assistant without additional context, it generated working code that was wrong for our use case. The login screen came back with dark Electron-style components that were technically functional, but completely misaligned with our Figma wireframes and the design language we had established in the PRD. The AI had no way to know what our product was supposed to look like, so it defaulted to its own assumptions about what an Electron app should look like.

The `.antigravityrules` file changed this. It encoded our design constraints, component naming conventions, testing expectations, import path conventions, and UI framework choices in a form that could be included as persistent context in every code generation session. After adding it, the AI's output matched our wireframes closely enough to use directly. The before-and-after on the login screen implementation is about as clear a demonstration of context engineering as we encountered: same prompt, same model, completely different result.

This points to something worth naming directly: AI coding tools are not bad at following instructions, they are bad at inferring unstated ones. The `.antigravityrules` file is the equivalent of a style guide and design system for a human developer. It doesn't tell the AI what to build. It tells it how things should look and behave. The PRD provides the why. The rules file provides the how. Together, they close the gap between product vision and code output in a way that neither document does alone.

The GitHub Issues setup reinforced this pattern. We used Claude to generate well-scoped issues grounded in the PRD, each with explicit, testable acceptance criteria. The narrower the scope of a prompt, the more reliable the output. When we pointed the AI at a single, well-defined issue with clear criteria it could treat as a checklist, the output was far more usable than when we gave it a broader and more open-ended request. The issues also created a shared paper trail that kept both of us aligned on what had been generated, what had been accepted, and what still needed revision.

One concrete failure we hit: generated test files would throw errors on `.toBeInTheDocument()` matchers and component import paths, even when the underlying logic was correct. These are environment-specific constraints the AI simply doesn't know about unless they're provided. We added a testing section to the `.antigravityrules` file specifying the exact library setup and import path conventions, after that, generated test files were compatible out of the box. The lesson here is that the rules file needs to be treated as a living document, updated continuously as new environment-specific constraints are discovered, rather than written once and forgotten.

## Testing and CI/CD

Test coverage was a consistent priority across all five sprints. Unit tests cover rule matching logic (including case-insensitivity across both condition types), snapshot generation, filename conflict resolution (the `_1`, `_2` suffix system), session handling edge cases, and Supabase write/skip behavior based on auth state. Integration tests cover the IPC boundary between the main and renderer processes. Playwright E2E tests cover the full organized flow for both authenticated and guest users, back navigation with rule state preservation, the empty folder edge case, and the full undo flow including the confirmation dialog and post-undo history entry state.

The GitHub Actions CI pipeline runs linting, unit tests, and an Electron build check on every push and pull request to `main` and `develop`. The release workflow triggers on version tags and produces both a `.dmg` installer for macOS and a `.exe` installer for Windows, uploaded as GitHub Release assets.

## What We'd Do Differently

There are three things we'd change with another pass.

First, invest in the `.antigravityrules` file from the start rather than building it reactively. We wrote it after already seeing what the AI produced without it. Starting with a thorough rules file would have saved revision time on the first several issues and established better habits earlier in the project.

Second, add a structured retrospective after every closed issue, just a few sentences documenting what the AI got right, what required manual revision, and whether the `.antigravityrules` file needs updating. Treating it as a continuous feedback loop rather than a one-time setup would make the system compound in value over time.

Third, establish a consistent acceptance criteria format earlier. Some of our early issues were written at a level of abstraction that made it hard to determine when they were truly done. Explicit, testable criteria in a predictable format, something the AI could parse and use as a definition of success, significantly improved output quality once we adopted it consistently.

## Conclusion

ClutterCut is a bet that transparency and reversibility are the features that actually determine whether someone will trust and adopt an automated tool. The preview screen and the undo system aren't layers added on top of the core product, they are the core product. Everything else exists in service of the central finding from our user research: people don't distrust automation because it's powerful. They distrust it because they can't see what it's doing and can't undo it when it goes wrong.

Building it with heavy AI assistance was itself an exercise in the same principle. AI is a powerful tool. The `.antigravityrules` file, the scoped issues, and the structured criteria are the transparency layer that makes it reliable.

That symmetry feels like the right place to end.

