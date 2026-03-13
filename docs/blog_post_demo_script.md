# ClutterCut: CS7180 Vibe Coding Demo Script

**Total Estimated Demo Time:** ~12-15 Minutes

---

## Part 1: Introduction & The Problem (2 mins)

**(Speaker: Heather)**

*   **Slide 1: Title & CS7180 Introduction**
    *   "Hi everyone, we're Edward and Heather. This is ClutterCut, our Project 2 for Professor John Alexis Guerra Gómez's Spring 2026 CS7180 Vibe Coding class at Northeastern."
    *   "This course explores AI-assisted software engineering. Instead of using AI just for code completion, we collaborated with Claude and GitHub Copilot across the entire lifecycle: product ideation, drafting PRDs, issue generation, implementation, testing, and documentation."
    *   "Our primary experiment in applying this workflow was tackling the digital clutter problem. File systems become chaotic. Automated tools exist, but people don't trust them because they silently move files with no reliable way to undo. When an app moves a file and you can't find it, you never use that app again."

*   **Slide 2: Early User Research**
    *   "Before writing any code, we used Claude to simulate 'Mom Test' interviews. We generated three user archetypes based on real experiences: a freelance designer, a CS grad student, and an everyday office worker. Claude played these personas, revealing specific workarounds and deal-breakers that shaped our non-negotiable requirements: a pre-execution preview and a full undo system."

## Part 2: Architecture & The Core Flow (3 mins)

**(Speaker: Edward)**

*   **Slide 3: Tech Stack & Architecture**
    *   "To build a cross-platform desktop application, we chose Electron for the shell, React for the UI, and Supabase for auth and cloud persistence."
    *   "Security and stability were paramount. The React renderer never touches the file system. All file operations run exclusively in the Electron main process via Node.js `fs` APIs, communicating over clean IPC boundaries. For server state handling our async dependencies, we utilized TanStack Query so caching and loading states didn't bleed into component code."

*   **Switch to App Screen (Guest Mode)**
    *   "Let's show you what we built over 3 sprints. We'll clean up Heather's actual Mac Desktop right now, live. I'll start as a Guest user and select the `Desktop` folder."

*   **Rule Configuration Screen**
    *   "Our core flow is simple: Select a folder, configure rules, preview, and approve."
    *   "We support two condition types: File Extension matching (which is case-insensitive) and Name Contains matching. Let's trace a rule: 'If the File Extension is `mp4`, move it to a folder called `Videos`'. And another: 'If the Name Contains `Screenshot`, move it to a folder called `Images`'. Rules evaluate top-to-bottom, first match wins. Unmatched files stay put."

## Part 3: The Trust Mechanism & Snapshots (3 mins)

**(Speaker: Heather)**

*   **Clicking "Next" to Preview**
    *   "This is our product's primary trust mechanism: **The Preview Screen**. Nothing moves without explicit approval."
    *   "You see every planned operation grouped by destination folder, plus a total file count. If it's wrong, you can hit Back and revise rules without losing your configuration. This looks right, so we'll click 'Approve & Organize'."

*   **Success Screen & Live Cleanup**
    *   *(The files instantly vanish from the macOS Desktop behind the app, moving into their organized folders).*
    *   "The Desktop is clean. Any filename conflicts were resolved automatically by our system with a `_1`, `_2` suffix."

*   **Sign-In & Supabase History**
    *   "What if we want to trace what happened? I'll click 'Sign In' and authenticate with Supabase. Because we're signed in, runs are recorded in our `organization_runs` table, protected by Row Level Security so users only see their own records."
    *   "If I expand a run in the History tab, we see the applied rules and the exact file movements. How do we track this so precisely? Snapshots."
    *   "When an organize run is approved, we capture a before-snapshot as a flat array of filenames, and an after-snapshot as JSON. Crucially, the after-snapshot stores folders we moved files *into* as objects with their contents as arrays, while pre-existing, untouched folders remain plain strings. This structural difference allows our undo system to compute the exact delta. The undo system doesn't guess; it has a precise record."

## Part 4: Reversibility & Offline Support (2 mins)

**(Speaker: Edward)**

*   **Demonstrating Undo**
    *   "Let's demonstrate that precision. I'll click 'Undo' on this recent run and confirm. Watch the Desktop."
    *   *(Click Yes. The files instantly reappear scattered across the macOS Desktop).*
    *   "ClutterCut put everything exactly back where it found them. In Supabase, this is linked flawlessly via metadata flags like `undone`, `is_undo`, and `parent_run_id`."

*   **Offline Mode**
    *   "Because it's a desktop app, it works offline for Guest users. You can still organize your files without Wi-Fi, you just won't be able to access your past history."

## Part 5: Engineering With AI — What Actually Happened (3 mins)

**(Speaker: Heather)**

*   **Slide 4: The Rules File**
    *   "We learned a hard lesson early on. When we prompted our AI assistant without context, it generated a functional login screen that completely ignored our Figma wireframes. It looked like a default dark-mode Electron app."
    *   "AI tools aren't bad at following instructions; they are bad at inferring unstated ones. Our solution, and the most important artifact we produced, was our `.antigravityrules` file."
    *   "This file acted as a style guide and design system for the AI. It encoded design constraints, component naming conventions, UI frameworks, testing expectations—like specifying our exact library setup for `.toBeInTheDocument()` matchers to stop the AI from generating broken import paths. We realized this rules file had to be a living document, updated continuously as we discovered new environment-specific constraints."

*   **Slide 5: Testing, CI/CD, & Scoped Issues**
    *   "With the PRD providing the 'why' and the rules file providing the 'how', we used Claude to generate well-scoped GitHub issues with explicit, testable acceptance criteria. The narrower the scope of a prompt, the more reliable the output."
    *   "This powered our rigorous testing. We maintain Unit tests for rule logic, Integration tests for IPC boundaries, and Playwright E2E tests for full multi-user flows. All of this runs in a GitHub Actions CI pipeline that lints, tests, and builds `.dmg` and `.exe` installers on every push."

*   **Slide 6: What We'd Do Differently & Conclusion**
    *   "If we did this again, we'd do three things differently: 1) Invest in the rules file earlier. 2) Add structured retrospectives after each issue to create a compounding feedback loop on manual fixes. 3) Standardize our explicit acceptance criteria much earlier to improve initial output quality."
    *   "In conclusion, ClutterCut is built on the premise that transparency and reversibility make automation trustworthy. The preview screen and the undo system are the core product."
    *   "Building it with AI taught us that the same principle applies to development: powerful automation works best when it is visible, controllable, and predictable. Thank you."
