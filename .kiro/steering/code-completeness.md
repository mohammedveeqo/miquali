# Code Completeness Rules

inclusion: auto

## Mandatory Rules for All Code Generation

1. **No placeholder comments** — Never write `// TODO`, `// implement later`, `// rest of implementation`, `// similar to above`, or `// ...`. Every function body must be fully implemented.

2. **Complete files only** — Every generated file must be runnable as-is. All imports, exports, type definitions, and implementations must be present.

3. **Every component must include:**
   - Full props interface with JSDoc
   - All state management (hooks, store connections)
   - Loading state
   - Error state
   - Empty state (where applicable)
   - Keyboard accessibility (onKeyDown handlers, tabIndex, aria-labels)
   - All event handlers fully implemented

4. **Every service/utility must include:**
   - Full TypeScript types for inputs and outputs
   - Error handling (try/catch, validation)
   - Edge case handling
   - All helper functions implemented inline (not referenced but missing)

5. **Every test file must include:**
   - All imports
   - Setup/teardown
   - All test cases described in the task
   - Assertions for every requirement referenced
   - No `it.todo()` or `test.skip()` unless explicitly asked

6. **If a file exceeds 300 lines:**
   - Split into logical modules
   - Generate ALL modules in the same response
   - Each module must be complete and importable

7. **After generating code:**
   - Always run `npm run build` or `npx tsc --noEmit` to verify
   - Fix any errors before presenting as done
   - If tests exist, run them

8. **Never say "done" if:**
   - Any function has an empty body
   - Any import references a file that doesn't exist yet
   - The build would fail
   - Required features from the task description are missing
