type ServerEnv = {
  nodeEnv: string;
  appUrl: string;
  databaseUrl: string;
  spotifyClientId: string;
  spotifyClientSecret: string;
  spotifyRedirectUri: string;
};

function getRequiredEnvVar(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getServerEnv(): ServerEnv {
  return {
    nodeEnv: process.env.NODE_ENV ?? "development",
    appUrl: getRequiredEnvVar("NEXT_PUBLIC_APP_URL", "http://127.0.0.1:3000"),
    databaseUrl: getRequiredEnvVar("DATABASE_URL", "file:/tmp/ai-dj-dev.db"),
    spotifyClientId: getRequiredEnvVar("SPOTIFY_CLIENT_ID"),
    spotifyClientSecret: getRequiredEnvVar("SPOTIFY_CLIENT_SECRET"),
    spotifyRedirectUri: getRequiredEnvVar("SPOTIFY_REDIRECT_URI"),
  };
}
