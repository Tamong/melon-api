export interface MelonTrack {
  rank: string;
  songId: string | null;
  title: string;
  artists: string[];
  album: string;
  albumId: string | null;
  imageUrl: string;
}

export type ChartType = "top100" | "hot100" | "day" | "week" | "month";

export interface ChartTypes {
  [key: string]: string;
}
