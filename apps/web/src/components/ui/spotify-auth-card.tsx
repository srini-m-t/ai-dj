import { SectionCard } from "@/components/ui/section-card";

type SpotifyProfile = {
  id: string;
  display_name: string | null;
  email?: string | null;
  product?: string | null;
  images?: Array<{ url: string }>;
};

type SpotifyAuthCardProps = {
  authenticated: boolean;
  profile: SpotifyProfile | null;
};

/**
 * Server-rendered auth status card for the home page.
 * Uses normal anchors for auth route handlers instead of Next Link,
 * which is safer for redirect-based auth flows.
 */
export function SpotifyAuthCard({
  authenticated,
  profile,
}: SpotifyAuthCardProps) {
  const displayName = profile?.display_name || profile?.id || "Spotify user";
  const avatarUrl = profile?.images?.[0]?.url;

  return (
    <SectionCard
      title="Spotify connection"
      description="Connect your Spotify account so the app can read your profile, playback state, and manage queue actions."
    >
      {authenticated ? (
        <div className="stack-md">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={`${displayName} profile`}
                width={64}
                height={64}
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "999px",
                  objectFit: "cover",
                  border: "1px solid var(--border-primary)",
                }}
              />
            ) : (
              <div
                aria-hidden="true"
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "999px",
                  display: "grid",
                  placeItems: "center",
                  background: "var(--background-accent)",
                  border: "1px solid var(--border-primary)",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}
              >
                {displayName.slice(0, 1).toUpperCase()}
              </div>
            )}

            <div className="info-list" style={{ minWidth: "220px", flex: 1 }}>
              <div className="info-row">
                <span className="info-row__label">Status</span>
                <span className="info-row__value">Connected</span>
              </div>
              <div className="info-row">
                <span className="info-row__label">Account</span>
                <span className="info-row__value">{displayName}</span>
              </div>
              <div className="info-row">
                <span className="info-row__label">Plan</span>
                <span className="info-row__value">
                  {profile?.product ?? "Unknown"}
                </span>
              </div>
            </div>
          </div>

          <div className="button-row">
            <a
              href="/session"
              className="button button--primary"
              style={{ textDecoration: "none" }}
            >
              Go to session
            </a>

            <a
              href="/api/auth/spotify/logout"
              className="button button--ghost"
              style={{ textDecoration: "none" }}
            >
              Disconnect
            </a>
          </div>
        </div>
      ) : (
        <div className="button-row">
          <a
            href="/api/auth/spotify/login"
            className="button button--primary"
            style={{ textDecoration: "none" }}
          >
            Connect Spotify
          </a>
        </div>
      )}
    </SectionCard>
  );
}