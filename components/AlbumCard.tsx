import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated } from 'react-native';
import { Play } from 'lucide-react-native';
import { Album } from '@/types/audio';
import { Colors } from '@/constants/colors';

interface AlbumCardProps {
  album: Album;
  onPress: () => void;
  size?: 'small' | 'medium' | 'large';
}

export default function AlbumCard({ album, onPress, size = 'medium' }: AlbumCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const dimensions = {
    small: 120,
    medium: 160,
    large: 180,
  };

  const cardSize = dimensions[size];

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
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
        style={[styles.container, { width: cardSize }]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <View style={[styles.artworkContainer, { width: cardSize, height: cardSize }]}>
          <Image 
            source={{ uri: album.artwork }} 
            style={[styles.artwork, { width: cardSize, height: cardSize }]} 
          />
          <View style={styles.playButtonContainer}>
            <View style={styles.playButton}>
              <Play size={20} color={Colors.dark.background} fill={Colors.dark.background} />
            </View>
          </View>
        </View>
        
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>{album.title}</Text>
          <Text style={styles.artist} numberOfLines={1}>{album.artist}</Text>
          <Text style={styles.meta}>{album.year} • {album.trackCount} tracks</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginRight: 16,
  },
  artworkContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
  },
  artwork: {
    borderRadius: 12,
  },
  playButtonContainer: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    opacity: 0.9,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.dark.accent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  info: {
    paddingHorizontal: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 2,
  },
  artist: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    marginBottom: 2,
  },
  meta: {
    fontSize: 11,
    color: Colors.dark.textTertiary,
  },
});
