import { ChatComposerCard } from "@/components/chat/chat-composer-card";
import { ChatInsightsCard } from "@/components/chat/chat-insights-card";
import { Container } from "@/components/ui/container";
import { HeroPanel } from "@/components/ui/hero-panel";

export default function ChatPage() {
  return (
    <main className="page-section">
      <Container>
        <div className="stack-lg">
          <HeroPanel
            eyebrow="Chat"
            title="Talk to the DJ"
            description="Use natural language to change the energy, mood, language mix, and familiarity of the next songs."
          />

          <div className="two-column-layout">
            <ChatComposerCard />
            <ChatInsightsCard />
          </div>
        </div>
      </Container>
    </main>
  );
}