'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic } from 'lucide-react';

// ─── TypeScript declarations for Web Speech API ────────────────────────────────
// The Web Speech API types are not included in the standard TypeScript lib,
// so we declare them here for type safety.

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * Props for the VoiceInput component.
 */
export interface VoiceInputProps {
  /** Called with transcribed text when recording stops */
  onTranscript: (text: string) => void;
}

/**
 * Returns the SpeechRecognition constructor if available in the browser.
 */
function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

/**
 * VoiceInput — Push-to-talk button component using the Web Speech API.
 *
 * - Hold the button to record, release to stop.
 * - Transcribed text is passed to the onTranscript callback.
 * - If Web Speech API is unavailable: renders nothing (returns null).
 * - If microphone permission is denied: shows a one-time tooltip, then hides.
 * - If transcription fails: shows an error message briefly.
 *
 * Validates: Requirements 11.1, 11.2, 11.3, 11.4
 */
export function VoiceInput({ onTranscript }: VoiceInputProps) {
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [showPermissionTooltip, setShowPermissionTooltip] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const transcriptRef = useRef<string>('');
  const tooltipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check for Web Speech API support on mount
  useEffect(() => {
    const Constructor = getSpeechRecognitionConstructor();
    setIsSupported(Constructor !== null);
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, []);

  /**
   * Start recording: create a SpeechRecognition instance and begin capture.
   */
  const startRecording = useCallback(() => {
    const Constructor = getSpeechRecognitionConstructor();
    if (!Constructor) return;

    setTranscriptionError(null);
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }

    const recognition = new Constructor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    transcriptRef.current = '';

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      // Accumulate final results
      if (finalTranscript) {
        transcriptRef.current += finalTranscript;
      }

      // Store interim for when we stop (in case nothing is finalized yet)
      if (!transcriptRef.current && interimTranscript) {
        transcriptRef.current = interimTranscript;
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'not-allowed') {
        // Microphone permission denied
        setPermissionDenied(true);
        setShowPermissionTooltip(true);
        setIsRecording(false);

        // Hide tooltip after 4 seconds
        tooltipTimeoutRef.current = setTimeout(() => {
          setShowPermissionTooltip(false);
        }, 4000);
      } else if (event.error === 'no-speech') {
        // No speech detected — not a critical error, just stop gracefully
        setIsRecording(false);
      } else {
        // Transcription failure (network, audio-capture, etc.)
        setTranscriptionError("Couldn't understand audio. Try again or type instead.");
        setIsRecording(false);

        // Clear error after 4 seconds
        errorTimeoutRef.current = setTimeout(() => {
          setTranscriptionError(null);
        }, 4000);
      }
    };

    recognition.onend = () => {
      setIsRecording(false);

      // Deliver transcript if we have one
      const text = transcriptRef.current.trim();
      if (text) {
        onTranscript(text);
        transcriptRef.current = '';
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      // If start() throws (e.g., already started), handle gracefully
      setIsRecording(false);
    }
  }, [onTranscript]);

  /**
   * Stop recording: stop the SpeechRecognition instance.
   */
  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      // onend handler will deliver the transcript
    }
  }, []);

  /**
   * Handle pointer down — start recording (push-to-talk).
   */
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      startRecording();
    },
    [startRecording]
  );

  /**
   * Handle pointer up — stop recording.
   */
  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      stopRecording();
    },
    [stopRecording]
  );

  /**
   * Handle pointer leave — stop recording if pointer leaves button while held.
   */
  const handlePointerLeave = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      if (isRecording) {
        stopRecording();
      }
    },
    [isRecording, stopRecording]
  );

  /**
   * Handle keyboard: Space/Enter to toggle recording for accessibility.
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (!isRecording) {
          startRecording();
        }
      }
    },
    [isRecording, startRecording]
  );

  const handleKeyUp = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (isRecording) {
          stopRecording();
        }
      }
    },
    [isRecording, stopRecording]
  );

  // ─── Render logic ──────────────────────────────────────────────────────────

  // Still checking support (SSR or initial render)
  if (isSupported === null) {
    return null;
  }

  // Web Speech API not available — graceful degradation: render nothing
  if (!isSupported) {
    return null;
  }

  // Microphone permission was denied — hide the button
  if (permissionDenied && !showPermissionTooltip) {
    return null;
  }

  // Show permission denied tooltip briefly before hiding
  if (permissionDenied && showPermissionTooltip) {
    return (
      <div className="relative inline-flex items-center">
        <button
          disabled
          className="rounded p-2 text-zinc-500 cursor-not-allowed"
          aria-label="Microphone permission denied"
          type="button"
        >
          <Mic className="h-4 w-4" />
        </button>
        <div
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap rounded-md bg-zinc-700 border border-zinc-600 px-3 py-1.5 text-xs text-zinc-200 shadow-lg"
        >
          Microphone access denied. Enable it in browser settings.
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-zinc-700" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative inline-flex items-center">
      <button
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        className={`rounded p-2 transition-colors select-none touch-none ${
          isRecording
            ? 'bg-red-500/20 text-red-400 animate-pulse'
            : 'text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
        }`}
        aria-label={isRecording ? 'Recording... Release to stop' : 'Hold to speak'}
        aria-pressed={isRecording}
        title={isRecording ? 'Recording... Release to stop' : 'Hold to speak'}
        type="button"
      >
        <Mic className="h-4 w-4" />
      </button>

      {/* Transcription error message */}
      {transcriptionError && (
        <div
          role="alert"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap rounded-md bg-red-500/10 border border-red-500/30 px-3 py-1.5 text-xs text-red-400 shadow-lg"
        >
          {transcriptionError}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-red-500/30" />
        </div>
      )}
    </div>
  );
}
