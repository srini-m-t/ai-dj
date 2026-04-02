export const dynamic = "force-dynamic";

import { APP_NAME, APP_TAGLINES } from "@ai-dj/shared";

import { Container } from "@/components/ui/container";
import { HeroPanel } from "@/components/ui/hero-panel";
import { SectionCard } from "@/components/ui/section-card";
import { SpotifyAuthCard } from "@/components/ui/spotify-auth-card";
import { TagList } from "@/components/ui/tag-list";
import { getSpotifyAuthStatus } from "@/lib/spotify/profile";

export default async function HomePage() {
  const spotifyStatus = await getSpotifyAuthStatus();

  return (
    <main className="page-section">
      <Container>
        <div className="stack-lg">
          <HeroPanel
            eyebrow={APP_NAME}
            title="Build a live, conversational AI DJ"
            description="Connect Spotify, start a session, and let users steer the vibe through natural language while the app manages the upcoming queue in real time."
          />

          <SpotifyAuthCard
            authenticated={spotifyStatus.authenticated}
            profile={spotifyStatus.profile}
          />

          <SectionCard
            title="Current MVP direction"
            description="The first version focuses on conversational queue control, session memory, and intelligent song selection rather than audio mixing."
          >
            <TagList tags={APP_TAGLINES} />
          </SectionCard>

          <div className="grid-auto">
            <SectionCard
              title="Player"
              description="A dedicated view for current playback, queue visibility, and device state."
            />

            <SectionCard
              title="Chat"
              description="A conversational interface where users can adjust energy, language, mood, and mainstreamness."
            />

            <SectionCard
              title="Session"
              description="A session-level memory view for vibe state, chosen tracks, and AI reasoning."
            />
          </div>
        </div>
      </Container>
    </main>
  );
}