/**
 * Quiz Store — Zustand store for mini-quiz and section quiz sessions.
 * Manages the current question pool, answer tracking, and quiz progression.
 * This store is transient (no localStorage persistence) — state resets on page reload.
 */

import { create } from 'zustand';
import type { QuizQuestion, QuizState, AnsweredQuestion } from '@/types';

/** Actions available on the quiz store */
interface QuizActions {
  /** Load a set of questions into the quiz session, resetting all progress */
  setQuestions: (questions: QuizQuestion[]) => void;
  /** Record an answer for a question, determine correctness, and advance */
  answerQuestion: (questionId: string, selectedOptionId: string) => void;
  /** Skip the current question — moves it to the end of the pool and advances */
  skipQuestion: () => void;
  /** Manually increment the correct count by 1 */
  incrementCorrectCount: () => void;
  /** Reset all quiz state to initial values */
  resetQuiz: () => void;
  /** Get the current question being displayed, or null if none */
  getCurrentQuestion: () => QuizQuestion | null;
  /** Check if the quiz is passed (correctCount >= 3 for mini-quiz) */
  isQuizPassed: () => boolean;
  /** Get questions that have not yet been answered */
  getRemainingQuestions: () => QuizQuestion[];
}

/** Initial state for the quiz store */
const initialState: QuizState = {
  currentQuestions: [],
  answeredQuestions: [],
  correctCount: 0,
  currentQuestionIndex: 0,
};

/** Zustand quiz store combining state and actions */
export const useQuizStore = create<QuizState & QuizActions>((set, get) => ({
  ...initialState,

  setQuestions: (questions: QuizQuestion[]) => {
    set({
      currentQuestions: [...questions],
      answeredQuestions: [],
      correctCount: 0,
      currentQuestionIndex: 0,
    });
  },

  answerQuestion: (questionId: string, selectedOptionId: string) => {
    const state = get();
    const question = state.currentQuestions.find((q) => q.id === questionId);

    if (!question) {
      return;
    }

    const isCorrect = selectedOptionId === question.correctOptionId;

    const answeredQuestion: AnsweredQuestion = {
      questionId,
      selectedOptionId,
      isCorrect,
    };

    const newCorrectCount = isCorrect
      ? state.correctCount + 1
      : state.correctCount;

    set({
      answeredQuestions: [...state.answeredQuestions, answeredQuestion],
      correctCount: newCorrectCount,
      currentQuestionIndex: state.currentQuestionIndex + 1,
    });
  },

  skipQuestion: () => {
    const state = get();
    const { currentQuestions, currentQuestionIndex } = state;

    if (currentQuestions.length === 0) {
      return;
    }

    // Get the current question to move to the end
    const skippedQuestion = currentQuestions[currentQuestionIndex];
    if (!skippedQuestion) {
      return;
    }

    // Create a new array: remove the skipped question and append it at the end
    const newQuestions = [
      ...currentQuestions.slice(0, currentQuestionIndex),
      ...currentQuestions.slice(currentQuestionIndex + 1),
      skippedQuestion,
    ];

    // The currentQuestionIndex stays the same (since we removed the item at that index,
    // the next item naturally slides into position). But if the index would now be
    // at or beyond the array length, wrap around.
    let newIndex = currentQuestionIndex;
    if (newIndex >= newQuestions.length) {
      newIndex = 0;
    }

    // Ensure the next question shown is different from the skipped one.
    // If after repositioning, the question at newIndex is the same as skipped
    // (can happen when there's only 1 question left), we still set it — there's
    // no alternative available.
    if (
      newQuestions.length > 1 &&
      newQuestions[newIndex]?.id === skippedQuestion.id
    ) {
      // Move to the next available index
      newIndex = (newIndex + 1) % newQuestions.length;
    }

    set({
      currentQuestions: newQuestions,
      currentQuestionIndex: newIndex,
    });
  },

  incrementCorrectCount: () => {
    set((state) => ({
      correctCount: state.correctCount + 1,
    }));
  },

  resetQuiz: () => {
    set({ ...initialState });
  },

  getCurrentQuestion: () => {
    const state = get();
    const { currentQuestions, currentQuestionIndex } = state;
    if (
      currentQuestions.length === 0 ||
      currentQuestionIndex >= currentQuestions.length
    ) {
      return null;
    }
    return currentQuestions[currentQuestionIndex];
  },

  isQuizPassed: () => {
    const state = get();
    return state.correctCount >= 3;
  },

  getRemainingQuestions: () => {
    const state = get();
    const answeredIds = new Set(
      state.answeredQuestions.map((aq) => aq.questionId)
    );
    return state.currentQuestions.filter((q) => !answeredIds.has(q.id));
  },
}));
