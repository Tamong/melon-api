/**
 * Type for Melon error target IDs that can be returned by the service
 */
export type ErrorTargetId =
  | "artist"
  | "album"
  | "song"
  | "video"
  | "hidden_video"
  | "playlist"
  | "hidden_playlist"
  | "perf"
  | "mstory"
  | "entnews"
  | "private"
  | "theme"
  | "story"
  | "nowplaying"
  | "fanMagaz"
  | "tsSong";

/**
 * Map of error messages corresponding to each error target ID
 */
export const ERROR_MESSAGES: Record<ErrorTargetId, string> = {
  artist: "Artist not found: The requested artist does not exist",
  album: "Album not found: The requested album does not exist",
  song: "Song not found: The requested song does not exist",
  video: "Video not found: The requested video does not exist",
  hidden_video: "Private content: This content is private",
  playlist: "Playlist not found: The requested playlist does not exist",
  hidden_playlist: "Private playlist: This playlist is private",
  perf: "Performance not found: The requested performance does not exist",
  mstory: "Deleted page: This page has been deleted",
  entnews: "Deleted article: This article has been deleted",
  private: "Fan-only content: This content is only available to fans",
  theme: "Theme not found: The requested theme does not exist",
  story: "Story not found: The requested story does not exist",
  nowplaying: "Now Playing not found: The requested Now Playing does not exist",
  fanMagaz: "Mobile only: This content is only available on mobile",
  tsSong:
    "Temporarily unavailable: This song is temporarily unavailable due to a rights violation report",
};
