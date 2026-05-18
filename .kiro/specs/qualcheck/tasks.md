# Implementation Plan: QualCheck

## Overview

QualCheck is a client-side interactive learning platform for AWS SAP-C02 certification built with Next.js 14 App Router, TypeScript, Tailwind CSS, shadcn/ui, React Flow, and Zustand. Implementation follows an incremental approach: project scaffolding → data layer → state management → core UI → AI integration → canvas → progression gating → dashboard/utilities → final wiring.

## Tasks

- [x] 1. Set up project structure and core infrastructure
  - [x] 1.1 Initialize Next.js 14 project with TypeScript, Tailwind CSS, and shadcn/ui
    - Create Next.js 14 App Router project with TypeScript strict mode
    - Configure Tailwind CSS with dark mode as default (`class` strategy, dark applied to html)
    - Install and configure shadcn/ui component library
    - Install dependencies: zustand, react-flow, fast-check (dev)
    - Set up directory structure: `src/app/`, `src/components/`, `src/lib/`, `src/stores/`, `src/types/`, `src/content/`, `src/services/`
    - Configure ESLint and Prettier
    - _Requirements: 15.1, 16.4_

  - [x] 1.2 Define core TypeScript interfaces and types
    - Create `src/types/content.ts` with TopicContent, QuizQuestion, QuizOption, DiagramTask, CapstoneChallenge, RubricWeights, Flashcard, GlossaryEntry, KeywordReference interfaces
    - Create `src/types/canvas.ts` with CanvasComponentDefinition, ConnectionType, PlacementRule, CanvasComponentInstance, ConnectionPoint, DiagramState interfaces
    - Create `src/types/state.ts` with ProgressState, TopicProgress, CanvasState, AIChatState, QuizState, DiagramTaskProgress, SectionQuizAttempt, CapstoneProgress, FlashcardStatus, StudyStreakData interfaces
    - Create `src/types/ai.ts` with ChatMessage, TopicContext, DiagramSubmission, ArchitectureReview, CategoryScore interfaces
    - Create `src/types/progression.ts` with ProgressionConfig, Section, Cluster interfaces
    - _Requirements: 14.1, 14.2_

  - [x] 1.3 Set up Next.js App Router routing structure
    - Create route files: `src/app/page.tsx` (dashboard), `src/app/topics/[topicId]/page.tsx`, `src/app/topics/[topicId]/chat/page.tsx`, `src/app/topics/[topicId]/quiz/page.tsx`
    - Create route files: `src/app/diagrams/[taskId]/page.tsx`, `src/app/section-quiz/page.tsx`, `src/app/capstone/[challengeId]/page.tsx`
    - Create route files: `src/app/flashcards/page.tsx`, `src/app/glossary/page.tsx`
    - Create root layout with dark mode class, metadata, and global styles
    - _Requirements: 1.1, 15.1_

- [x] 2. Implement static content data layer
  - [x] 2.1 Create content JSON files and schema validation
    - Create `src/content/topics/` directory with sample topic JSON files (18 topics for Networking section)
    - Create `src/content/quizzes/` with mini-quiz question pools (8-10 per topic)
    - Create `src/content/diagrams/` with 8 grouped diagram task definitions
    - Create `src/content/section-quiz.json` with 20 section quiz questions
    - Create `src/content/capstone/` with 5 capstone challenge definitions
    - Create `src/content/flashcards.json` with ~60 flashcard entries
    - Create `src/content/glossary.json` with ~30 glossary entries
    - Create `src/content/keywords.json` with 40-50 keyword tooltip definitions
    - Create `src/content/progression.json` with section/cluster/topic ordering
    - Implement build-time JSON validation script using Zod schemas
    - _Requirements: 14.1, 14.2, 14.3_

  - [ ]* 2.2 Write property test for content JSON validation (Property 27)
    - **Property 27: Content JSON validation**
    - Generate random valid/invalid JSON structures; verify validation pass/fail with descriptive errors
    - **Validates: Requirements 14.3**

  - [x] 2.3 Implement ContentService
    - Create `src/services/content-service.ts` implementing the ContentService interface
    - Implement getTopicContent, getQuizPool, getSectionQuizQuestions, getDiagramTask, getFlashcards, getGlossaryEntries, getKeywordTooltips, getCapstoneChallenge
    - Load and parse static JSON at build time using Next.js static imports
    - _Requirements: 14.1, 14.2_

