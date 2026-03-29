import { useState, useEffect, useRef, useCallback } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { Audio, AVPlaybackStatus } from 'expo-av';

import { Track, QueueItem, EQPreset, SleepTimerState } from '@/types/audio';
import { eqPresets } from '@/mocks/audioData';

export const [AudioPlayerProvider, useAudioPlayer] = createContextHook(() => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<'off' | 'one' | 'all'>('off');
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [history, setHistory] = useState<Track[]>([]);
  const [currentEQPreset, setCurrentEQPreset] = useState<EQPreset>(eqPresets[0]);
  const [sleepTimer, setSleepTimer] = useState<SleepTimerState>({
    enabled: false,
    duration: 0,
    remaining: 0,
  });
  const [bassBoost, setBassBoost] = useState(0);
  const [stereoWidth, setStereoWidth] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [allTracks, setAllTracks] = useState<Track[]>([]);
  const [volumeBoost, setVolumeBoost] = useState(100);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const soundRef = useRef<Audio.Sound | null>(null);
  const sleepTimerInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
        console.log('[AudioPlayer] Audio mode configured');
      } catch (err) {
        console.error('[AudioPlayer] Error setting audio mode:', err);
      }
    };

    setupAudio();

    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    if (sleepTimer.enabled && sleepTimer.remaining > 0) {
      sleepTimerInterval.current = setInterval(() => {
        setSleepTimer(prev => {
          if (prev.remaining <= 1) {
            pausePlayback();
            return { ...prev, enabled: false, remaining: 0 };
          }
          return { ...prev, remaining: prev.remaining - 1 };
        });
      }, 1000);
    } else {
      if (sleepTimerInterval.current) {
        clearInterval(sleepTimerInterval.current);
      }
    }
    return () => {
      if (sleepTimerInterval.current) {
        clearInterval(sleepTimerInterval.current);
      }
    };
  }, [sleepTimer.enabled, sleepTimer.remaining]);

  const updateAllTracks = useCallback((tracks: Track[]) => {
    setAllTracks(tracks);
  }, []);

  const onPlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if (status.error) {
        console.error('[AudioPlayer] Playback error:', status.error);
        setError(`Playback error: ${status.error}`);
        setIsPlaying(false);
      }
      return;
    }

    setIsPlaying(status.isPlaying);
    setProgress(Math.floor((status.positionMillis || 0) / 1000));
    setDuration(Math.floor((status.durationMillis || 0) / 1000));

    if (status.didJustFinish && !status.isLooping) {
      console.log('[AudioPlayer] Track finished, playing next');
      handleNext();
    }
  }, []);

  const loadAndPlayTrack = useCallback(async (track: Track) => {
    setIsLoading(true);
    setError(null);

    try {
      if (soundRef.current) {
        console.log('[AudioPlayer] Unloading previous track');
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      console.log('[AudioPlayer] Loading track:', track.title, 'from path:', track.path);

      const { sound } = await Audio.Sound.createAsync(
        { uri: track.path },
        { 
          shouldPlay: true,
          volume: (volume * volumeBoost) / 100,
          rate: playbackSpeed,
          shouldCorrectPitch: true,
          isLooping: repeat === 'one',
        },
        onPlaybackStatusUpdate
      );

      soundRef.current = sound;
      setCurrentTrack(track);
      setProgress(0);
      setIsPlaying(true);
      console.log('[AudioPlayer] Track loaded and playing:', track.title);
    } catch (err: any) {
      console.error('[AudioPlayer] Error loading track:', err);
      setError(`Failed to load track: ${err.message || 'Unknown error'}`);
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  }, [volume, volumeBoost, playbackSpeed, repeat, onPlaybackStatusUpdate]);

  const playTrack = useCallback(async (track: Track) => {
    if (currentTrack) {
      setHistory(prev => [currentTrack, ...prev.slice(0, 49)]);
    }
    await loadAndPlayTrack(track);
  }, [currentTrack, loadAndPlayTrack]);

  const pausePlayback = useCallback(async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
        console.log('[AudioPlayer] Playback paused');
      } catch (err) {
        console.error('[AudioPlayer] Error pausing:', err);
      }
    }
  }, []);

  const resumePlayback = useCallback(async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.playAsync();
        setIsPlaying(true);
        console.log('[AudioPlayer] Playback resumed');
      } catch (err) {
        console.error('[AudioPlayer] Error resuming:', err);
      }
    }
  }, []);

  const togglePlayPause = useCallback(async () => {
    if (!currentTrack) return;
    
    if (isPlaying) {
      await pausePlayback();
    } else {
      await resumePlayback();
    }
  }, [isPlaying, currentTrack, pausePlayback, resumePlayback]);

  const handleNext = useCallback(async () => {
    if (repeat === 'one' && currentTrack) {
      await loadAndPlayTrack(currentTrack);
      return;
    }

    if (queue.length > 0) {
      const nextItem = queue[0];
      if (currentTrack) {
        setHistory(prev => [currentTrack, ...prev.slice(0, 49)]);
      }
      setQueue(prev => prev.slice(1));
      await loadAndPlayTrack(nextItem.track);
      return;
    }

    if (allTracks.length === 0) return;

    const currentIndex = allTracks.findIndex(t => t.id === currentTrack?.id);
    let nextIndex: number;

    if (shuffle) {
      nextIndex = Math.floor(Math.random() * allTracks.length);
    } else {
      nextIndex = (currentIndex + 1) % allTracks.length;
    }

    if (currentTrack) {
      setHistory(prev => [currentTrack, ...prev.slice(0, 49)]);
    }
    
    const nextTrack = allTracks[nextIndex];
    if (nextTrack) {
      await loadAndPlayTrack(nextTrack);
    }
  }, [currentTrack, queue, shuffle, repeat, allTracks, loadAndPlayTrack]);

  const handlePrevious = useCallback(async () => {
    if (progress > 3 && currentTrack) {
      await seekTo(0);
      return;
    }

    if (history.length > 0) {
      const prevTrack = history[0];
      if (currentTrack) {
        setQueue(prev => [{ track: currentTrack, addedAt: new Date() }, ...prev]);
      }
      setHistory(prev => prev.slice(1));
      await loadAndPlayTrack(prevTrack);
      return;
    }

    if (allTracks.length === 0) return;

    const currentIndex = allTracks.findIndex(t => t.id === currentTrack?.id);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : allTracks.length - 1;
    const prevTrack = allTracks[prevIndex];
    
    if (prevTrack) {
      await loadAndPlayTrack(prevTrack);
    }
  }, [currentTrack, history, progress, allTracks, loadAndPlayTrack]);

  const seekTo = useCallback(async (position: number) => {
    if (soundRef.current) {
      try {
        await soundRef.current.setPositionAsync(position * 1000);
        setProgress(position);
        console.log('[AudioPlayer] Seek to:', position);
      } catch (err) {
        console.error('[AudioPlayer] Error seeking:', err);
      }
    }
  }, []);

  const setVolumeLevel = useCallback(async (newVolume: number) => {
    setVolume(newVolume);
    if (soundRef.current) {
      try {
        await soundRef.current.setVolumeAsync((newVolume * volumeBoost) / 100);
      } catch (err) {
        console.error('[AudioPlayer] Error setting volume:', err);
      }
    }
  }, [volumeBoost]);

  const setVolumeBoostLevel = useCallback(async (boost: number) => {
    setVolumeBoost(boost);
    if (soundRef.current) {
      try {
        await soundRef.current.setVolumeAsync((volume * boost) / 100);
      } catch (err) {
        console.error('[AudioPlayer] Error setting volume boost:', err);
      }
    }
  }, [volume]);

  const setPlaybackSpeedLevel = useCallback(async (speed: number) => {
    setPlaybackSpeed(speed);
    if (soundRef.current) {
      try {
        await soundRef.current.setRateAsync(speed, true);
      } catch (err) {
        console.error('[AudioPlayer] Error setting playback speed:', err);
      }
    }
  }, []);

  const addToQueue = useCallback((track: Track) => {
    setQueue(prev => [...prev, { track, addedAt: new Date() }]);
    console.log('[AudioPlayer] Added to queue:', track.title);
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    setQueue(prev => prev.filter((_, i) => i !== index));
    console.log('[AudioPlayer] Removed from queue at index:', index);
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
    console.log('[AudioPlayer] Queue cleared');
  }, []);

  const toggleShuffle = useCallback(() => {
    setShuffle(prev => !prev);
    console.log('[AudioPlayer] Shuffle:', !shuffle);
  }, [shuffle]);

  const cycleRepeat = useCallback(async () => {
    const modes: ('off' | 'one' | 'all')[] = ['off', 'all', 'one'];
    const currentIndex = modes.indexOf(repeat);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setRepeat(nextMode);
    
    if (soundRef.current) {
      try {
        await soundRef.current.setIsLoopingAsync(nextMode === 'one');
      } catch (err) {
        console.error('[AudioPlayer] Error setting loop:', err);
      }
    }
    
    console.log('[AudioPlayer] Repeat mode:', nextMode);
  }, [repeat]);

  const startSleepTimer = useCallback((minutes: number) => {
    setSleepTimer({
      enabled: true,
      duration: minutes * 60,
      remaining: minutes * 60,
    });
    console.log('[AudioPlayer] Sleep timer started:', minutes, 'minutes');
  }, []);

  const cancelSleepTimer = useCallback(() => {
    setSleepTimer({ enabled: false, duration: 0, remaining: 0 });
    console.log('[AudioPlayer] Sleep timer cancelled');
  }, []);

  const setEQPreset = useCallback((preset: EQPreset) => {
    setCurrentEQPreset(preset);
    console.log('[AudioPlayer] EQ preset changed:', preset.name);
  }, []);

  const stop = useCallback(async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      } catch (err) {
        console.error('[AudioPlayer] Error stopping:', err);
      }
    }
    setIsPlaying(false);
    setProgress(0);
    setCurrentTrack(null);
    console.log('[AudioPlayer] Playback stopped');
  }, []);

  return {
    currentTrack,
    isPlaying,
    progress,
    duration,
    volume,
    shuffle,
    repeat,
    queue,
    history,
    currentEQPreset,
    sleepTimer,
    bassBoost,
    stereoWidth,
    playbackSpeed,
    isLoading,
    error,
    playTrack,
    togglePlayPause,
    handleNext,
    handlePrevious,
    seekTo,
    setVolume: setVolumeLevel,
    addToQueue,
    removeFromQueue,
    clearQueue,
    toggleShuffle,
    cycleRepeat,
    startSleepTimer,
    cancelSleepTimer,
    setEQPreset,
    setBassBoost,
    setStereoWidth,
    setPlaybackSpeed: setPlaybackSpeedLevel,
    updateAllTracks,
    stop,
    volumeBoost,
    setVolumeBoost: setVolumeBoostLevel,
  };
});
