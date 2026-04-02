import { NextResponse } from "next/server";

import type {
  ApiResponse,
  PlaybackControlRequest,
  PlaybackControlResponse,
} from "@ai-dj/shared";

import { spotifyRequest } from "@/lib/spotify/client";

export async function POST(request: Request) {
  let body: Partial<PlaybackControlRequest>;

  try {
    body = (await request.json()) as Partial<PlaybackControlRequest>;
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Request body must be valid JSON.",
        },
      } satisfies ApiResponse<PlaybackControlResponse>,
      { status: 400 },
    );
  }

  const action = body.action;
  const deviceId = body.deviceId?.trim();
  const positionMs =
    typeof body.positionMs === "number" && Number.isFinite(body.positionMs)
      ? Math.max(0, Math.floor(body.positionMs))
      : undefined;

  if (
    action !== "resume" &&
    action !== "pause" &&
    action !== "next" &&
    action !== "previous" &&
    action !== "restart" &&
    action !== "seek"
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message:
            "action must be one of resume, pause, next, previous, restart, or seek.",
        },
      } satisfies ApiResponse<PlaybackControlResponse>,
      { status: 400 },
    );
  }

  if (action === "seek" && positionMs === undefined) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "positionMs is required when action is seek.",
        },
      } satisfies ApiResponse<PlaybackControlResponse>,
      { status: 400 },
    );
  }

  const response = await executePlaybackControl({ action, deviceId, positionMs });

  if (!response.ok) {
    if (response.status === 401) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "SPOTIFY_AUTH_REQUIRED",
            message: "Connect Spotify to control playback.",
          },
        } satisfies ApiResponse<PlaybackControlResponse>,
        { status: 401 },
      );
    }

    if (response.status === 403) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "SPOTIFY_PREMIUM_REQUIRED",
            message:
              "Spotify blocked this playback action. Make sure browser playback is enabled for a supported Premium account.",
            details: response.error,
          },
        } satisfies ApiResponse<PlaybackControlResponse>,
        { status: 403 },
      );
    }

    if (response.status === 404) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "SPOTIFY_API_ERROR",
            message:
              "No active Spotify device is ready for playback control yet. Enable browser playback or start Spotify on another device.",
            details: response.error,
          },
        } satisfies ApiResponse<PlaybackControlResponse>,
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "SPOTIFY_API_ERROR",
          message: "Failed to control Spotify playback.",
          details: response.error,
        },
      } satisfies ApiResponse<PlaybackControlResponse>,
      { status: response.status },
    );
  }

  return NextResponse.json({
    ok: true,
    data: {
      controlled: true,
    },
  } satisfies ApiResponse<PlaybackControlResponse>);
}

async function executePlaybackControl({
  action,
  deviceId,
  positionMs,
}: {
  action: NonNullable<PlaybackControlRequest["action"]>;
  deviceId?: string;
  positionMs?: number;
}) {
  if (action === "resume") {
    const params = new URLSearchParams();

    if (deviceId) {
      params.set("device_id", deviceId);
    }

    const path = params.size > 0 ? `/me/player/play?${params.toString()}` : "/me/player/play";

    return spotifyRequest(path, {
      method: "PUT",
    });
  }

  if (action === "pause") {
    const params = new URLSearchParams();

    if (deviceId) {
      params.set("device_id", deviceId);
    }

    const path = params.size > 0 ? `/me/player/pause?${params.toString()}` : "/me/player/pause";

    return spotifyRequest(path, {
      method: "PUT",
    });
  }

  if (action === "restart" || action === "seek") {
    const params = new URLSearchParams({
      position_ms: String(action === "restart" ? 0 : positionMs ?? 0),
    });

    if (deviceId) {
      params.set("device_id", deviceId);
    }

    return spotifyRequest(`/me/player/seek?${params.toString()}`, {
      method: "PUT",
    });
  }

  if (action === "next" || action === "previous") {
    const params = new URLSearchParams();

    if (deviceId) {
      params.set("device_id", deviceId);
    }

    const path =
      params.size > 0
        ? `/me/player/${action}?${params.toString()}`
        : `/me/player/${action}`;

    return spotifyRequest(path, {
      method: "POST",
    });
  }

  return spotifyRequest("/me/player/play", {
    method: "PUT",
  });
}
