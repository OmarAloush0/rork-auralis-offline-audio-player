import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated, Dimensions, PanResponder, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { 
  ChevronDown, 
  SkipBack, 
  SkipForward, 
  Play, 
  Pause, 
  Shuffle, 
  Repeat, 
  Repeat1,
  Heart,
  ListMusic,
  Moon,
  Sliders,
  MoreHorizontal
} from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { useLibrary } from '@/contexts/LibraryContext';
import Visualizer from '@/components/Visualizer';
import SleepTimer from '@/components/SleepTimer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function NowPlayingScreen() {
  const router = useRouter();
  const { 
    currentTrack, 
    isPlaying, 
    progress,
    duration,
    shuffle, 
    repeat,
    sleepTimer,
    isLoading,
    error,
    togglePlayPause, 
    handleNext, 
    handlePrevious,
    seekTo,
    toggleShuffle,
    cycleRepeat
  } = useAudioPlayer();

  const [sleepTimerVisible, setSleepTimerVisible] = useState(false);
  const [showVisualizer, setShowVisualizer] = useState(true);
  
  const { toggleFavorite, favorites } = useLibrary();
  const isLiked = currentTrack ? favorites.some(f => f.id === currentTrack.id) : false;
  
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isPlaying) {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 20000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      rotateAnim.stopAnimation();
    }
  }, [isPlaying]);

  const trackDuration = duration || currentTrack?.duration || 0;

  useEffect(() => {
    if (trackDuration > 0) {
      Animated.timing(progressAnim, {
        toValue: progress / trackDuration,
        duration: 100,
        useNativeDriver: false,
      }).start();
    }
  }, [progress, trackDuration]);

  const handlePlayPause = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    togglePlayPause();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderRelease: (_, gestureState) => {
        if (currentTrack && trackDuration > 0) {
          const trackWidth = SCREEN_WIDTH - 48;
          const position = Math.max(0, Math.min(1, (gestureState.x0 - 24) / trackWidth));
          seekTo(Math.floor(position * trackDuration));
        }
      },
    })
  ).current;

  if (!currentTrack) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No track playing</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <ChevronDown size={28} color={Colors.dark.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerLabel}>NOW PLAYING</Text>
          {sleepTimer.enabled && (
            <View style={styles.sleepBadge}>
              <Moon size={12} color={Colors.dark.accent} />
              <Text style={styles.sleepBadgeText}>
                {Math.floor(sleepTimer.remaining / 60)}m
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.headerButton}>
          <MoreHorizontal size={24} color={Colors.dark.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.artworkSection}>
        <TouchableOpacity 
          activeOpacity={0.9} 
          onPress={() => setShowVisualizer(!showVisualizer)}
        >
          <Animated.View style={[
            styles.artworkContainer,
            { transform: [{ scale: scaleAnim }] }
          ]}>
            <Image source={{ uri: currentTrack.albumArt }} style={styles.artwork} />
            <View style={styles.artworkGlow} />
          </Animated.View>
        </TouchableOpacity>
        
        {showVisualizer && (
          <View style={styles.visualizerContainer}>
            <Visualizer barCount={24} height={60} />
          </View>
        )}
      </View>

      <View style={styles.trackInfoSection}>
        <View style={styles.trackHeader}>
          <View style={styles.trackInfo}>
            <Text style={styles.trackTitle} numberOfLines={1}>{currentTrack.title}</Text>
            <Text style={styles.trackArtist} numberOfLines={1}>{currentTrack.artist}</Text>
          </View>
          <TouchableOpacity 
            style={styles.likeButton}
            onPress={() => currentTrack && toggleFavorite(currentTrack)}
          >
            <Heart 
              size={24} 
              color={isLiked ? Colors.dark.error : Colors.dark.textSecondary}
              fill={isLiked ? Colors.dark.error : 'transparent'}
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.trackMeta}>
          {currentTrack.format && (
            <View style={styles.formatBadge}>
              <Text style={styles.formatText}>{currentTrack.format}</Text>
            </View>
          )}
          {currentTrack.bitrate && (
            <Text style={styles.bitrateText}>{currentTrack.bitrate} kbps</Text>
          )}
          {currentTrack.mood && (
            <View style={styles.moodBadge}>
              <Text style={styles.moodText}>{currentTrack.mood}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.progressSection} {...panResponder.panHandlers}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
          <Animated.View style={[styles.progressThumb, { left: progressWidth }]} />
        </View>
        <View style={styles.progressTimes}>
          <Text style={styles.progressTime}>{formatTime(progress)}</Text>
          <Text style={styles.progressTime}>{formatTime(trackDuration)}</Text>
        </View>
        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}
      </View>

      <View style={styles.controlsSection}>
        <TouchableOpacity 
          style={[styles.secondaryControl, shuffle && styles.activeControl]}
          onPress={toggleShuffle}
        >
          <Shuffle size={22} color={shuffle ? Colors.dark.accent : Colors.dark.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipButton} onPress={handlePrevious}>
          <SkipBack size={32} color={Colors.dark.text} fill={Colors.dark.text} />
        </TouchableOpacity>

        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity style={styles.playButton} onPress={handlePlayPause} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator size="large" color={Colors.dark.background} />
            ) : isPlaying ? (
              <Pause size={36} color={Colors.dark.background} fill={Colors.dark.background} />
            ) : (
              <Play size={36} color={Colors.dark.background} fill={Colors.dark.background} />
            )}
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity style={styles.skipButton} onPress={handleNext}>
          <SkipForward size={32} color={Colors.dark.text} fill={Colors.dark.text} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.secondaryControl, repeat !== 'off' && styles.activeControl]}
          onPress={cycleRepeat}
        >
          {repeat === 'one' ? (
            <Repeat1 size={22} color={Colors.dark.accent} />
          ) : (
            <Repeat size={22} color={repeat === 'all' ? Colors.dark.accent : Colors.dark.textSecondary} />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.bottomActions}>
        <TouchableOpacity 
          style={styles.bottomButton}
          onPress={() => router.push('/queue')}
        >
          <ListMusic size={22} color={Colors.dark.textSecondary} />
          <Text style={styles.bottomButtonText}>Queue</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.bottomButton}
          onPress={() => router.push('/equalizer')}
        >
          <Sliders size={22} color={Colors.dark.textSecondary} />
          <Text style={styles.bottomButtonText}>EQ</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.bottomButton, sleepTimer.enabled && styles.activeBottomButton]}
          onPress={() => setSleepTimerVisible(true)}
        >
          <Moon size={22} color={sleepTimer.enabled ? Colors.dark.accent : Colors.dark.textSecondary} />
          <Text style={[styles.bottomButtonText, sleepTimer.enabled && styles.activeBottomText]}>
            Sleep
          </Text>
        </TouchableOpacity>
      </View>

      <SleepTimer 
        visible={sleepTimerVisible} 
        onClose={() => setSleepTimerVisible(false)} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.dark.textTertiary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    alignItems: 'center',
    gap: 4,
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.dark.textTertiary,
    letterSpacing: 2,
  },
  sleepBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.dark.accentGlow,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sleepBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.dark.accent,
  },
  artworkSection: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 20,
  },
  artworkContainer: {
    position: 'relative',
    borderRadius: 20,
    shadowColor: Colors.dark.accent,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 20,
  },
  artwork: {
    width: SCREEN_WIDTH - 80,
    height: SCREEN_WIDTH - 80,
    borderRadius: 20,
  },
  artworkGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 30,
    backgroundColor: Colors.dark.accentGlow,
    zIndex: -1,
  },
  visualizerContainer: {
    marginTop: 24,
    width: '100%',
  },
  trackInfoSection: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
  trackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.dark.text,
    marginBottom: 4,
  },
  trackArtist: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
  },
  likeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  formatBadge: {
    backgroundColor: Colors.dark.surfaceHighlight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  formatText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.dark.accent,
  },
  bitrateText: {
    fontSize: 12,
    color: Colors.dark.textTertiary,
  },
  moodBadge: {
    backgroundColor: Colors.dark.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  moodText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.dark.textSecondary,
    textTransform: 'capitalize',
  },
  progressSection: {
    paddingHorizontal: 24,
    marginTop: 28,
  },
  progressTrack: {
    height: 4,
    backgroundColor: Colors.dark.surfaceHighlight,
    borderRadius: 2,
    position: 'relative',
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: Colors.dark.accent,
    borderRadius: 2,
  },
  progressThumb: {
    position: 'absolute',
    top: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.dark.accent,
    marginLeft: -8,
  },
  progressTimes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  progressTime: {
    fontSize: 12,
    color: Colors.dark.textTertiary,
    fontWeight: '500' as const,
  },
  errorText: {
    fontSize: 12,
    color: Colors.dark.error,
    textAlign: 'center' as const,
    marginTop: 8,
  },
  controlsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginTop: 24,
    paddingHorizontal: 24,
  },
  secondaryControl: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeControl: {
    backgroundColor: Colors.dark.accentGlow,
    borderRadius: 22,
  },
  skipButton: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.dark.accent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.dark.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 48,
    marginTop: 32,
    paddingBottom: 20,
  },
  bottomButton: {
    alignItems: 'center',
    gap: 6,
  },
  activeBottomButton: {},
  bottomButtonText: {
    fontSize: 12,
    color: Colors.dark.textTertiary,
    fontWeight: '500',
  },
  activeBottomText: {
    color: Colors.dark.accent,
  },
});