- [x] 3. Implement state management with Zustand persistence
  - [x] 3.1 Create Progress Store with localStorage persistence
    - Create `src/stores/progress-store.ts` with Zustand store implementing ProgressState
    - Configure Zustand `persist` middleware with localStorage adapter
    - Implement actions: markTopicRead, completeConceptChat, completeMiniQuiz, completeDiagramTask, completeSectionQuiz, completeCapstone
    - Implement study streak tracking (consecutive days with activity)
    - Implement flashcard progress tracking (got-it / review-again)
    - Handle corrupted state: detect invalid data on hydration, reset to defaults, notify user
    - _Requirements: 8.5, 8.6, 13.1, 13.2, 13.3, 13.4_

  - [ ]* 3.2 Write property test for state persistence round-trip (Property 19)
    - **Property 19: State persistence round-trip**
    - Generate random valid application states; serialize to localStorage and deserialize; verify equivalence
    - **Validates: Requirements 8.5, 8.6, 9.5, 12.5, 13.1**

  - [ ]* 3.3 Write property test for corrupted state graceful fallback (Property 26)
    - **Property 26: Corrupted state graceful fallback**
    - Generate invalid/corrupted/unparseable localStorage data; verify system initializes with defaults and produces notification
    - **Validates: Requirements 13.4**

  - [x] 3.4 Create Canvas Store
    - Create `src/stores/canvas-store.ts` with Zustand store implementing CanvasState
    - Implement actions: addComponent, removeComponent, moveComponent, addConnection, removeConnection, setSelectedComponent, setValidationErrors
    - _Requirements: 6.1, 6.2_

  - [x] 3.5 Create AI Chat Store
    - Create `src/stores/ai-chat-store.ts` with Zustand store implementing AIChatState
    - Implement actions: addMessage, setStreaming, incrementExchangeCount, incrementSessionMessageCount, setAssessmentResult, resetChat
    - _Requirements: 2.3, 7.4_

  - [x] 3.6 Create Quiz Store
    - Create `src/stores/quiz-store.ts` with Zustand store implementing QuizState
    - Implement actions: setQuestions, answerQuestion, skipQuestion, incrementCorrectCount, resetQuiz
    - _Requirements: 3.2, 3.3, 3.5_

