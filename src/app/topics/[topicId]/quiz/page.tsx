import { MiniQuiz } from '@/components/quiz/MiniQuiz';
import { QuizGate } from '@/components/layout/QuizGate';
import type { QuizQuestion } from '@/types';
import fs from 'fs';
import path from 'path';

interface MiniQuizPageProps {
  params: Promise<{ topicId: string }>;
}

/**
 * Load quiz questions for a given topic from the static JSON content.
 * Returns an empty array if the file does not exist.
 */
function loadQuizQuestions(topicId: string): QuizQuestion[] {
  try {
    const filePath = path.join(
      process.cwd(),
      'src',
      'content',
      'quizzes',
      `${topicId}.json`
    );
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as QuizQuestion[];
  } catch {
    return [];
  }
}

export default async function MiniQuizPage({ params }: MiniQuizPageProps) {
  const { topicId } = await params;
  const questions = loadQuizQuestions(topicId);

  return (
    <QuizGate topicId={topicId}>
      <main className="flex min-h-screen flex-col items-center p-8">
        <div className="w-full max-w-2xl">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Mini-Quiz
          </h1>
          <p className="text-muted-foreground mb-8">
            Answer questions from the topic pool. Accumulate 3 correct answers to
            pass and unlock the next topic.
          </p>
          <MiniQuiz topicId={topicId} questions={questions} />
        </div>
      </main>
    </QuizGate>
  );
}
