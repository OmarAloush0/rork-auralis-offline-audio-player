import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Image } from 'react-native';
import { Play, Pause, SkipForward } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { Colors } from '@/constants/colors';

export default function MiniPlayer() {
  const router = useRouter();
  const { currentTrack, isPlaying, progress, togglePlayPause, handleNext } = useAudioPlayer();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isPlaying) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (currentTrack) {
      Animated.timing(progressAnim, {
        toValue: progress / currentTrack.duration,
        duration: 100,
        useNativeDriver: false,
      }).start();
    }
  }, [progress, currentTrack]);

  if (!currentTrack) return null;

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <TouchableOpacity 
      style={styles.container} 
      activeOpacity={0.95}
      onPress={() => router.push('/now-playing')}
    >
      <View style={styles.progressBar}>
        <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
      </View>
      
      <View style={styles.content}>
        <Animated.View style={[styles.artworkContainer, { transform: [{ scale: pulseAnim }] }]}>
          <Image source={{ uri: currentTrack.albumArt }} style={styles.artwork} />
          {isPlaying && <View style={styles.playingIndicator} />}
        </Animated.View>
        
        <View style={styles.trackInfo}>
          <Text style={styles.title} numberOfLines={1}>{currentTrack.title}</Text>
          <Text style={styles.artist} numberOfLines={1}>{currentTrack.artist}</Text>
        </View>
        
        <View style={styles.controls}>
          <TouchableOpacity 
            style={styles.controlButton} 
            onPress={togglePlayPause}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {isPlaying ? (
              <Pause size={24} color={Colors.dark.text} fill={Colors.dark.text} />
            ) : (
              <Play size={24} color={Colors.dark.text} fill={Colors.dark.text} />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.controlButton} 
            onPress={handleNext}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <SkipForward size={22} color={Colors.dark.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.dark.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  progressBar: {
    height: 2,
    backgroundColor: Colors.dark.surfaceHighlight,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.dark.accent,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  artworkContainer: {
    position: 'relative',
  },
  artwork: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  playingIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.dark.accent,
  },
  trackInfo: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 2,
  },
  artist: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.dark.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
