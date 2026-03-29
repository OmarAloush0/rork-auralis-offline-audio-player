import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, RotateCcw } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import Equalizer from '@/components/Equalizer';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { eqPresets } from '@/mocks/audioData';

export default function EqualizerScreen() {
  const router = useRouter();
  const { currentEQPreset, setEQPreset, playbackSpeed, setPlaybackSpeed } = useAudioPlayer();

  const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 2];

  const handleReset = () => {
    setEQPreset(eqPresets[0]);
    setPlaybackSpeed(1);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={28} color={Colors.dark.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Equalizer</Text>
        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
          <RotateCcw size={20} color={Colors.dark.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.currentPreset}>
          <Text style={styles.presetLabel}>Current Preset</Text>
          <Text style={styles.presetName}>{currentEQPreset.name}</Text>
        </View>

        <Equalizer />

        <View style={styles.speedSection}>
          <Text style={styles.sectionTitle}>Playback Speed</Text>
          <View style={styles.speedOptions}>
            {speedOptions.map(speed => (
              <TouchableOpacity
                key={speed}
                style={[
                  styles.speedButton,
                  playbackSpeed === speed && styles.speedButtonActive,
                ]}
                onPress={() => setPlaybackSpeed(speed)}
              >
                <Text
                  style={[
                    styles.speedText,
                    playbackSpeed === speed && styles.speedTextActive,
                  ]}
                >
                  {speed}x
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Pro Tip</Text>
            <Text style={styles.infoText}>
              Use the parametric equalizer to fine-tune frequencies. Drag the sliders up to boost or down to cut specific frequencies.
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Bass Boost</Text>
            <Text style={styles.infoText}>
              Enhances low frequencies (32Hz - 250Hz) for a richer, deeper sound. Great for electronic and hip-hop music.
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Stereo Width</Text>
            <Text style={styles.infoText}>
              Expands the stereo field for a more immersive listening experience. Use sparingly to avoid phase issues.
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  resetButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  currentPreset: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  presetLabel: {
    fontSize: 12,
    color: Colors.dark.textTertiary,
    marginBottom: 4,
  },
  presetName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.dark.accent,
  },
  speedSection: {
    marginTop: 32,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark.text,
    marginBottom: 16,
  },
  speedOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  speedButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.dark.surface,
    alignItems: 'center',
  },
  speedButtonActive: {
    backgroundColor: Colors.dark.accent,
  },
  speedText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.textSecondary,
  },
  speedTextActive: {
    color: Colors.dark.background,
  },
  infoSection: {
    marginTop: 32,
    paddingHorizontal: 16,
    gap: 12,
  },
  infoCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 16,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.dark.accent,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    lineHeight: 20,
  },
});
