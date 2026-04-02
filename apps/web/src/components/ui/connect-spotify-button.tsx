import Link from "next/link";

/**
 * Temporary server-rendered Spotify connect button.
 * Later this can become a richer auth-status component.
 */
export function ConnectSpotifyButton() {
  return (
    <Link
      href="/api/auth/spotify/login"
      className="button button--primary"
      style={{ textDecoration: "none" }}
    >
      Connect Spotify
    </Link>
  );
}