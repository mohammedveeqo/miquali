# Requirements Document

## Introduction

QualCheck is an interactive cloud architecture learning platform targeting AWS Solutions Architect Professional (SAP-C02) certification candidates. The platform combines a conversational AI tutor with an architecture canvas builder to provide an active-learning experience. The MVP is purely client-side: Next.js with static JSON content, browser localStorage for progress persistence, and two AI integration points (tutor chat via Nova Lite, architecture review via Nova Pro). The MVP covers the Networking section only (18 topics).

## Glossary

- **Platform**: The QualCheck web application built with Next.js 14 App Router
- **Learner**: A user studying for the AWS SAP-C02 certification
- **Topic_Page**: A content page covering a single networking concept with explanation, analogy, diagram, key points, exam keywords, common mistakes, and related topics
- **Concept_Chat**: An AI-assessed conversational check where the Learner explains a concept in their own words before unlocking the mini-quiz
- **Mini_Quiz**: A pool-based quiz requiring 3 correct answers to pass, drawn from a pool of 8-10 questions per topic
- **Grouped_Diagram_Task**: A small architecture canvas task assigned after every 2-3 topics that gates the next topic cluster
- **Section_Quiz**: A 20-question assessment requiring 70% or higher to unlock the capstone challenge
- **Architecture_Canvas**: A React Flow-based interactive diagram builder with 38 component types (20 MVP-enabled), placement validation rules, and AI-reviewed submissions
- **AI_Tutor**: A streaming chat interface powered by Nova Lite, docked at the bottom of topic pages, providing topic-aware guidance
- **Keyword_Tooltip**: An inline tooltip on topic pages with three types: exam-signal (gold), service-reference (blue with SVG), and architecture-term (purple)
- **Flashcard**: A flip card with got-it/review-again tracking for spaced repetition
- **Glossary_View**: A searchable, filterable reference of architecture and exam terms
- **Progress_Dashboard**: A view showing weak areas, daily review queue, and study streak
- **Voice_Input**: Web Speech API push-to-talk input with editable transcription before sending
- **Progression_Model**: The gating system that enforces sequential topic unlocking and assessment completion
- **Canvas_Component**: A draggable element on the Architecture Canvas, categorized as container, standalone, or attached
- **Placement_Rule**: A validation rule on the Architecture Canvas that produces errors (blocking submit) or warnings (non-blocking)
- **Rubric**: The AI scoring criteria for architecture submissions: correctness (40%), connectivity (30%), security (20%), best practices (10%)
- **State_Store**: Zustand-based client-side state persisted to browser localStorage

## Requirements

### Requirement 1: Topic Content Display

**User Story:** As a Learner, I want to read structured topic content with explanations, analogies, diagrams, key points, exam keywords, common mistakes, and related topics, so that I can build foundational understanding of each networking concept.

#### Acceptance Criteria

1. WHEN a Learner navigates to an unlocked topic, THE Platform SHALL render the Topic_Page with all content sections: explanation, analogy, diagram, key points, exam keywords, common mistakes, and related topics
2. WHEN a Topic_Page contains exam keywords, THE Platform SHALL render each keyword with the appropriate Keyword_Tooltip type: exam-signal (gold), service-reference (blue with SVG icon), or architecture-term (purple)
3. WHEN a Learner hovers over or taps a keyword, THE Platform SHALL display the Keyword_Tooltip with the term definition and any associated mini-diagram SVG
4. THE Platform SHALL load each Topic_Page within 2 seconds from navigation initiation

### Requirement 2: Concept Chat Assessment

**User Story:** As a Learner, I want to explain a concept in my own words and receive AI feedback, so that I can verify my understanding before proceeding to the quiz.

#### Acceptance Criteria

