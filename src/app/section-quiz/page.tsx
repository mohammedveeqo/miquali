import { SectionQuiz } from '@/components/quiz/SectionQuiz';
import { SectionQuizGate } from '@/components/layout/SectionQuizGate';
import sectionQuizData from '@/content/section-quiz.json';
import type { QuizQuestion } from '@/types';

/**
 * Section Quiz page — loads 20 questions server-side and renders
 * the interactive SectionQuiz component, gated by progression.
 *
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 8.3
 */
export default function SectionQuizPage() {
  const questions: QuizQuestion[] = sectionQuizData as QuizQuestion[];

  return (
    <SectionQuizGate>
      <main className="flex min-h-screen flex-col items-center p-8">
        <div className="w-full max-w-3xl space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Section Quiz — Networking
            </h1>
            <p className="mt-2 text-muted-foreground">
              Answer 20 questions covering the entire Networking section. Score
              70% or higher (14/20) to pass and unlock capstone challenges.
            </p>
          </div>
          <SectionQuiz questions={questions} />
        </div>
      </main>
    </SectionQuizGate>
  );
}
