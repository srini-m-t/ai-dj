"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type {
  ApiResponse,
  CreateSessionMessageResponse,
  CreateSessionResponse,
  GetSessionResponse,
  Session,
} from "@ai-dj/shared";

const ACTIVE_SESSION_STORAGE_KEY = "ai-dj-active-session-id";

type SessionContextValue = {
  session: Session | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  updateFromPrompt: (prompt: string) => Promise<void>;
  resetSession: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

type SessionProviderProps = {
  children: ReactNode;
};

/**
 * Client-side session store backed by the session API.
 */
export function SessionProvider({ children }: SessionProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function bootstrapSession() {
      setIsLoading(true);
      setError(null);

      try {
        const storedSessionId = window.localStorage.getItem(
          ACTIVE_SESSION_STORAGE_KEY,
        );

        if (storedSessionId) {
          const existingSession = await fetchSession(storedSessionId);

          if (!cancelled && existingSession) {
            setSession(existingSession);
            setIsLoading(false);
            return;
          }
        }

        const createdSession = await createNewSession();

        if (!cancelled) {
          setSession(createdSession);
          window.localStorage.setItem(
            ACTIVE_SESSION_STORAGE_KEY,
            createdSession.id,
          );
        }
      } catch (bootstrapError) {
        if (!cancelled) {
          setError(
            bootstrapError instanceof Error
              ? bootstrapError.message
              : "Failed to load session.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void bootstrapSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      isLoading,
      isSubmitting,
      error,
      updateFromPrompt: async (prompt: string) => {
        if (!session) {
          return;
        }

        const trimmedPrompt = prompt.trim();

        if (!trimmedPrompt) {
          return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
          const response = await fetch(`/api/session/${session.id}/messages`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              text: trimmedPrompt,
            }),
          });

          const payload =
            (await response.json()) as ApiResponse<CreateSessionMessageResponse>;

          if (!payload.ok) {
            throw new Error(payload.error.message);
          }

          setSession(payload.data.session);
        } catch (submitError) {
          setError(
            submitError instanceof Error
              ? submitError.message
              : "Failed to update the session.",
          );
        } finally {
          setIsSubmitting(false);
        }
      },
      resetSession: async () => {
        setIsSubmitting(true);
        setError(null);

        try {
          const createdSession = await createNewSession();
          setSession(createdSession);
          window.localStorage.setItem(
            ACTIVE_SESSION_STORAGE_KEY,
            createdSession.id,
          );
        } catch (resetError) {
          setError(
            resetError instanceof Error
              ? resetError.message
              : "Failed to reset the session.",
          );
        } finally {
          setIsSubmitting(false);
        }
      },
    }),
    [error, isLoading, isSubmitting, session],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);

  if (context === null) {
    throw new Error("useSession must be used within a SessionProvider");
  }

  return context;
}

async function fetchSession(sessionId: string): Promise<Session | null> {
  const response = await fetch(`/api/session/${sessionId}`, {
    cache: "no-store",
  });

  const payload = (await response.json()) as ApiResponse<GetSessionResponse>;

  if (!payload.ok) {
    if (payload.error.code === "NOT_FOUND") {
      window.localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
      return null;
    }

    throw new Error(payload.error.message);
  }

  return payload.data.session;
}

async function createNewSession(): Promise<Session> {
  const response = await fetch("/api/session", {
    method: "POST",
  });

  const payload = (await response.json()) as ApiResponse<CreateSessionResponse>;

  if (!payload.ok) {
    throw new Error(payload.error.message);
  }

  return payload.data.session;
}