1. WHEN a Learner completes reading a Topic_Page, THE Platform SHALL present the Concept_Chat interface for that topic
2. WHEN a Learner submits a message in the Concept_Chat, THE AI_Tutor SHALL respond using Nova Lite with streaming output, assessing the Learner's explanation
3. THE Concept_Chat SHALL complete within a maximum of 4 conversational exchanges (Learner messages)
4. WHEN the AI_Tutor determines the Learner has demonstrated sufficient understanding, THE Platform SHALL mark the Concept_Chat as passed and unlock the Mini_Quiz for that topic
5. WHEN the AI_Tutor determines the Learner has not demonstrated sufficient understanding after 4 exchanges, THE Platform SHALL mark the Concept_Chat as failed and allow the Learner to retry
6. THE Platform SHALL begin streaming the AI response within 3 seconds of the Learner submitting a message

### Requirement 3: Mini-Quiz Progression

**User Story:** As a Learner, I want to answer quiz questions drawn from a pool until I accumulate 3 correct answers, so that I can demonstrate topic mastery and unlock the next topic.

#### Acceptance Criteria

1. WHEN a Learner passes the Concept_Chat for a topic, THE Platform SHALL unlock the Mini_Quiz for that topic
2. THE Mini_Quiz SHALL draw questions from a pool of 8-10 questions specific to the current topic
3. WHEN a Learner accumulates 3 correct answers in a Mini_Quiz session, THE Platform SHALL mark the topic as complete
4. WHEN a Learner answers a question incorrectly, THE Platform SHALL display the correct answer with an explanation and continue the quiz
5. THE Platform SHALL provide a skip option allowing the Learner to skip a question and receive a different one from the pool
6. THE Platform SHALL provide a refresh option allowing the Learner to restart the Mini_Quiz with a new random selection from the pool
7. WHEN a topic is marked complete, THE Platform SHALL unlock the next sequential topic in the Networking section

### Requirement 4: Grouped Diagram Tasks

**User Story:** As a Learner, I want to complete small architecture diagram tasks after every 2-3 topics, so that I can apply concepts in a practical context before moving to the next cluster.

#### Acceptance Criteria

1. WHEN a Learner completes all topics in a cluster (2-3 topics), THE Platform SHALL present the Grouped_Diagram_Task before unlocking the next topic cluster
2. THE Grouped_Diagram_Task SHALL use the Architecture_Canvas with a specific task prompt and required components
3. WHEN a Learner submits a Grouped_Diagram_Task, THE AI_Tutor SHALL provide light paragraph feedback using Nova Lite
4. WHEN a Learner submits a Grouped_Diagram_Task, THE Platform SHALL unlock the next topic cluster regardless of the AI feedback score
5. THE Platform SHALL require submission of the Grouped_Diagram_Task; the Learner cannot skip to the next cluster without submitting

### Requirement 5: Section Quiz

**User Story:** As a Learner, I want to take a comprehensive section quiz after completing all topics, so that I can demonstrate overall section mastery and unlock the capstone challenge.

#### Acceptance Criteria

1. WHEN a Learner completes all 18 topics and all Grouped_Diagram_Tasks in the Networking section, THE Platform SHALL unlock the Section_Quiz
2. THE Section_Quiz SHALL present 20 questions covering the entire Networking section
3. WHEN a Learner scores 70% or higher (14 or more correct out of 20) on the Section_Quiz, THE Platform SHALL mark the section as passed and unlock the capstone Architecture_Canvas challenges
4. WHEN a Learner scores below 70% on the Section_Quiz, THE Platform SHALL display the score with identification of weak topic areas and allow the Learner to retake the quiz

### Requirement 6: Architecture Canvas

**User Story:** As a Learner, I want to build architecture diagrams on an interactive canvas with drag-and-drop components and connections, so that I can practice designing cloud solutions.

#### Acceptance Criteria

