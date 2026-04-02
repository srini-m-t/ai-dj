import { NextResponse } from "next/server";

import { getServerEnv } from "@/lib/env/server";
import { clearSpotifyAuthCookies } from "@/lib/spotify/cookies";

/**
 * Clears Spotify auth cookies and sends the user back to the home page.
 */
export async function GET() {
  const env = getServerEnv();

  const response = NextResponse.redirect(`${env.appUrl}/`);

  clearSpotifyAuthCookies(response.cookies);

  return response;
}
