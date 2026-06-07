export interface Song {
  id: string;
  title: string;
  artist: string;
  albumId: string;
  albumTitle: string;
  duration: string;
  durationSeconds: number;
  coverUrl: string;
  audioUrl: string;
  playlists: string[];
  lyrics?: string;
  filePath?: string;
  artwork?: string;
  isFavorite?: boolean;
  plays?: number;
  albumArtist?: string;
  year?: string;
  genre?: string;
  codec?: string;
  quality?: string;
  sampleRate?: number;
  bitDepth?: number;
  bitrate?: number;
  copyright?: string;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  year: string;
  genre: string;
  songs: Song[];
  artwork?: string;
  codec?: string;
  quality?: string;
  sampleRate?: number;
  bitDepth?: number;
  bitrate?: number;
}

export interface Playlist {
  id: string;
  name: string;
  coverUrl: string;
  description: string;
  songs: Song[];
}
