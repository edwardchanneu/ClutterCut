# ClutterCut - 10-Minute Demo Script

**Total Estimated Demo Time:** ~8-10 Minutes

---

## Part 1: Introduction & Guest Mode (2 mins)

**(Speaker: Heather)**

*   **Slide 1: Title & Problem Statement**
    *   "Hi everyone, we're Edward and Heather, and this is ClutterCut. Our mission is to solve the digital clutter problem—specifically, the chaotic 'Downloads' or 'Documents' folder we all have."
    *   "Existing tools work, but people don't use them. Why? Because file organization requires *trust*. If a tool silently moves your files and you don't know where they went, you'll never use it again. We built ClutterCut to be completely transparent and, most importantly, reversible."

*   **Switch to App Screen (Guest Mode)**
    *   "Let's jump right in. To prove this works, we aren't using a fake test folder. We're going to clean up my actual Mac Desktop right now, live."
    *   *(Minimize the presentation to show a very messy macOS Desktop behind the ClutterCut app window).*
    *   "I'll start as a Guest user. I'll click 'Choose Folder' and select my `Desktop`. You can see all these screenshots, screen recordings, MP4s, and random PDFs literally sitting right here."

## Part 2: Building Rules & The Preview Screen (3 mins)

**(Speaker: Edward)**

*   **Rule Configuration Screen**
    *   "Now we're in the Rules Engine. We want to organize this mess safely. I'll add our first rule: 'If the File Extension is `mp4`, move it to a folder called `Videos`'."
    *   "Let's add a second rule. This time, we'll use a Name Contains condition. 'If the Name Contains `Screenshot`, move it to a folder called `Images`'."

*   **Clicking "Next" to Preview**
    *   "This is the most important screen in the application: **The Preview Screen**. Notice that *no files have been moved yet*."
    *   "ClutterCut runs a complete dry-run against the local filesystem using Node.js. It groups exactly what it plans to do: It shows us exactly which files are going into `Videos` and which are going into `Images`."
    *   "If we don't like this, we can hit Back, and our rule state is preserved. But this looks perfect, so we're going to trust the app and click 'Approve & Organize'."

*   **Success Screen & Live Cleanup**
    *   "The Node `fs` service safely moves the files and handles any naming collisions automatically without overwriting data. Let's click 'Approve & Organize'."
    *   *(The files instantly vanish from the macOS Desktop behind the app, moving into their organized folders).*
    *   "And just like that, the Desktop is clean. The files were organized in real-time."

## Part 3: Authentication & History (2 mins)

**(Speaker: Heather)**

*   **Sign-In & Supabase**
    *   "Guest mode is great, but what if we want to keep a record of what we've done? I'll click 'Sign In' and authenticate with Supabase."
    *   "Because we're signed in, ClutterCut now persists our 'Organization Runs' to the cloud. I'll go to the History tab."

*   **The History Screen**
    *   "Here, we can see a timeline of every time I've run the app. If I expand one of these runs, I can see exactly what rules were applied and a summary of what moved."
    *   "We achieve this by taking a snapshot of the directory tree *before* the run, and a snapshot *after* the run, and saving that JSON structure to Supabase."

## Part 4: The Undo Engine (2 mins)

**(Speaker: Edward)**

*   **Demonstrating Undo**
    *   "But what happens if I realize, a week later, that I organized my Desktop by mistake? This is the core 'trust' feature of ClutterCut: the full Undo."
    *   "I'll click 'Undo' on this recent run. ClutterCut prompts me to confirm. Keep your eye on the Desktop behind the app."
    *   "When I click 'Yes', the app reads the delta between the before and after snapshots, finds the exact files it moved..."
    *   *(Click Yes. The files instantly reappear scattered across the macOS Desktop).*
    *   "...and it puts them *exactly* back where it found them."

*   **Undo as a New Entry**
    *   "And you'll notice in the History screen, that the Undo operation was just logged as a *new* event, perfectly maintaining the audit trail."

## Part 5: Building It — Sprints & AI (2 mins)

**(Speaker: Edward)**

*   **The 3-Sprint Agile Process**
    *   "To actually build this, we treated it like a real product. We worked in strict 1-week Agile Sprints—three in total."
    *   "Sprint 1 was the foundation: Electron, UI Shell, CI/CD, and Supabase Auth."
    *   "Sprint 2 was the core logic: the Rules Engine, native folder selection, and the Preview screen."
    *   "And Sprint 3 tied it all together with Execution, the History view, and the Undo system."

*   **Engineering & The Rules File**
    *   "Because we were splitting the work across the stack, we realized quickly that two separate developers can easily end up writing two completely different codebases."
    *   "To solve this, we created a shared `.antigravityrules` file. It was our source of truth."
    *   "This file detailed exactly how we wanted code written: It contained our specific folder structure conventions, the exact UI component libraries to use, requirements for isolating the Electron IPC channels, and our standard syntax for writing Playwright E2E tests."
    *   "Sticking relentlessly to this shared architecture document is why our component library and backend services feel cohesive, rather than pieced together."

## Part 6: Offline Mode & Conclusion (1 min)

**(Speaker: Heather)**

*   **Offline Queue Mention**
    *   "Finally, because this is a desktop app, it needs to work on a plane or without Wi-Fi. If I disconnect my internet right now and run an organization, it still works. The Electron main process intercepts the run, queues it locally in a JSON file, and automatically syncs it back to Supabase the second I reconnect, updating my History seamlessly."

*   **Conclusion**
    *   "Transparent previews, complete reversibility with Undo, and seamless offline support. That's ClutterCut. Thank you."
