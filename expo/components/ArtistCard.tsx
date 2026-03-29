import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated } from 'react-native';
import { Artist } from '@/types/audio';
import { Colors } from '@/constants/colors';

interface ArtistCardProps {
  artist: Artist;
  onPress: () => void;
}

export default function ArtistCard({ artist, onPress }: ArtistCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

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
        style={styles.container}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <View style={styles.artworkContainer}>
          <Image source={{ uri: artist.artwork }} style={styles.artwork} />
        </View>
        
        <Text style={styles.name} numberOfLines={1}>{artist.name}</Text>
        <Text style={styles.meta}>
          {artist.albumCount} {artist.albumCount === 1 ? 'album' : 'albums'} • {artist.trackCount} tracks
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 110,
    marginRight: 16,
  },
  artworkContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: Colors.dark.surfaceHighlight,
  },
  artwork: {
    width: '100%',
    height: '100%',
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.dark.text,
    textAlign: 'center',
    marginBottom: 2,
  },
  meta: {
    fontSize: 11,
    color: Colors.dark.textTertiary,
    textAlign: 'center',
  },
});
