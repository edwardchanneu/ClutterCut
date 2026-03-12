# AI Mastery Documentation

This document outlines how different AI modalities were utilized throughout the development of ClutterCut, fulfilling the "AI Mastery" rubric requirement.

## Available Modalities Used
1. **Claude Web / Generative Chat**
   - *When/Why used*: Used heavily during the initial planning, architecture design, and database schema creation phases. Given the complexities of Electron's Main/Renderer process separation, Claude was consulted to ensure IPC (Inter-Process Communication) handlers were built securely and avoided exposing the raw `fs` node module directly to the frontend.
2. **IDE Centric (Agentic Coding Assistants)** 
   - *When/Why used*: Used continuously during the active coding phase for inline autocompletion, refactoring, and generating boilerplate. The AI agent had deep context of the workspace, allowing it to seamlessly link the frontend React state directly to the Electron IPC channels.

## Specific Examples and Effectiveness

- **Example 1: Architectural Design with Claude**: We used Claude to design the database schema for the `organization_runs` table in Supabase. By describing our need for an "Undo" feature, Claude suggested storing the `before_snapshot` and `after_snapshot` as `jsonb` columns. This architectural advice saved hours of potential refactoring later.
- **Example 2: Boilerplate Generation**: We used our IDE-centric AI to quickly generate the foundational skeleton for our Playwright End-to-End tests (`auth.spec.ts` and `organize.spec.ts`). We provided a prompt requesting a test suite that mocks native Electron dialogs, and the AI delivered a working scaffold that manipulated the `dialog.showOpenDialog` override.
- **Example 3: Complex State Logic Refactoring**: During the development of the Rule Engine, managing the React state for dynamic arrays of rules (where rules have different input types like "Extension" vs "Name Contains") became unwieldy. We used an IDE agent task boundary to refactor `RulesLocationState` in `types/navigation.ts`, consolidating duplicated properties and using interface inheritance to clean up the code organization smoothly.
