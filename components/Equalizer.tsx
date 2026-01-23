import React, { useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, PanResponder } from 'react-native';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { eqPresets } from '@/mocks/audioData';
import { Colors } from '@/constants/colors';
import { EQBand } from '@/types/audio';

interface EQSliderProps {
  band: EQBand;
  onChange: (gain: number) => void;
}

function EQSlider({ band, onChange }: EQSliderProps) {
  const sliderHeight = 140;
  const thumbSize = 24;
  const maxGain = 12;
  const minGain = -12;
  
  const gainToPosition = (gain: number) => {
    return ((maxGain - gain) / (maxGain - minGain)) * (sliderHeight - thumbSize);
  };
  
  const positionAnim = useRef(new Animated.Value(gainToPosition(band.gain))).current;
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const newPosition = Math.max(0, Math.min(sliderHeight - thumbSize, 
          gainToPosition(band.gain) + gestureState.dy));
        positionAnim.setValue(newPosition);
        
        const newGain = maxGain - (newPosition / (sliderHeight - thumbSize)) * (maxGain - minGain);
        onChange(Math.round(newGain));
      },
    })
  ).current;

  const fillHeight = positionAnim.interpolate({
    inputRange: [0, sliderHeight - thumbSize],
    outputRange: [sliderHeight, thumbSize / 2],
  });

  return (
    <View style={styles.sliderContainer}>
      <Text style={styles.gainLabel}>{band.gain > 0 ? `+${band.gain}` : band.gain}</Text>
      
      <View style={styles.sliderTrack}>
        <Animated.View style={[styles.sliderFill, { height: fillHeight }]} />
        <View style={styles.sliderCenterLine} />
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.sliderThumb,
            { transform: [{ translateY: positionAnim as unknown as number }] },
          ]}
        />
      </View>
      
      <Text style={styles.freqLabel}>{band.label}</Text>
    </View>
  );
}

export default function Equalizer() {
  const { currentEQPreset, setEQPreset, bassBoost, setBassBoost, stereoWidth, setStereoWidth } = useAudioPlayer();
  const [customBands, setCustomBands] = React.useState(currentEQPreset.bands);

  const handleBandChange = useCallback((index: number, gain: number) => {
    setCustomBands(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], gain };
      return updated;
    });
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.presetScroll}
        contentContainerStyle={styles.presetContainer}
      >
        {eqPresets.map(preset => (
          <TouchableOpacity
            key={preset.id}
            style={[
              styles.presetButton,
              currentEQPreset.id === preset.id && styles.presetButtonActive,
            ]}
            onPress={() => {
              setEQPreset(preset);
              setCustomBands(preset.bands);
            }}
          >
            <Text
              style={[
                styles.presetText,
                currentEQPreset.id === preset.id && styles.presetTextActive,
              ]}
            >
              {preset.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.eqContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.slidersContainer}
        >
          {customBands.map((band, index) => (
            <EQSlider
              key={band.frequency}
              band={band}
              onChange={(gain) => handleBandChange(index, gain)}
            />
          ))}
        </ScrollView>
      </View>

      <View style={styles.effectsContainer}>
        <View style={styles.effectRow}>
          <Text style={styles.effectLabel}>Bass Boost</Text>
          <View style={styles.effectSlider}>
            <View style={[styles.effectFill, { width: `${(bassBoost + 12) / 24 * 100}%` }]} />
          </View>
          <Text style={styles.effectValue}>{bassBoost > 0 ? `+${bassBoost}` : bassBoost} dB</Text>
        </View>

        <View style={styles.effectRow}>
          <Text style={styles.effectLabel}>Stereo Width</Text>
          <View style={styles.effectSlider}>
            <View style={[styles.effectFill, { width: `${(stereoWidth + 100) / 200 * 100}%` }]} />
          </View>
          <Text style={styles.effectValue}>{stereoWidth}%</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  presetScroll: {
    maxHeight: 50,
  },
  presetContainer: {
    paddingHorizontal: 16,
    gap: 8,
    paddingVertical: 8,
  },
  presetButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.dark.surfaceHighlight,
    marginRight: 8,
  },
  presetButtonActive: {
    backgroundColor: Colors.dark.accent,
  },
  presetText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.dark.textSecondary,
  },
  presetTextActive: {
    color: Colors.dark.background,
  },
  eqContainer: {
    marginTop: 20,
    paddingVertical: 16,
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    marginHorizontal: 16,
  },
  slidersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    gap: 4,
  },
  sliderContainer: {
    alignItems: 'center',
    width: 40,
  },
  gainLabel: {
    fontSize: 10,
    color: Colors.dark.accent,
    fontWeight: '600',
    marginBottom: 8,
    height: 14,
  },
  sliderTrack: {
    width: 6,
    height: 140,
    backgroundColor: Colors.dark.surfaceHighlight,
    borderRadius: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  sliderFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.dark.accentGlow,
    borderRadius: 3,
  },
  sliderCenterLine: {
    position: 'absolute',
    top: '50%',
    left: -4,
    right: -4,
    height: 1,
    backgroundColor: Colors.dark.textTertiary,
  },
  sliderThumb: {
    position: 'absolute',
    left: -9,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.dark.accent,
    borderWidth: 3,
    borderColor: Colors.dark.background,
  },
  freqLabel: {
    fontSize: 9,
    color: Colors.dark.textTertiary,
    marginTop: 8,
  },
  effectsContainer: {
    marginTop: 20,
    paddingHorizontal: 16,
    gap: 16,
  },
  effectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  effectLabel: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    width: 90,
  },
  effectSlider: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.dark.surfaceHighlight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  effectFill: {
    height: '100%',
    backgroundColor: Colors.dark.accent,
    borderRadius: 3,
  },
  effectValue: {
    fontSize: 12,
    color: Colors.dark.text,
    fontWeight: '600',
    width: 50,
    textAlign: 'right',
  },
});