- [x] 4. Implement Progression Engine
  - [x] 4.1 Create ProgressionEngine service
    - Create `src/services/progression-engine.ts` implementing the ProgressionEngine interface
    - Implement isTopicUnlocked: first topic always unlocked, subsequent topics require previous mini-quiz passed
    - Implement isQuizUnlocked: requires concept chat passed for that topic
    - Implement isDiagramTaskPending: all cluster topics complete but diagram not submitted
    - Implement isSectionQuizUnlocked: all 18 topics complete AND all diagram tasks submitted
    - Implement isCapstoneUnlocked: section quiz passed (≥70%)
    - Implement completion methods that update progress store
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 3.1, 3.7, 4.1, 4.4, 5.1, 5.3_

  - [ ]* 4.2 Write property test for concept chat unlocks mini-quiz (Property 3)
    - **Property 3: Passing concept chat unlocks mini-quiz**
    - For any topic where Concept_Chat is passed, verify Mini_Quiz is unlocked
    - **Validates: Requirements 3.1**

  - [ ]* 4.3 Write property test for topic completion unlocks next topic (Property 7)
    - **Property 7: Topic completion unlocks next sequential topic**
    - For any topic (except last), marking complete causes next topic to unlock
    - **Validates: Requirements 3.7**

  - [ ]* 4.4 Write property test for cluster diagram gates next cluster (Property 8)
    - **Property 8: Cluster diagram task gates next cluster**
    - For any cluster with all topics complete but diagram not submitted, next cluster topics remain locked
    - **Validates: Requirements 4.1, 4.5, 8.3**

  - [ ]* 4.5 Write property test for diagram submission unlocks regardless of quality (Property 9)
    - **Property 9: Diagram submission unlocks regardless of quality**
    - For any diagram submission (any content), next cluster unlocks immediately
    - **Validates: Requirements 4.4**

  - [ ]* 4.6 Write property test for section quiz unlocks after all prerequisites (Property 10)
    - **Property 10: Section quiz unlocks after all prerequisites**
    - When all 18 topics complete AND all diagram tasks submitted, section quiz is unlocked
    - **Validates: Requirements 5.1**

  - [ ]* 4.7 Write property test for section quiz pass/fail threshold (Property 11)
    - **Property 11: Section quiz pass/fail threshold**
    - Section passes iff score ≥ 14/20; below 14 results in failure
    - **Validates: Requirements 5.3, 5.4**

  - [ ]* 4.8 Write property test for incomplete quiz blocks next topic (Property 17)
    - **Property 17: Incomplete quiz blocks next topic**
    - For any topic where mini-quiz not passed, next topic remains locked
    - **Validates: Requirements 8.2**

  - [ ]* 4.9 Write property test for section quiz gates capstone (Property 18)
    - **Property 18: Section quiz gates capstone access**
    - When section quiz not passed, all capstone challenges remain locked
    - **Validates: Requirements 8.4**

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement Quiz Logic
  - [x] 6.1 Implement Mini-Quiz component and logic
    - Create `src/components/quiz/MiniQuiz.tsx` with pool-based question selection
    - Implement question drawing from topic pool (8-10 questions)
    - Implement correct answer accumulation (3 to pass, mark topic complete)
    - Implement incorrect answer feedback with explanation display
    - Implement skip functionality (show different question from pool)
    - Implement refresh option (restart with new random selection)
    - Wire to Quiz Store and Progress Store
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [ ]* 6.2 Write property test for quiz pool integrity (Property 4)
    - **Property 4: Quiz pool integrity**
    - All presented questions belong to topic's pool; pool size is 8-10 inclusive
    - **Validates: Requirements 3.2**

  - [ ]* 6.3 Write property test for quiz completion at 3 correct (Property 5)
    - **Property 5: Quiz completion at 3 correct answers**
    - Topic marked complete at exact moment 3rd correct answer recorded
    - **Validates: Requirements 3.3**

  - [ ]* 6.4 Write property test for skip produces different question (Property 6)
    - **Property 6: Skip produces a different question**
    - Skipping current question produces a different question from same pool
    - **Validates: Requirements 3.5**

  - [x] 6.5 Implement Section Quiz component
    - Create `src/components/quiz/SectionQuiz.tsx` presenting 20 questions
    - Implement scoring with 70% threshold (14/20 to pass)
    - Display score with weak area identification on failure
    - Allow retake on failure
    - Wire to Progress Store for section completion
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 7. Implement Topic Page and Content Display
  - [x] 7.1 Implement TopicPage component
    - Create `src/components/topic/TopicPage.tsx` rendering all content sections
    - Render explanation (markdown), analogy, diagram (SVG), key points, exam keywords, common mistakes, related topics
    - Integrate KeywordTooltip component for inline keywords
    - Track topic reading state
    - _Requirements: 1.1, 1.4_

  - [x] 7.2 Implement KeywordTooltip component
    - Create `src/components/topic/KeywordTooltip.tsx` with three visual styles
    - Implement exam-signal (gold), service-reference (blue + SVG icon), architecture-term (purple)
    - Implement hover/tap activation with definition display
    - Render optional mini-diagram SVG in tooltip
    - Ensure ARIA labels and keyboard accessibility
    - _Requirements: 1.2, 1.3, 15.4_

  - [ ]* 7.3 Write property test for keyword type determines tooltip style (Property 1)
    - **Property 1: Keyword type determines tooltip style**
    - For any keyword with defined type, verify bijective mapping to visual style
    - **Validates: Requirements 1.2**