1. THE Architecture_Canvas SHALL provide 20 MVP-enabled Canvas_Components categorized as container, standalone, or attached types
2. THE Architecture_Canvas SHALL support 8 connection types with distinct visual representations conveying architectural meaning
3. WHEN a Learner places a Canvas_Component, THE Platform SHALL validate placement against 9 Placement_Rules in real time
4. WHEN a Placement_Rule violation produces an error, THE Platform SHALL block submission and display the error to the Learner
5. WHEN a Placement_Rule violation produces a warning, THE Platform SHALL display the warning but allow submission
6. WHEN a Learner submits a capstone architecture diagram, THE Platform SHALL send the diagram to Nova Pro for AI review using the Rubric (correctness 40%, connectivity 30%, security 20%, best practices 10%)
7. THE Platform SHALL return the structured AI scoring result to the Learner with per-category feedback
8. THE Architecture_Canvas SHALL render all drag, drop, and connection interactions without perceptible delay

### Requirement 7: AI Tutor Chat

**User Story:** As a Learner, I want to ask questions to an AI tutor while studying a topic, so that I can get immediate clarification without leaving the topic page.

#### Acceptance Criteria

1. WHILE a Learner is viewing a Topic_Page, THE Platform SHALL display the AI_Tutor chat interface docked at the bottom of the page
2. THE AI_Tutor SHALL maintain topic-awareness by including the current topic context in each request to Nova Lite
3. WHEN a Learner sends a message to the AI_Tutor, THE Platform SHALL stream the response from Nova Lite in real time
4. THE AI_Tutor SHALL enforce a soft limit of 20 messages per session, displaying a notification when the limit is approached
5. THE Platform SHALL begin streaming the AI_Tutor response within 3 seconds of the Learner sending a message

### Requirement 8: Progression Model and Gating

**User Story:** As a Learner, I want a structured learning path that prevents skipping ahead, so that I build knowledge sequentially and do not miss foundational concepts.

#### Acceptance Criteria

1. THE Progression_Model SHALL lock all topics except the first topic in the Networking section upon initial load
2. WHEN a Learner has not passed the Mini_Quiz for the current topic, THE Platform SHALL prevent navigation to the next topic
3. WHEN a Grouped_Diagram_Task is pending for a completed cluster, THE Platform SHALL prevent navigation to topics in the next cluster
4. WHEN the Section_Quiz has not been passed, THE Platform SHALL prevent access to capstone Architecture_Canvas challenges
5. THE Platform SHALL persist all progression state to browser localStorage via the State_Store
6. WHEN a Learner returns to the Platform after closing the browser, THE Platform SHALL restore the Learner's progression state from localStorage

### Requirement 9: Flashcards

**User Story:** As a Learner, I want to review key concepts using flip cards with got-it/review-again tracking, so that I can reinforce my memory through spaced repetition.

#### Acceptance Criteria

1. THE Platform SHALL provide approximately 60 Flashcards covering Networking section concepts
2. WHEN a Learner views a Flashcard, THE Platform SHALL display the front (question/term) and allow flipping to reveal the back (answer/definition)
3. WHEN a Learner marks a Flashcard as "got-it", THE Platform SHALL remove the card from the current review session
4. WHEN a Learner marks a Flashcard as "review-again", THE Platform SHALL keep the card in the review rotation
5. THE Platform SHALL persist Flashcard progress (got-it vs review-again status) to localStorage via the State_Store

### Requirement 10: Glossary

**User Story:** As a Learner, I want to search and filter a glossary of architecture and exam terms, so that I can quickly look up definitions while studying.

#### Acceptance Criteria

1. THE Platform SHALL provide a Glossary_View containing approximately 30 entries for the Networking section
2. WHEN a Learner types in the search field, THE Glossary_View SHALL filter entries in real time to match the search query
3. THE Glossary_View SHALL support filtering entries by category (exam terms, services, architecture patterns)

### Requirement 11: Voice Input

**User Story:** As a Learner, I want to speak my responses using push-to-talk, so that I can interact with the AI tutor and concept chat hands-free.

#### Acceptance Criteria

