export type MoodType = 'energetic' | 'calm' | 'happy' | 'melancholic' | 'intense' | 'focus' | 'unknown';

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  albumArt: string;
  duration: number;
  genre: string;
  year: number;
  path: string;
  bitrate?: number;
  format?: string;
  mood?: MoodType;
  bpm?: number;
  energy?: number;
  playCount?: number;
  lastPlayed?: Date;
  skipCount?: number;
  rating?: number;
  dateAdded?: Date;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  artwork: string;
  year: number;
  trackCount: number;
  tracks: Track[];
}

export interface Artist {
  id: string;
  name: string;
  artwork: string;
  albumCount: number;
  trackCount: number;
}

export interface Playlist {
  id: string;
  name: string;
  artwork?: string;
  trackCount: number;
  tracks: Track[];
  createdAt: Date;
  updatedAt?: Date;
  isSmartPlaylist?: boolean;
  smartCriteria?: SmartPlaylistCriteria;
  description?: string;
}

export interface SmartPlaylistCriteria {
  type: 'driving' | 'workout' | 'focus' | 'chill' | 'sleep' | 'energetic' | 'recent' | 'favorites' | 'custom';
  minBpm?: number;
  maxBpm?: number;
  moods?: MoodType[];
  genres?: string[];
  minEnergy?: number;
  maxEnergy?: number;
  minPlayCount?: number;
  recentDays?: number;
}

export interface Folder {
  id: string;
  name: string;
  path: string;
  trackCount: number;
  subfolders?: Folder[];
}

export interface EQBand {
  frequency: number;
  gain: number;
  label: string;
}

export interface EQPreset {
  id: string;
  name: string;
  bands: EQBand[];
  isCustom?: boolean;
}

export interface QueueItem {
  track: Track;
  addedAt: Date;
}

export interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
  shuffle: boolean;
  repeat: 'off' | 'one' | 'all';
  queue: QueueItem[];
  history: Track[];
}

export interface SleepTimerState {
  enabled: boolean;
  duration: number;
  remaining: number;
}

export interface ListeningStats {
  totalPlayTime: number;
  tracksPlayed: number;
  topArtists: { name: string; playCount: number }[];
  topGenres: { name: string; playCount: number }[];
  topMoods: { mood: MoodType; playCount: number }[];
  listeningHistory: { date: string; duration: number }[];
  averageSessionLength: number;
  favoriteTimeOfDay: string;
}

export interface LibraryStats {
  totalTracks: number;
  totalAlbums: number;
  totalArtists: number;
  totalDuration: number;
  totalSize: number;
  formatDistribution: { format: string; count: number }[];
  genreDistribution: { genre: string; count: number }[];
}

export interface CloudSyncConfig {
  enabled: boolean;
  provider: 'google_drive' | 'dropbox' | 'icloud' | 'none';
  lastSync?: Date;
  autoSync: boolean;
  syncPlaylists: boolean;
  syncSettings: boolean;
}

export interface SmartShuffleConfig {
  enabled: boolean;
  avoidRecentlyPlayed: boolean;
  recentThresholdMinutes: number;
  preferHighRated: boolean;
  moodAware: boolean;
  energyFlow: 'maintain' | 'gradual_increase' | 'gradual_decrease' | 'random';
}

export type LibraryTab = 'tracks' | 'albums' | 'artists' | 'genres' | 'folders';

export type IslamicContentType = 'quran' | 'nasheed' | 'lecture' | 'dua';

export interface AIRecommendation {
  id: string;
  title: string;
  artist: string;
  type: IslamicContentType;
  description: string;
  thumbnail?: string;
  source?: string;
  reason: string;
}

export interface UserPreferences {
  favoriteReciters: string[];
  favoriteNasheedArtists: string[];
  preferredMoods: MoodType[];
  listeningTimes: string[];
  topGenres: string[];
  recentSearches: string[];
}