- [x] 8. Implement AI Service and Chat Components
  - [x] 8.1 Implement AIService
    - Create `src/services/ai-service.ts` implementing the AIService interface
    - Implement streamTutorResponse using Nova Lite with streaming (via Next.js API route or direct)
    - Implement assessConceptUnderstanding using Nova Lite with streaming
    - Implement reviewArchitecture using Nova Pro with structured rubric response
    - Implement error handling: timeout (3s to first token), retry, rate limiting, invalid response format
    - Create `src/app/api/ai/route.ts` API route for Bedrock key management
    - _Requirements: 2.2, 2.6, 4.3, 6.6, 7.3, 7.5, 16.2_

  - [x] 8.2 Implement ConceptChat component
    - Create `src/components/chat/ConceptChat.tsx` with streaming chat interface
    - Track exchange count (max 4 Learner messages)
    - Determine pass/fail based on AI assessment response
    - Unlock Mini-Quiz on pass; allow retry on fail
    - Wire to AI Chat Store
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 8.3 Write property test for concept chat exchange limit (Property 2)
    - **Property 2: Concept chat enforces exchange limit**
    - System never allows more than 4 Learner messages; session terminates after 4th
    - **Validates: Requirements 2.3**

  - [x] 8.4 Implement AITutorChat component
    - Create `src/components/chat/AITutorChat.tsx` docked at bottom of topic pages
    - Implement streaming responses from Nova Lite
    - Include current topic context in each request
    - Implement 20-message soft limit with notification
    - Integrate voice input button
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ]* 8.5 Write property test for topic context in AI requests (Property 15)
    - **Property 15: Topic context included in AI requests**
    - For any AI Tutor message from a Topic_Page, request payload includes topic identifier and context
    - **Validates: Requirements 7.2**

  - [ ]* 8.6 Write property test for AI tutor session message limit (Property 16)
    - **Property 16: AI tutor session message limit**
    - System tracks message count and displays notification at/near 20 messages
    - **Validates: Requirements 7.4**

  - [ ]* 8.7 Write property test for AI review response structure (Property 14)
    - **Property 14: AI review response structure**
    - Parsed result contains exactly 4 category scores with weights summing to 1.0, overall score, and feedback
    - **Validates: Requirements 6.7**

- [x] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Implement Architecture Canvas
  - [x] 10.1 Implement Canvas Validation Engine
    - Create `src/services/canvas-validation-engine.ts` implementing CanvasValidationEngine interface
    - Implement 9 placement rules with error/warning severity levels
    - Implement validatePlacement for real-time single-component validation
    - Implement validateDiagram for full diagram validation before submission
    - Return ValidationResult with ruleId, severity, message, affectedComponents
    - _Requirements: 6.3, 6.4, 6.5_

  - [ ]* 10.2 Write property test for canvas validation evaluates all rules (Property 12)
    - **Property 12: Canvas validation evaluates all rules**
    - For any component placement, validation engine evaluates all 9 rules and returns result for each applicable rule
    - **Validates: Requirements 6.3**

  - [ ]* 10.3 Write property test for submission eligibility (Property 13)
    - **Property 13: Submission eligibility based on validation severity**
    - Submission blocked iff at least one error-level violation exists; warnings allow submission
    - **Validates: Requirements 6.4, 6.5**

  - [x] 10.4 Implement ArchitectureCanvas component
    - Create `src/components/canvas/ArchitectureCanvas.tsx` using React Flow
    - Implement component palette with 20 MVP-enabled components (container, standalone, attached)
    - Implement drag-and-drop from palette to canvas
    - Implement 8 connection types with distinct visual styles
    - Integrate real-time placement validation (show errors/warnings inline)
    - Implement submission flow: validate → send to AI → display results
    - Block submission on error-level violations; allow on warnings only
    - Ensure canvas interactions under 100ms latency
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 16.3_

  - [x] 10.5 Implement Grouped Diagram Task page
    - Create `src/app/diagrams/[taskId]/page.tsx` with task prompt and required components
    - Use ArchitectureCanvas with task-specific configuration
    - On submission, send to Nova Lite for light paragraph feedback
    - Unlock next cluster regardless of feedback score
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 10.6 Implement Capstone Challenge page
    - Create `src/app/capstone/[challengeId]/page.tsx` with scenario and requirements
    - Use ArchitectureCanvas with capstone-specific rubric
    - Submit to Nova Pro for full rubric scoring (correctness 40%, connectivity 30%, security 20%, best practices 10%)
    - Display structured per-category feedback and overall score
    - _Requirements: 6.6, 6.7_

