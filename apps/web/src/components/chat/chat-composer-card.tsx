"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { PanelHeader } from "@/components/ui/panel-header";
import { SectionCard } from "@/components/ui/section-card";
import { TextArea } from "@/components/ui/text-area";
import { useSession } from "@/features/session/session-context";

/**
 * Interactive prototype chat composer.
 * Updates shared mock session state to simulate the AI DJ flow.
 */
export function ChatComposerCard() {
  const { session, isLoading, isSubmitting, error, updateFromPrompt, resetSession } =
    useSession();
  const [prompt, setPrompt] = useState("");

  useEffect(() => {
    setPrompt("");
  }, [session?.id]);

  async function handleSubmit() {
    if (!prompt.trim()) {
      return;
    }

    await updateFromPrompt(prompt);
    setPrompt("");
  }

  async function handleReset() {
    await resetSession();
    setPrompt("");
  }

  return (
    <SectionCard>
      <PanelHeader
        title="Chat with the DJ"
        description="Describe how you want the vibe to change and the queue will adapt."
      />

      <div className="chat-composer">
        {isLoading ? (
          <p className="muted-text">Loading your saved session...</p>
        ) : null}

        {error ? <p className="error-text">{error}</p> : null}

        <div>
          <label htmlFor="dj-prompt" className="label">
            Your prompt
          </label>
          <TextArea
            id="dj-prompt"
            name="dj-prompt"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Tell the DJ what to change..."
            disabled={isLoading || isSubmitting || !session}
          />
        </div>

        <div className="button-row">
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={isLoading || isSubmitting || !session || !prompt.trim()}
          >
            {isSubmitting ? "Updating..." : "Update vibe"}
          </Button>
          <Button
            variant="ghost"
            onClick={handleReset}
            disabled={isLoading || isSubmitting}
          >
            Reset demo
          </Button>
        </div>
      </div>
    </SectionCard>
  );
}
