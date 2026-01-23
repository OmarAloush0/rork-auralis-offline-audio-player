import { useState, useEffect, useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { 
  Track, 
  Album, 
  Artist, 
  Playlist, 
  Folder,
  MoodType,
  ListeningStats,
  LibraryStats,
  CloudSyncConfig,
  SmartShuffleConfig,
  SmartPlaylistCriteria
} from '@/types/audio';


const STORAGE_KEYS = {
  TRACKS: 'auralis_tracks',
  PLAYLISTS: 'auralis_playlists',
  LISTENING_STATS: 'auralis_listening_stats',
  CLOUD_CONFIG: 'auralis_cloud_config',
  SMART_SHUFFLE_CONFIG: 'auralis_smart_shuffle',
  SCAN_PATHS: 'auralis_scan_paths',
  FAVORITES: 'auralis_favorites',
  HAS_SCANNED: 'auralis_has_scanned',
};

const defaultSmartShuffleConfig: SmartShuffleConfig = {
  enabled: true,
  avoidRecentlyPlayed: true,
  recentThresholdMinutes: 60,
  preferHighRated: true,
  moodAware: true,
  energyFlow: 'maintain',
};

const defaultCloudConfig: CloudSyncConfig = {
  enabled: false,
  provider: 'none',
  autoSync: false,
  syncPlaylists: true,
  syncSettings: true,
};

const defaultListeningStats: ListeningStats = {
  totalPlayTime: 0,
  tracksPlayed: 0,
  topArtists: [],
  topGenres: [],
  topMoods: [],
  listeningHistory: [],
  averageSessionLength: 0,
  favoriteTimeOfDay: 'evening',
};

const SUPPORTED_AUDIO_EXTENSIONS = ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a', '.alac', '.wma', '.opus'];

export const [LibraryProvider, useLibrary] = createContextHook(() => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [permissionStatus, setPermissionStatus] = useState<'undetermined' | 'granted' | 'denied'>('undetermined');
  const [hasScannedBefore, setHasScannedBefore] = useState(false);
  const [listeningStats, setListeningStats] = useState<ListeningStats>(defaultListeningStats);
  const [cloudConfig, setCloudConfig] = useState<CloudSyncConfig>(defaultCloudConfig);
  const [smartShuffleConfig, setSmartShuffleConfig] = useState<SmartShuffleConfig>(defaultSmartShuffleConfig);
  const [recentlyPlayedIds, setRecentlyPlayedIds] = useState<string[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  useEffect(() => {
    loadLibraryData();
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    if (Platform.OS === 'web') {
      setPermissionStatus('granted');
      return;
    }
    
    try {
      const { status } = await MediaLibrary.getPermissionsAsync(false, ['audio']);
      console.log('[Library] Permission status:', status);
      setPermissionStatus(status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined');
    } catch (error: any) {
      console.log('[Library] Permission check not available:', error?.message || error);
      // If permission API is not available (e.g., missing manifest config), 
      // set as undetermined and let the app work with stored/mock data
      setPermissionStatus('undetermined');
    }
  };

  const requestPermissions = async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      setPermissionStatus('granted');
      return true;
    }

    try {
      const { status } = await MediaLibrary.requestPermissionsAsync(false, ['audio']);
      console.log('[Library] Permission request result:', status);
      setPermissionStatus(status === 'granted' ? 'granted' : 'denied');
      return status === 'granted';
    } catch (error: any) {
      console.log('[Library] Permission request not available:', error?.message || error);
      // Media library scanning is not available in this build
      // The app will work with manually added or stored tracks
      Alert.alert(
        'Scanning Not Available',
        'Device media scanning requires a custom build. You can still use the app with the demo library or add tracks manually.',
        [{ text: 'OK' }]
      );
      return false;
    }
  };

  const loadLibraryData = async () => {
    try {
      console.log('[Library] Loading library data...');
      setIsLoading(true);

      const [tracksData, playlistsData, statsData, cloudData, shuffleData, favoritesData, hasScannedData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.TRACKS),
        AsyncStorage.getItem(STORAGE_KEYS.PLAYLISTS),
        AsyncStorage.getItem(STORAGE_KEYS.LISTENING_STATS),
        AsyncStorage.getItem(STORAGE_KEYS.CLOUD_CONFIG),
        AsyncStorage.getItem(STORAGE_KEYS.SMART_SHUFFLE_CONFIG),
        AsyncStorage.getItem(STORAGE_KEYS.FAVORITES),
        AsyncStorage.getItem(STORAGE_KEYS.HAS_SCANNED),
      ]);

      if (tracksData) {
        const parsed = JSON.parse(tracksData);
        setTracks(parsed.map((t: Track) => ({
          ...t,
          lastPlayed: t.lastPlayed ? new Date(t.lastPlayed) : undefined,
          dateAdded: t.dateAdded ? new Date(t.dateAdded) : undefined,
        })));
      } else {
        console.log('[Library] No stored tracks, starting with empty library');
        setTracks([]);
      }

      if (playlistsData) {
        const parsed = JSON.parse(playlistsData);
        setPlaylists(parsed.map((p: Playlist) => ({
          ...p,
          createdAt: new Date(p.createdAt),
          updatedAt: p.updatedAt ? new Date(p.updatedAt) : undefined,
        })));
      }

      if (statsData) setListeningStats(JSON.parse(statsData));
      if (cloudData) setCloudConfig(JSON.parse(cloudData));
      if (shuffleData) setSmartShuffleConfig(JSON.parse(shuffleData));
      if (favoritesData) setFavoriteIds(JSON.parse(favoritesData));
      if (hasScannedData) setHasScannedBefore(JSON.parse(hasScannedData));

      console.log('[Library] Library data loaded successfully');
    } catch (error) {
      console.error('[Library] Error loading library data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const scanDeviceForAudio = async (): Promise<Track[]> => {
    if (Platform.OS === 'web') {
      console.log('[Library] Web platform - cannot scan device storage');
      Alert.alert('Not Available', 'Device scanning is not available on web. Please use the mobile app.');
      return [];
    }

    let hasPermission = false;
    try {
      hasPermission = await requestPermissions();
    } catch (error: any) {
      console.log('[Library] Permissions not available:', error?.message || error);
      Alert.alert(
        'Feature Not Available',
        'Media library scanning requires a custom app build with the proper permissions configured. The demo library is available for testing.',
        [{ text: 'OK' }]
      );
      return [];
    }
    
    if (!hasPermission) {
      return [];
    }

    console.log('[Library] Starting device scan for audio files...');
    setIsScanning(true);
    setScanProgress(0);

    try {
      const scannedTracks: Track[] = [];
      const folderMap = new Map<string, Folder>();
      let hasNextPage = true;
      let endCursor: string | undefined;
      let totalAssets = 0;
      let processedAssets = 0;

      const countResult = await MediaLibrary.getAssetsAsync({
        mediaType: 'audio',
        first: 1,
      });
      totalAssets = countResult.totalCount;
      console.log('[Library] Total audio files found:', totalAssets);

      while (hasNextPage) {
        const assets = await MediaLibrary.getAssetsAsync({
          mediaType: 'audio',
          first: 100,
          after: endCursor,
          sortBy: [[MediaLibrary.SortBy.creationTime, false]],
        });

        for (const asset of assets.assets) {
          const extension = asset.filename.substring(asset.filename.lastIndexOf('.')).toLowerCase();
          
          if (!SUPPORTED_AUDIO_EXTENSIONS.includes(extension)) {
            processedAssets++;
            continue;
          }

          const folderPath = asset.uri.substring(0, asset.uri.lastIndexOf('/'));
          const folderName = folderPath.substring(folderPath.lastIndexOf('/') + 1);

          if (!folderMap.has(folderPath)) {
            folderMap.set(folderPath, {
              id: `folder-${folderPath}`,
              name: folderName || 'Unknown Folder',
              path: folderPath,
              trackCount: 0,
            });
          }
          const folder = folderMap.get(folderPath)!;
          folder.trackCount += 1;

          const titleWithoutExt = asset.filename.replace(/\.[^/.]+$/, '');
          const parts = titleWithoutExt.split(' - ');
          let artist = 'Unknown Artist';
          let title = titleWithoutExt;
          
          if (parts.length >= 2) {
            artist = parts[0].trim();
            title = parts.slice(1).join(' - ').trim();
          }

          const track: Track = {
            id: asset.id,
            title: title,
            artist: artist,
            album: folderName || 'Unknown Album',
            albumArt: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
            duration: Math.round(asset.duration),
            genre: 'Unknown',
            year: new Date(asset.creationTime).getFullYear(),
            path: asset.uri,
            format: extension.replace('.', '').toUpperCase(),
            dateAdded: new Date(asset.creationTime),
            playCount: 0,
            skipCount: 0,
          };

          scannedTracks.push(track);
          processedAssets++;
          
          if (totalAssets > 0) {
            setScanProgress(Math.round((processedAssets / totalAssets) * 100));
          }
        }

        hasNextPage = assets.hasNextPage;
        endCursor = assets.endCursor;
      }

      setFolders(Array.from(folderMap.values()));
      console.log('[Library] Scan complete. Found', scannedTracks.length, 'audio files');
      console.log('[Library] Found', folderMap.size, 'folders');

      return scannedTracks;
    } catch (error) {
      console.error('[Library] Error scanning device:', error);
      Alert.alert('Scan Error', 'An error occurred while scanning your device for audio files.');
      return [];
    } finally {
      setIsScanning(false);
      setScanProgress(100);
    }
  };

  const scanAndUpdateLibrary = async () => {
    const scannedTracks = await scanDeviceForAudio();
    
    if (scannedTracks.length > 0) {
      const analyzedTracks = scannedTracks.map(track => analyzeTrack(track));
      setTracks(analyzedTracks);
      await saveTracksToStorage(analyzedTracks);
      setHasScannedBefore(true);
      await AsyncStorage.setItem(STORAGE_KEYS.HAS_SCANNED, JSON.stringify(true));
      console.log('[Library] Library updated with', analyzedTracks.length, 'tracks');
    }

    return scannedTracks.length;
  };

  const rescanLibrary = async () => {
    console.log('[Library] Rescanning library...');
    const existingTracks = [...tracks];
    const existingIds = new Set(existingTracks.map(t => t.id));
    
    const scannedTracks = await scanDeviceForAudio();
    
    let newTracksCount = 0;
    const updatedTracks = [...existingTracks];
    
    for (const track of scannedTracks) {
      if (!existingIds.has(track.id)) {
        updatedTracks.push(analyzeTrack(track));
        newTracksCount++;
      }
    }

    if (newTracksCount > 0) {
      setTracks(updatedTracks);
      await saveTracksToStorage(updatedTracks);
      console.log('[Library] Added', newTracksCount, 'new tracks');
    }

    return newTracksCount;
  };

  const saveTracksToStorage = useCallback(async (newTracks: Track[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TRACKS, JSON.stringify(newTracks));
    } catch (error) {
      console.error('[Library] Error saving tracks:', error);
    }
  }, []);

  const savePlaylistsToStorage = useCallback(async (newPlaylists: Playlist[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(newPlaylists));
    } catch (error) {
      console.error('[Library] Error saving playlists:', error);
    }
  }, []);

  const analyzeMood = useCallback((track: Track): MoodType => {
    const bpm = track.bpm || 100;
    const energy = track.energy || 0.5;
    const genre = track.genre?.toLowerCase() || '';

    if (bpm > 140 || energy > 0.8) return 'intense';
    if (bpm > 120 && energy > 0.6) return 'energetic';
    if (bpm < 80 && energy < 0.4) return 'calm';
    if (genre.includes('ambient') || genre.includes('classical')) return 'calm';
    if (genre.includes('rock') || genre.includes('metal')) return 'intense';
    if (genre.includes('electronic') || genre.includes('dance')) return 'energetic';
    if (genre.includes('jazz') || genre.includes('blues')) return 'melancholic';
    if (bpm > 100 && bpm < 130) return 'happy';
    
    return 'unknown';
  }, []);

  const analyzeTrack = useCallback((track: Track): Track => {
    const analyzedMood = analyzeMood(track);
    const estimatedBpm = track.bpm || Math.floor(Math.random() * 80) + 70;
    const estimatedEnergy = track.energy || Math.random();

    return {
      ...track,
      mood: analyzedMood,
      bpm: estimatedBpm,
      energy: estimatedEnergy,
    };
  }, [analyzeMood]);

  const addTrack = useCallback(async (track: Track) => {
    const analyzedTrack = analyzeTrack({
      ...track,
      dateAdded: new Date(),
      playCount: 0,
      skipCount: 0,
    });

    const newTracks = [...tracks, analyzedTrack];
    setTracks(newTracks);
    await saveTracksToStorage(newTracks);
    console.log('[Library] Track added:', track.title);
  }, [tracks, analyzeTrack, saveTracksToStorage]);

  const addTracks = useCallback(async (newTracksToAdd: Track[]) => {
    const analyzedTracks = newTracksToAdd.map(track => analyzeTrack({
      ...track,
      dateAdded: new Date(),
      playCount: 0,
      skipCount: 0,
    }));

    const updatedTracks = [...tracks, ...analyzedTracks];
    setTracks(updatedTracks);
    await saveTracksToStorage(updatedTracks);
    console.log('[Library] Added', analyzedTracks.length, 'tracks');
  }, [tracks, analyzeTrack, saveTracksToStorage]);

  const removeTrack = useCallback(async (trackId: string) => {
    const newTracks = tracks.filter(t => t.id !== trackId);
    setTracks(newTracks);
    await saveTracksToStorage(newTracks);
    console.log('[Library] Track removed:', trackId);
  }, [tracks, saveTracksToStorage]);

  const updateTrack = useCallback(async (trackId: string, updates: Partial<Track>) => {
    const newTracks = tracks.map(t => 
      t.id === trackId ? { ...t, ...updates } : t
    );
    setTracks(newTracks);
    await saveTracksToStorage(newTracks);
  }, [tracks, saveTracksToStorage]);

  const recordPlay = useCallback(async (trackId: string) => {
    const now = new Date();
    const newTracks = tracks.map(t => 
      t.id === trackId 
        ? { ...t, playCount: (t.playCount || 0) + 1, lastPlayed: now }
        : t
    );
    setTracks(newTracks);
    await saveTracksToStorage(newTracks);

    setRecentlyPlayedIds(prev => [trackId, ...prev.filter(id => id !== trackId)].slice(0, 50));

    const track = tracks.find(t => t.id === trackId);
    if (track) {
      const newStats = { ...listeningStats };
      newStats.tracksPlayed += 1;
      newStats.totalPlayTime += track.duration;

      const artistIndex = newStats.topArtists.findIndex(a => a.name === track.artist);
      if (artistIndex >= 0) {
        newStats.topArtists[artistIndex].playCount += 1;
      } else {
        newStats.topArtists.push({ name: track.artist, playCount: 1 });
      }
      newStats.topArtists.sort((a, b) => b.playCount - a.playCount);
      newStats.topArtists = newStats.topArtists.slice(0, 10);

      if (track.genre) {
        const genreIndex = newStats.topGenres.findIndex(g => g.name === track.genre);
        if (genreIndex >= 0) {
          newStats.topGenres[genreIndex].playCount += 1;
        } else {
          newStats.topGenres.push({ name: track.genre, playCount: 1 });
        }
        newStats.topGenres.sort((a, b) => b.playCount - a.playCount);
        newStats.topGenres = newStats.topGenres.slice(0, 10);
      }

      if (track.mood) {
        const moodIndex = newStats.topMoods.findIndex(m => m.mood === track.mood);
        if (moodIndex >= 0) {
          newStats.topMoods[moodIndex].playCount += 1;
        } else {
          newStats.topMoods.push({ mood: track.mood, playCount: 1 });
        }
        newStats.topMoods.sort((a, b) => b.playCount - a.playCount);
      }

      setListeningStats(newStats);
      await AsyncStorage.setItem(STORAGE_KEYS.LISTENING_STATS, JSON.stringify(newStats));
    }

    console.log('[Library] Play recorded for:', trackId);
  }, [tracks, listeningStats, saveTracksToStorage]);

  const recordSkip = useCallback(async (trackId: string) => {
    const newTracks = tracks.map(t => 
      t.id === trackId 
        ? { ...t, skipCount: (t.skipCount || 0) + 1 }
        : t
    );
    setTracks(newTracks);
    await saveTracksToStorage(newTracks);
    console.log('[Library] Skip recorded for:', trackId);
  }, [tracks, saveTracksToStorage]);

  const toggleFavorite = useCallback(async (track: Track) => {
    const isFavorited = favoriteIds.includes(track.id);
    const newFavoriteIds = isFavorited
      ? favoriteIds.filter(id => id !== track.id)
      : [...favoriteIds, track.id];
    
    setFavoriteIds(newFavoriteIds);
    await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(newFavoriteIds));
    console.log('[Library] Favorite toggled for:', track.title, isFavorited ? '(removed)' : '(added)');
  }, [favoriteIds]);

  const favorites = useMemo((): Track[] => {
    return tracks.filter(t => favoriteIds.includes(t.id));
  }, [tracks, favoriteIds]);

  const albums = useMemo((): Album[] => {
    const albumMap = new Map<string, Album>();
    
    tracks.forEach(track => {
      const key = `${track.album}-${track.artist}`;
      if (!albumMap.has(key)) {
        albumMap.set(key, {
          id: `album-${key}`,
          title: track.album,
          artist: track.artist,
          artwork: track.albumArt,
          year: track.year,
          trackCount: 0,
          tracks: [],
        });
      }
      const album = albumMap.get(key)!;
      album.tracks.push(track);
      album.trackCount = album.tracks.length;
    });

    return Array.from(albumMap.values());
  }, [tracks]);

  const artists = useMemo((): Artist[] => {
    const artistMap = new Map<string, Artist>();
    
    tracks.forEach(track => {
      if (!artistMap.has(track.artist)) {
        artistMap.set(track.artist, {
          id: `artist-${track.artist}`,
          name: track.artist,
          artwork: track.albumArt,
          albumCount: 0,
          trackCount: 0,
        });
      }
      const artist = artistMap.get(track.artist)!;
      artist.trackCount += 1;
    });

    artistMap.forEach(artist => {
      artist.albumCount = albums.filter(a => a.artist === artist.name).length;
    });

    return Array.from(artistMap.values());
  }, [tracks, albums]);

  const genres = useMemo((): string[] => {
    const genreSet = new Set<string>();
    tracks.forEach(track => {
      if (track.genre) genreSet.add(track.genre);
    });
    return ['All', ...Array.from(genreSet).sort()];
  }, [tracks]);

  const libraryStats = useMemo((): LibraryStats => {
    const formatMap = new Map<string, number>();
    const genreMap = new Map<string, number>();
    
    tracks.forEach(track => {
      const format = track.format || 'Unknown';
      formatMap.set(format, (formatMap.get(format) || 0) + 1);
      
      const genre = track.genre || 'Unknown';
      genreMap.set(genre, (genreMap.get(genre) || 0) + 1);
    });

    return {
      totalTracks: tracks.length,
      totalAlbums: albums.length,
      totalArtists: artists.length,
      totalDuration: tracks.reduce((sum, t) => sum + t.duration, 0),
      totalSize: 0,
      formatDistribution: Array.from(formatMap.entries()).map(([format, count]) => ({ format, count })),
      genreDistribution: Array.from(genreMap.entries()).map(([genre, count]) => ({ genre, count })),
    };
  }, [tracks, albums, artists]);

  const generateSmartPlaylist = useCallback((criteria: SmartPlaylistCriteria): Track[] => {
    let filtered = [...tracks];

    if (criteria.minBpm !== undefined) {
      filtered = filtered.filter(t => (t.bpm || 0) >= criteria.minBpm!);
    }
    if (criteria.maxBpm !== undefined) {
      filtered = filtered.filter(t => (t.bpm || 200) <= criteria.maxBpm!);
    }
    if (criteria.moods && criteria.moods.length > 0) {
      filtered = filtered.filter(t => criteria.moods!.includes(t.mood || 'unknown'));
    }
    if (criteria.genres && criteria.genres.length > 0) {
      filtered = filtered.filter(t => criteria.genres!.includes(t.genre));
    }
    if (criteria.minEnergy !== undefined) {
      filtered = filtered.filter(t => (t.energy || 0) >= criteria.minEnergy!);
    }
    if (criteria.maxEnergy !== undefined) {
      filtered = filtered.filter(t => (t.energy || 1) <= criteria.maxEnergy!);
    }
    if (criteria.minPlayCount !== undefined) {
      filtered = filtered.filter(t => (t.playCount || 0) >= criteria.minPlayCount!);
    }
    if (criteria.recentDays !== undefined) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - criteria.recentDays);
      filtered = filtered.filter(t => t.dateAdded && t.dateAdded >= cutoff);
    }

    return filtered;
  }, [tracks]);

  const smartPlaylists = useMemo((): Playlist[] => {
    if (tracks.length === 0) return [];

    const playlistConfigs: { name: string; criteria: SmartPlaylistCriteria; description: string }[] = [
      {
        name: 'Driving Vibes',
        criteria: { type: 'driving', minBpm: 100, moods: ['energetic', 'happy', 'intense'] },
        description: 'High-energy tracks for the road',
      },
      {
        name: 'Late Night Chill',
        criteria: { type: 'chill', maxBpm: 90, moods: ['calm', 'melancholic'] },
        description: 'Relaxing tunes for winding down',
      },
      {
        name: 'Workout Mix',
        criteria: { type: 'workout', minBpm: 120, minEnergy: 0.7 },
        description: 'High-intensity tracks to power your workout',
      },
      {
        name: 'Focus Mode',
        criteria: { type: 'focus', maxBpm: 100, moods: ['calm', 'focus'] },
        description: 'Concentration-enhancing music',
      },
      {
        name: 'Recently Added',
        criteria: { type: 'recent', recentDays: 30 },
        description: 'Your newest additions',
      },
      {
        name: 'Most Played',
        criteria: { type: 'favorites', minPlayCount: 3 },
        description: 'Your favorite tracks',
      },
    ];

    return playlistConfigs
      .map(config => {
        const matchedTracks = generateSmartPlaylist(config.criteria);
        if (matchedTracks.length === 0) return null;

        return {
          id: `smart-${config.criteria.type}`,
          name: config.name,
          artwork: matchedTracks[0]?.albumArt,
          trackCount: matchedTracks.length,
          tracks: matchedTracks,
          createdAt: new Date(),
          isSmartPlaylist: true,
          smartCriteria: config.criteria,
          description: config.description,
        } as Playlist;
      })
      .filter((p): p is Playlist => p !== null);
  }, [tracks, generateSmartPlaylist]);

  const createPlaylist = useCallback(async (name: string, trackIds: string[] = []) => {
    const playlistTracks = tracks.filter(t => trackIds.includes(t.id));
    const newPlaylist: Playlist = {
      id: `playlist-${Date.now()}`,
      name,
      artwork: playlistTracks[0]?.albumArt,
      trackCount: playlistTracks.length,
      tracks: playlistTracks,
      createdAt: new Date(),
      isSmartPlaylist: false,
    };

    const newPlaylists = [...playlists, newPlaylist];
    setPlaylists(newPlaylists);
    await savePlaylistsToStorage(newPlaylists);
    console.log('[Library] Playlist created:', name);
    return newPlaylist;
  }, [tracks, playlists, savePlaylistsToStorage]);

  const updatePlaylist = useCallback(async (playlistId: string, updates: Partial<Playlist>) => {
    const newPlaylists = playlists.map(p => 
      p.id === playlistId ? { ...p, ...updates, updatedAt: new Date() } : p
    );
    setPlaylists(newPlaylists);
    await savePlaylistsToStorage(newPlaylists);
  }, [playlists, savePlaylistsToStorage]);

  const deletePlaylist = useCallback(async (playlistId: string) => {
    const newPlaylists = playlists.filter(p => p.id !== playlistId);
    setPlaylists(newPlaylists);
    await savePlaylistsToStorage(newPlaylists);
    console.log('[Library] Playlist deleted:', playlistId);
  }, [playlists, savePlaylistsToStorage]);

  const addToPlaylist = useCallback(async (playlistId: string, trackId: string) => {
    const track = tracks.find(t => t.id === trackId);
    if (!track) return;

    const newPlaylists = playlists.map(p => {
      if (p.id === playlistId && !p.tracks.find(t => t.id === trackId)) {
        const updatedPlaylist = {
          ...p,
          tracks: [...p.tracks, track],
          trackCount: p.trackCount + 1,
          updatedAt: new Date(),
        };
        if (!updatedPlaylist.artwork && track.albumArt) {
          updatedPlaylist.artwork = track.albumArt;
        }
        return updatedPlaylist;
      }
      return p;
    });
    setPlaylists(newPlaylists);
    await savePlaylistsToStorage(newPlaylists);
    console.log('[Library] Added track to playlist:', trackId, playlistId);
  }, [tracks, playlists, savePlaylistsToStorage]);

  const addTracksToPlaylist = useCallback(async (playlistId: string, trackIds: string[]) => {
    const tracksToAdd = tracks.filter(t => trackIds.includes(t.id));
    if (tracksToAdd.length === 0) return;

    const newPlaylists = playlists.map(p => {
      if (p.id === playlistId) {
        const existingIds = new Set(p.tracks.map(t => t.id));
        const newTracks = tracksToAdd.filter(t => !existingIds.has(t.id));
        const updatedPlaylist = {
          ...p,
          tracks: [...p.tracks, ...newTracks],
          trackCount: p.trackCount + newTracks.length,
          updatedAt: new Date(),
        };
        if (!updatedPlaylist.artwork && newTracks[0]?.albumArt) {
          updatedPlaylist.artwork = newTracks[0].albumArt;
        }
        return updatedPlaylist;
      }
      return p;
    });
    setPlaylists(newPlaylists);
    await savePlaylistsToStorage(newPlaylists);
    console.log('[Library] Added', trackIds.length, 'tracks to playlist:', playlistId);
  }, [tracks, playlists, savePlaylistsToStorage]);

  const removeFromPlaylist = useCallback(async (playlistId: string, trackId: string) => {
    const newPlaylists = playlists.map(p => {
      if (p.id === playlistId) {
        const updatedTracks = p.tracks.filter(t => t.id !== trackId);
        return {
          ...p,
          tracks: updatedTracks,
          trackCount: updatedTracks.length,
          updatedAt: new Date(),
        };
      }
      return p;
    });
    setPlaylists(newPlaylists);
    await savePlaylistsToStorage(newPlaylists);
    console.log('[Library] Removed track from playlist:', trackId, playlistId);
  }, [playlists, savePlaylistsToStorage]);

  const getSmartShuffleTrack = useCallback((currentTrack: Track | null, excludeIds: string[] = []): Track | null => {
    if (tracks.length === 0) return null;

    let candidates = tracks.filter(t => !excludeIds.includes(t.id));

    if (smartShuffleConfig.avoidRecentlyPlayed) {
      const recentIds = recentlyPlayedIds.slice(0, 10);
      candidates = candidates.filter(t => !recentIds.includes(t.id));
    }

    if (candidates.length === 0) {
      candidates = tracks.filter(t => !excludeIds.includes(t.id));
    }

    if (smartShuffleConfig.preferHighRated) {
      candidates.sort((a, b) => (b.playCount || 0) - (a.playCount || 0));
      candidates = candidates.slice(0, Math.max(candidates.length * 0.5, 10));
    }

    if (smartShuffleConfig.moodAware && currentTrack?.mood) {
      const sameMood = candidates.filter(t => t.mood === currentTrack.mood);
      if (sameMood.length > 0) {
        candidates = sameMood;
      }
    }

    if (smartShuffleConfig.energyFlow !== 'random' && currentTrack?.energy !== undefined) {
      const currentEnergy = currentTrack.energy;
      candidates.sort((a, b) => {
        const energyA = a.energy || 0.5;
        const energyB = b.energy || 0.5;
        
        if (smartShuffleConfig.energyFlow === 'maintain') {
          return Math.abs(energyA - currentEnergy) - Math.abs(energyB - currentEnergy);
        } else if (smartShuffleConfig.energyFlow === 'gradual_increase') {
          const targetA = energyA - currentEnergy;
          const targetB = energyB - currentEnergy;
          if (targetA > 0 && targetB > 0) return targetA - targetB;
          if (targetA > 0) return -1;
          if (targetB > 0) return 1;
          return 0;
        } else {
          const targetA = currentEnergy - energyA;
          const targetB = currentEnergy - energyB;
          if (targetA > 0 && targetB > 0) return targetA - targetB;
          if (targetA > 0) return -1;
          if (targetB > 0) return 1;
          return 0;
        }
      });
      candidates = candidates.slice(0, Math.max(5, Math.floor(candidates.length * 0.3)));
    }

    const randomIndex = Math.floor(Math.random() * candidates.length);
    return candidates[randomIndex] || null;
  }, [tracks, smartShuffleConfig, recentlyPlayedIds]);

  const getSimilarTracks = useCallback((track: Track, limit: number = 10): Track[] => {
    return tracks
      .filter(t => t.id !== track.id)
      .map(t => {
        let score = 0;
        if (t.mood === track.mood) score += 3;
        if (t.genre === track.genre) score += 2;
        if (t.artist === track.artist) score += 2;
        if (track.bpm && t.bpm) {
          const bpmDiff = Math.abs(track.bpm - t.bpm);
          if (bpmDiff < 10) score += 2;
          else if (bpmDiff < 20) score += 1;
        }
        if (track.energy !== undefined && t.energy !== undefined) {
          const energyDiff = Math.abs(track.energy - t.energy);
          if (energyDiff < 0.2) score += 1;
        }
        return { track: t, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.track);
  }, [tracks]);

  const updateCloudConfig = useCallback(async (config: Partial<CloudSyncConfig>) => {
    const newConfig = { ...cloudConfig, ...config };
    setCloudConfig(newConfig);
    await AsyncStorage.setItem(STORAGE_KEYS.CLOUD_CONFIG, JSON.stringify(newConfig));
    console.log('[Library] Cloud config updated');
  }, [cloudConfig]);

  const updateSmartShuffleConfig = useCallback(async (config: Partial<SmartShuffleConfig>) => {
    const newConfig = { ...smartShuffleConfig, ...config };
    setSmartShuffleConfig(newConfig);
    await AsyncStorage.setItem(STORAGE_KEYS.SMART_SHUFFLE_CONFIG, JSON.stringify(newConfig));
    console.log('[Library] Smart shuffle config updated');
  }, [smartShuffleConfig]);

  const clearLibrary = useCallback(async () => {
    setTracks([]);
    setPlaylists([]);
    setFolders([]);
    setListeningStats(defaultListeningStats);
    setHasScannedBefore(false);
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.TRACKS,
      STORAGE_KEYS.PLAYLISTS,
      STORAGE_KEYS.LISTENING_STATS,
      STORAGE_KEYS.HAS_SCANNED,
    ]);
    console.log('[Library] Library cleared');
  }, []);

  return {
    tracks,
    albums,
    artists,
    genres,
    playlists,
    smartPlaylists,
    folders,
    isLoading,
    isScanning,
    scanProgress,
    permissionStatus,
    hasScannedBefore,
    libraryStats,
    listeningStats,
    cloudConfig,
    smartShuffleConfig,
    favorites,
    toggleFavorite,
    addTrack,
    addTracks,
    removeTrack,
    updateTrack,
    recordPlay,
    recordSkip,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addToPlaylist,
    addTracksToPlaylist,
    removeFromPlaylist,
    generateSmartPlaylist,
    getSmartShuffleTrack,
    getSimilarTracks,
    updateCloudConfig,
    updateSmartShuffleConfig,
    clearLibrary,
    refreshLibrary: loadLibraryData,
    scanDeviceForAudio,
    scanAndUpdateLibrary,
    rescanLibrary,
    requestPermissions,
    recentlyPlayedTracks: useMemo(() => {
      return recentlyPlayedIds
        .map(id => tracks.find(t => t.id === id))
        .filter((t): t is Track => t !== undefined);
    }, [recentlyPlayedIds, tracks]),
  };
});