- [x] 11. Implement Voice Input
  - [x] 11.1 Implement VoiceInput component
    - Create `src/components/input/VoiceInput.tsx` with push-to-talk button
    - Integrate Web Speech API for audio capture and real-time transcription
    - Display editable transcription in input field before sending
    - Implement graceful degradation: hide button when Web Speech API unavailable
    - Handle microphone permission denied (show tooltip, hide button)
    - Handle transcription failure (show error message, keep text input focused)
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [x] 12. Implement Flashcards and Glossary
  - [x] 12.1 Implement FlashcardDeck component
    - Create `src/components/flashcards/FlashcardDeck.tsx` with flip card interface
    - Implement front (question/term) and back (answer/definition) display
    - Implement got-it button (removes from current session)
    - Implement review-again button (keeps in rotation)
    - Persist flashcard progress to localStorage via Progress Store
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ]* 12.2 Write property test for flashcard session management (Property 20)
    - **Property 20: Flashcard session management**
    - "got-it" removes from subsequent draws; "review-again" keeps available in session
    - **Validates: Requirements 9.3, 9.4**

  - [x] 12.3 Implement GlossaryView component
    - Create `src/components/glossary/GlossaryView.tsx` with searchable list (~30 entries)
    - Implement real-time search filtering (case-insensitive match on term or definition)
    - Implement category filter (exam-term, service, architecture-pattern)
    - _Requirements: 10.1, 10.2, 10.3_

  - [ ]* 12.4 Write property test for glossary search (Property 21)
    - **Property 21: Glossary search returns matching entries**
    - All returned entries contain search term (case-insensitive) in term or definition; no matches excluded
    - **Validates: Requirements 10.2**

  - [ ]* 12.5 Write property test for glossary category filter (Property 22)
    - **Property 22: Glossary category filter**
    - All returned entries belong to selected category; no entries of that category excluded
    - **Validates: Requirements 10.3**

