export {};

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady?: () => void;
    Spotify?: {
      Player: new (options: SpotifyPlayerInit) => SpotifyPlayer;
    };
  }

  type SpotifyPlayerInit = {
    name: string;
    getOAuthToken: (callback: (token: string) => void) => void;
    volume?: number;
  };

  type SpotifyPlayerError = {
    message: string;
  };

  type SpotifyPlayerTrack = {
    uri: string;
    id: string | null;
    name: string;
    artists: Array<{ name: string }>;
    album: {
      name: string;
      images: Array<{ url: string }>;
    };
    duration_ms: number;
  };

  type SpotifyWebPlaybackState = {
    paused: boolean;
    position: number;
    duration: number;
    track_window: {
      current_track: SpotifyPlayerTrack;
    };
  };

  interface SpotifyPlayer {
    connect: () => Promise<boolean>;
    disconnect: () => void;
    activateElement: () => Promise<void>;
    addListener: (
      event:
        | "ready"
        | "not_ready"
        | "player_state_changed"
        | "autoplay_failed"
        | "initialization_error"
        | "authentication_error"
        | "account_error"
        | "playback_error",
      callback: (payload?: any) => void,
    ) => boolean;
    removeListener: (
      event:
        | "ready"
        | "not_ready"
        | "player_state_changed"
        | "autoplay_failed"
        | "initialization_error"
        | "authentication_error"
        | "account_error"
        | "playback_error",
      callback?: (payload?: any) => void,
    ) => boolean;
    getCurrentState: () => Promise<SpotifyWebPlaybackState | null>;
    togglePlay: () => Promise<void>;
    pause: () => Promise<void>;
    resume: () => Promise<void>;
    nextTrack: () => Promise<void>;
    previousTrack: () => Promise<void>;
    seek: (positionMs: number) => Promise<void>;
  }
}
