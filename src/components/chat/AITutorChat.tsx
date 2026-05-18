'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageSquare, Send, ChevronDown, RotateCcw, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

import { VoiceInput } from '@/components/input/VoiceInput';
import { announceToScreenReader } from '@/lib/accessibility';
import { streamTutorResponse, AIServiceError } from '@/services/ai-service';
import type { ChatMessage } from '@/types';

/**
 * Props for the AITutorChat component.
 */
export interface AITutorChatProps {
  /** The current topic ID for context-aware AI responses */
  topicId: string;
}

/** Warning threshold — show badge at this message count */
const WARNING_THRESHOLD = 18;

/** Hard soft-limit — disable input at this message count */
const SESSION_LIMIT = 20;

/**
 * AITutorChat — A docked, collapsible chat interface at the bottom of topic pages.
 * Streams responses from Nova Lite with topic context injection.
 * Enforces a 20-message soft limit per session.
 *
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5
 */
export function AITutorChat({ topicId }: AITutorChatProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  /** Total message count (user + assistant) */
  const messageCount = messages.length;

  /** Whether the session limit has been reached */
  const isLimitReached = messageCount >= SESSION_LIMIT;

  /** Whether to show the warning badge */
  const showWarning = messageCount >= WARNING_THRESHOLD && !isLimitReached;

  /** Auto-scroll to bottom on new messages */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /** Focus textarea when expanded */
  useEffect(() => {
    if (isExpanded && !isLimitReached) {
      textareaRef.current?.focus();
    }
  }, [isExpanded, isLimitReached]);

  /** Announce session limit to screen readers */
  useEffect(() => {
    if (isLimitReached) {
      announceToScreenReader('Session message limit reached. Start a new session to continue.', 'polite');
    } else if (showWarning) {
      announceToScreenReader(`${SESSION_LIMIT - messageCount} messages remaining in this session.`, 'polite');
    }
  }, [isLimitReached, showWarning, messageCount]);

  /**
   * Send a message to the AI tutor and stream the response.
   */
  const handleSend = useCallback(async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isStreaming || isLimitReached) return;

    setError(null);

    // Add user message
    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsStreaming(true);

    // Create placeholder assistant message for streaming
    const assistantMessageId = uuidv4();
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const chatHistory = [...messages, userMessage];

      const stream = streamTutorResponse({
        topicId,
        message: trimmed,
        chatHistory,
      });

      for await (const chunk of stream) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: msg.content + chunk }
              : msg
          )
        );
      }
    } catch (err) {
      // Remove the empty assistant message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessageId));

      if (err instanceof AIServiceError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsStreaming(false);
    }
  }, [inputValue, isStreaming, isLimitReached, messages, topicId]);

  /**
   * Handle keyboard events: Enter to send, Shift+Enter for newline.
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /**
   * Retry the last failed message.
   */
  const handleRetry = useCallback(() => {
    // Find the last user message
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUserMessage) return;

    setError(null);
    setInputValue(lastUserMessage.content);
    // Remove the last user message so it can be re-sent
    setMessages((prev) => prev.filter((msg) => msg.id !== lastUserMessage.id));
  }, [messages]);

  /**
   * Start a new session (reset all messages).
   */
  const handleNewSession = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setMessages([]);
    setError(null);
    setIsStreaming(false);
    setInputValue('');
  }, []);

  /**
   * Toggle the chat panel expanded/collapsed.
   */
  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  // --- Collapsed state ---
  if (!isExpanded) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <button
          onClick={toggleExpanded}
          className="mx-auto flex items-center gap-2 rounded-t-lg bg-zinc-800 border border-b-0 border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors shadow-lg"
          aria-label="Open AI tutor chat"
          type="button"
        >
          <span aria-hidden="true">🤖</span>
          Ask about this topic...
          {showWarning && (
            <span className="ml-2 inline-flex items-center rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-400">
              {SESSION_LIMIT - messageCount} left
            </span>
          )}
        </button>
      </div>
    );
  }

  // --- Expanded state ---
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 flex flex-col border-t border-zinc-700 bg-zinc-900 shadow-2xl"
      style={{ height: '280px' }}
      role="region"
      aria-label="AI Tutor Chat"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-700 px-4 py-2 shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-blue-400" aria-hidden="true" />
          <span className="text-sm font-medium text-zinc-200">AI Tutor</span>
          {showWarning && (
            <span className="inline-flex items-center rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-400">
              {SESSION_LIMIT - messageCount} messages left
            </span>
          )}
          {isLimitReached && (
            <span className="inline-flex items-center rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400">
              Limit reached
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              onClick={handleNewSession}
              className="rounded p-1 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 transition-colors"
              aria-label="Start new session"
              title="Start new session"
              type="button"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={toggleExpanded}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 transition-colors"
            aria-label="Collapse chat"
            title="Collapse chat"
            type="button"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div
        className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-zinc-500">
              Ask anything about this topic. I&apos;m here to help!
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-700 text-zinc-200'
              }`}
              aria-label={`${message.role === 'user' ? 'You' : 'AI Tutor'}: ${message.content || 'Thinking...'}`}
            >
              {message.content || (
                <span className="inline-flex items-center gap-1 text-zinc-400">
                  <span className="animate-pulse">●</span>
                  <span className="animate-pulse animation-delay-200">●</span>
                  <span className="animate-pulse animation-delay-400">●</span>
                </span>
              )}
            </div>
          </div>
        ))}

        {/* Error message */}
        {error && (
          <div className="flex justify-center">
            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-sm text-red-400">
              <X className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{error}</span>
              <button
                onClick={handleRetry}
                className="ml-2 rounded bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-300 hover:bg-red-500/30 transition-colors"
                type="button"
                aria-label="Retry sending message"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Session limit reached message */}
        {isLimitReached && (
          <div className="flex justify-center">
            <div className="rounded-lg bg-zinc-800 border border-zinc-600 px-3 py-2 text-sm text-zinc-400">
              Session limit reached. Start a new session.
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="shrink-0 border-t border-zinc-700 px-4 py-2">
        <div className="flex items-end gap-2">
          {/* Voice input */}
          <VoiceInput
            onTranscript={(text) =>
              setInputValue((prev) => (prev ? prev + ' ' + text : text))
            }
          />

          {/* Text input */}
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming || isLimitReached}
            placeholder={
              isLimitReached
                ? 'Session limit reached'
                : 'Ask about this topic...'
            }
            className="flex-1 resize-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            rows={1}
            aria-label="Type your message"
          />

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isStreaming || isLimitReached}
            className="rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            aria-label="Send message"
            title="Send message"
            type="button"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