1. THE Platform SHALL provide a push-to-talk Voice_Input button in the Concept_Chat and AI_Tutor interfaces
2. WHEN a Learner activates push-to-talk, THE Platform SHALL capture audio using the Web Speech API and transcribe it to text in real time
3. WHEN a Learner releases the push-to-talk button, THE Platform SHALL display the transcribed text in the input field for editing before sending
4. IF the Web Speech API is unavailable in the Learner's browser, THEN THE Platform SHALL hide the Voice_Input button and rely on text input only

### Requirement 12: Progress Dashboard

**User Story:** As a Learner, I want to see my overall progress including weak areas, daily review queue, and study streak, so that I can plan my study sessions effectively.

#### Acceptance Criteria

1. THE Progress_Dashboard SHALL display the Learner's completion status for all 18 topics, Grouped_Diagram_Tasks, Section_Quiz, and capstone challenges
2. THE Progress_Dashboard SHALL identify weak areas based on Mini_Quiz performance (topics where the Learner required more attempts)
3. THE Progress_Dashboard SHALL display a daily review queue recommending Flashcards and topics for review
4. THE Progress_Dashboard SHALL track and display the Learner's study streak (consecutive days with at least one completed activity)
5. THE Platform SHALL persist all Progress_Dashboard data to localStorage via the State_Store

### Requirement 13: State Persistence

**User Story:** As a Learner, I want my progress and preferences saved automatically, so that I can resume studying from where I left off without losing any data.

#### Acceptance Criteria

1. THE State_Store SHALL persist all Learner progress data to browser localStorage using Zustand persistence middleware
2. WHEN the Learner completes any activity (topic, quiz, diagram, flashcard review), THE State_Store SHALL save the updated state to localStorage within 1 second
3. WHEN the Platform loads, THE State_Store SHALL hydrate application state from localStorage before rendering interactive content
4. IF localStorage is unavailable or corrupted, THEN THE Platform SHALL initialize with default state and notify the Learner that progress could not be restored

### Requirement 14: Content Data Structure

**User Story:** As a developer, I want all learning content stored as static JSON files, so that the platform requires no backend and content can be updated by editing files.

#### Acceptance Criteria

1. THE Platform SHALL load all topic content, quiz questions, diagram tasks, flashcards, glossary entries, and keyword tooltips from static JSON files bundled with the application
2. THE Platform SHALL structure content to support the Networking section MVP: 18 topics, 144-180 mini-quiz questions, 8 grouped diagram tasks, 20 section quiz questions, 5 capstone challenges, 60 flashcards, 30 glossary entries, 40-50 keyword tooltip definitions, and 20-25 tooltip mini-diagram SVGs
3. THE Platform SHALL validate content JSON structure at build time to prevent runtime errors from malformed data

### Requirement 15: Dark Mode and Accessibility

**User Story:** As a Learner, I want the platform to default to dark mode and meet accessibility standards, so that I can study comfortably for extended periods.

#### Acceptance Criteria

1. THE Platform SHALL render in dark mode by default
2. THE Platform SHALL comply with WCAG 2.1 AA standards for all static content including color contrast, keyboard navigation, and screen reader compatibility
3. THE Platform SHALL ensure all interactive elements (buttons, links, form controls, canvas components) are accessible via keyboard navigation
4. THE Platform SHALL provide appropriate ARIA labels for all interactive components including the Architecture_Canvas, AI_Tutor chat, and quiz interfaces

### Requirement 16: Performance

**User Story:** As a Learner, I want the platform to load quickly and respond instantly to interactions, so that my study flow is not interrupted by technical delays.

#### Acceptance Criteria

1. THE Platform SHALL load any page within 2 seconds on a standard broadband connection
2. THE Platform SHALL begin streaming AI responses (Concept_Chat, AI_Tutor, architecture review) within 3 seconds of request submission
3. THE Architecture_Canvas SHALL process all drag, drop, connection, and validation interactions without perceptible delay (under 100 milliseconds)
4. THE Platform SHALL operate with near-zero running costs by using client-side rendering and static content delivery