- [x] 13. Implement Progress Dashboard
  - [x] 13.1 Implement ProgressDashboard component
    - Create `src/components/dashboard/ProgressDashboard.tsx` as the landing page
    - Display completion status for all 18 topics, diagram tasks, section quiz, capstone
    - Implement weak area identification from mini-quiz performance (topics with more attempts)
    - Implement daily review queue (flashcards marked review-again + weak area topics, excluding today's completed)
    - Implement study streak display (consecutive days with activity)
    - Persist dashboard data to localStorage
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [ ]* 13.2 Write property test for weak area identification (Property 23)
    - **Property 23: Weak area identification**
    - Weak areas are exactly topics where Learner required more attempts than threshold, ordered by attempt count descending
    - **Validates: Requirements 12.2**

  - [ ]* 13.3 Write property test for daily review queue composition (Property 24)
    - **Property 24: Daily review queue composition**
    - Queue contains review-again flashcards and weak area topics; excludes items completed today
    - **Validates: Requirements 12.3**

  - [ ]* 13.4 Write property test for study streak calculation (Property 25)
    - **Property 25: Study streak calculation**
    - Streak equals consecutive calendar days ending at today with at least one activity; gap resets to zero
    - **Validates: Requirements 12.4**

- [x] 14. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Accessibility and Performance
  - [x] 15.1 Implement accessibility compliance
    - Add ARIA labels to all interactive components (canvas, chat, quiz, flashcards)
    - Ensure keyboard navigation for all interactive elements
    - Verify color contrast meets WCAG 2.1 AA in dark mode
    - Add focus management for modals, tooltips, and dynamic content
    - Add screen reader support for quiz feedback, AI responses, and canvas state
    - _Requirements: 15.2, 15.3, 15.4_

  - [x] 15.2 Implement performance optimizations
    - Ensure page loads under 2 seconds (optimize bundle splitting, lazy loading)
    - Ensure canvas interactions under 100ms (optimize React Flow rendering)
    - Ensure state persistence under 1 second (debounce localStorage writes)
    - Configure Next.js for static export / CDN hosting (zero running costs)
    - _Requirements: 16.1, 16.3, 16.4_

- [x] 16. Integration and wiring
  - [x] 16.1 Wire all pages with progression gating
    - Implement navigation guards on all routes checking ProgressionEngine
    - Redirect locked topics/quizzes/diagrams/capstone to appropriate unlocked content
    - Display lock indicators on dashboard for gated content
    - Wire Concept Chat → Mini-Quiz → next topic flow on each topic page
    - Wire cluster completion → diagram task → next cluster flow
    - Wire section quiz pass → capstone unlock flow
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [x] 16.2 Wire AI Tutor into Topic Pages
    - Integrate AITutorChat dock at bottom of all Topic Pages
    - Pass current topic context to AI service on each message
    - Integrate VoiceInput into both AITutorChat and ConceptChat
    - _Requirements: 7.1, 7.2, 11.1_

  - [ ]* 16.3 Write integration tests for end-to-end flows
    - Test full topic progression flow (read → chat → quiz → next topic)
    - Test cluster gating (complete cluster → diagram → next cluster)
    - Test section quiz → capstone unlock flow
    - Test state persistence across page reloads (mocked localStorage)
    - Test AI service error handling (timeout, retry, invalid response)
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 13.1, 13.4_

- [x] 17. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document (27 properties)
- Unit tests validate specific examples and edge cases
- The design specifies TypeScript throughout — all implementation uses TypeScript
- fast-check is the property-based testing library as specified in the design
- AI integration uses Next.js API routes for Bedrock key management (no exposed client-side keys)
- All content is static JSON bundled at build time for zero-cost hosting

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3"] },
    { "id": 2, "tasks": ["2.1", "3.4", "3.5", "3.6"] },
    { "id": 3, "tasks": ["2.2", "2.3", "3.1"] },
    { "id": 4, "tasks": ["3.2", "3.3", "4.1"] },
    { "id": 5, "tasks": ["4.2", "4.3", "4.4", "4.5", "4.6", "4.7", "4.8", "4.9", "6.1"] },
    { "id": 6, "tasks": ["6.2", "6.3", "6.4", "6.5", "7.1"] },
    { "id": 7, "tasks": ["7.2", "7.3", "8.1"] },
    { "id": 8, "tasks": ["8.2", "8.4", "10.1"] },
    { "id": 9, "tasks": ["8.3", "8.5", "8.6", "8.7", "10.2", "10.3", "10.4"] },
    { "id": 10, "tasks": ["10.5", "10.6", "11.1"] },
    { "id": 11, "tasks": ["12.1", "12.3"] },
    { "id": 12, "tasks": ["12.2", "12.4", "12.5", "13.1"] },
    { "id": 13, "tasks": ["13.2", "13.3", "13.4", "15.1", "15.2"] },
    { "id": 14, "tasks": ["16.1", "16.2"] },
    { "id": 15, "tasks": ["16.3"] }
  ]
}
```
