import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated } from 'react-native';
import { MoreVertical, Play } from 'lucide-react-native';
import { Track } from '@/types/audio';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { Colors } from '@/constants/colors';

interface TrackItemProps {
  track: Track;
  index?: number;
  showArtwork?: boolean;
  showMood?: boolean;
  onOptionsPress?: () => void;
  onLongPress?: () => void;
}

export default function TrackItem({ track, index, showArtwork = true, showMood = false, onOptionsPress, onLongPress }: TrackItemProps) {
  const { currentTrack, isPlaying, playTrack } = useAudioPlayer();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  const isCurrentTrack = currentTrack?.id === track.id;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[styles.container, isCurrentTrack && styles.activeContainer]}
        onPress={() => playTrack(track)}
        onLongPress={onLongPress || onOptionsPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        delayLongPress={400}
      >
        {index !== undefined && (
          <View style={styles.indexContainer}>
            {isCurrentTrack && isPlaying ? (
              <View style={styles.playingBars}>
                <View style={[styles.bar, styles.bar1]} />
                <View style={[styles.bar, styles.bar2]} />
                <View style={[styles.bar, styles.bar3]} />
              </View>
            ) : (
              <Text style={[styles.index, isCurrentTrack && styles.activeText]}>
                {index + 1}
              </Text>
            )}
          </View>
        )}
        
        {showArtwork && (
          <View style={styles.artworkContainer}>
            <Image source={{ uri: track.albumArt }} style={styles.artwork} />
            {isCurrentTrack && (
              <View style={styles.playingOverlay}>
                <Play size={16} color={Colors.dark.text} fill={Colors.dark.text} />
              </View>
            )}
          </View>
        )}
        
        <View style={styles.info}>
          <Text 
            style={[styles.title, isCurrentTrack && styles.activeText]} 
            numberOfLines={1}
          >
            {track.title}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.artist} numberOfLines={1}>{track.artist}</Text>
            {track.format && (
              <View style={styles.formatBadge}>
                <Text style={styles.formatText}>{track.format}</Text>
              </View>
            )}
          </View>
        </View>
        
        <Text style={styles.duration}>{formatDuration(track.duration)}</Text>
        
        {onOptionsPress && (
          <TouchableOpacity 
            style={styles.optionsButton} 
            onPress={onOptionsPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MoreVertical size={20} color={Colors.dark.textTertiary} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 12,
  },
  activeContainer: {
    backgroundColor: Colors.dark.accentGlow,
  },
  indexContainer: {
    width: 28,
    alignItems: 'center',
  },
  index: {
    fontSize: 14,
    color: Colors.dark.textTertiary,
    fontWeight: '500',
  },
  playingBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: 16,
  },
  bar: {
    width: 3,
    backgroundColor: Colors.dark.accent,
    borderRadius: 1,
  },
  bar1: {
    height: 8,
  },
  bar2: {
    height: 14,
  },
  bar3: {
    height: 10,
  },
  artworkContainer: {
    position: 'relative',
  },
  artwork: {
    width: 52,
    height: 52,
    borderRadius: 6,
  },
  playingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 4,
  },
  activeText: {
    color: Colors.dark.accent,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  artist: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    flex: 1,
  },
  formatBadge: {
    backgroundColor: Colors.dark.surfaceHighlight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  formatText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.dark.textTertiary,
  },
  duration: {
    fontSize: 13,
    color: Colors.dark.textTertiary,
    marginLeft: 8,
  },
  optionsButton: {
    padding: 4,
  },
});
