import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { Colors } from '@/constants/colors';

interface VisualizerProps {
  barCount?: number;
  height?: number;
  style?: object;
}

export default function Visualizer({ barCount = 32, height = 120, style }: VisualizerProps) {
  const { isPlaying, currentTrack } = useAudioPlayer();
  const barAnims = useRef<Animated.Value[]>(
    Array.from({ length: barCount }, () => new Animated.Value(0.2))
  ).current;

  useEffect(() => {
    if (isPlaying) {
      const animations = barAnims.map((anim, index) => {
        const randomHeight = () => 0.2 + Math.random() * 0.8;
        const randomDuration = () => 150 + Math.random() * 200;
        
        const animate = () => {
          if (!isPlaying) return;
          
          Animated.sequence([
            Animated.timing(anim, {
              toValue: randomHeight(),
              duration: randomDuration(),
              easing: Easing.ease,
              useNativeDriver: false,
            }),
            Animated.timing(anim, {
              toValue: randomHeight(),
              duration: randomDuration(),
              easing: Easing.ease,
              useNativeDriver: false,
            }),
          ]).start(() => {
            if (isPlaying) animate();
          });
        };
        
        setTimeout(animate, index * 30);
        return anim;
      });

      return () => {
        animations.forEach(anim => anim.stopAnimation());
      };
    } else {
      barAnims.forEach(anim => {
        Animated.timing(anim, {
          toValue: 0.1,
          duration: 300,
          useNativeDriver: false,
        }).start();
      });
    }
  }, [isPlaying]);

  const getMoodColor = (index: number) => {
    const mood = currentTrack?.mood || 'energetic';
    const position = index / barCount;
    
    switch (mood) {
      case 'energetic':
        return position < 0.33 
          ? Colors.dark.visualizer.primary 
          : position < 0.66 
            ? Colors.dark.visualizer.secondary 
            : Colors.dark.visualizer.tertiary;
      case 'calm':
        return `rgba(139, 92, 246, ${0.5 + position * 0.5})`;
      case 'happy':
        return position < 0.5 
          ? Colors.dark.accent 
          : '#4CAF50';
      case 'melancholic':
        return `rgba(100, 149, 237, ${0.5 + position * 0.5})`;
      case 'intense':
        return position < 0.5 
          ? '#EF5350' 
          : Colors.dark.visualizer.secondary;
      default:
        return Colors.dark.accent;
    }
  };

  return (
    <View style={[styles.container, { height }, style]}>
      {barAnims.map((anim, index) => {
        const barHeight = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [4, height],
        });

        return (
          <Animated.View
            key={index}
            style={[
              styles.bar,
              {
                height: barHeight,
                backgroundColor: getMoodColor(index),
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: 20,
  },
  bar: {
    flex: 1,
    maxWidth: 8,
    borderRadius: 4,
  },
});
