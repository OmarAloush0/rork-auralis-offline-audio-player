import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated,
  PanResponder,
  Dimensions,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, AlertTriangle } from 'lucide-react-native';
import Svg, { Circle, Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors } from '@/constants/colors';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const { width } = Dimensions.get('window');
const DIAL_SIZE = width * 0.7;
const DIAL_RADIUS = DIAL_SIZE / 2;
const STROKE_WIDTH = 16;
const INNER_RADIUS = DIAL_RADIUS - STROKE_WIDTH / 2 - 20;

const VOLUME_PRESETS = [
  { label: 'Mute', value: 0 },
  { label: '30%', value: 30 },
  { label: '60%', value: 60 },
  { label: '100%', value: 100 },
  { label: '125%', value: 125, premium: false },
  { label: '150%', value: 150, premium: false },
  { label: '175%', value: 175, premium: false },
  { label: 'Max', value: 200, premium: false },
];

export default function VolumeBoosterScreen() {
  const router = useRouter();
  const { volumeBoost, setVolumeBoost } = useAudioPlayer();
  const [localVolume, setLocalVolume] = useState(volumeBoost);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setLocalVolume(volumeBoost);
  }, [volumeBoost]);

  useEffect(() => {
    if (localVolume > 100) {
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
  }, [localVolume]);

  useEffect(() => {
    Animated.timing(glowAnim, {
      toValue: localVolume / 200,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [localVolume]);

  const handleVolumeChange = (value: number) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    if (value > 100 && volumeBoost <= 100) {
      Alert.alert(
        'Volume Boost',
        'Increasing volume above 100% may cause audio distortion and could damage your hearing. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Continue', 
            onPress: () => {
              setLocalVolume(value);
              setVolumeBoost(value);
              console.log('[VolumeBooster] Volume set to:', value);
            }
          },
        ]
      );
    } else {
      setLocalVolume(value);
      setVolumeBoost(value);
      console.log('[VolumeBooster] Volume set to:', value);
    }
  };

  const getArcColor = () => {
    if (localVolume <= 60) return '#4ECDC4';
    if (localVolume <= 100) return '#4ECDC4';
    if (localVolume <= 150) return Colors.dark.accent;
    return '#FF6B6B';
  };

  const calculateArcPath = () => {
    const startAngle = 135;
    const endAngle = 405;
    const range = endAngle - startAngle;
    const volumeAngle = startAngle + (localVolume / 200) * range;
    
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (volumeAngle * Math.PI) / 180;
    
    const centerX = DIAL_SIZE / 2;
    const centerY = DIAL_SIZE / 2;
    const radius = DIAL_RADIUS - STROKE_WIDTH - 10;
    
    const startX = centerX + radius * Math.cos(startRad);
    const startY = centerY + radius * Math.sin(startRad);
    const endX = centerX + radius * Math.cos(endRad);
    const endY = centerY + radius * Math.sin(endRad);
    
    const largeArcFlag = volumeAngle - startAngle > 180 ? 1 : 0;
    
    return `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`;
  };

  const calculateBackgroundArcPath = () => {
    const startAngle = 135;
    const endAngle = 405;
    
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    
    const centerX = DIAL_SIZE / 2;
    const centerY = DIAL_SIZE / 2;
    const radius = DIAL_RADIUS - STROKE_WIDTH - 10;
    
    const startX = centerX + radius * Math.cos(startRad);
    const startY = centerY + radius * Math.sin(startRad);
    const endX = centerX + radius * Math.cos(endRad);
    const endY = centerY + radius * Math.sin(endRad);
    
    return `M ${startX} ${startY} A ${radius} ${radius} 0 1 1 ${endX} ${endY}`;
  };

  const calculateIndicatorPosition = () => {
    const startAngle = 135;
    const range = 270;
    const angle = startAngle + (localVolume / 200) * range;
    const rad = (angle * Math.PI) / 180;
    
    const centerX = DIAL_SIZE / 2;
    const centerY = DIAL_SIZE / 2;
    const radius = DIAL_RADIUS - STROKE_WIDTH - 10;
    
    return {
      x: centerX + radius * Math.cos(rad),
      y: centerY + radius * Math.sin(rad),
    };
  };

  const indicatorPos = calculateIndicatorPosition();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Volume Booster</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <Animated.View 
          style={[
            styles.dialContainer,
            { transform: [{ scale: pulseAnim }] }
          ]}
        >
          <Svg width={DIAL_SIZE} height={DIAL_SIZE}>
            <Defs>
              <LinearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#4ECDC4" />
                <Stop offset="50%" stopColor={Colors.dark.accent} />
                <Stop offset="100%" stopColor="#FF6B6B" />
              </LinearGradient>
            </Defs>
            
            <Path
              d={calculateBackgroundArcPath()}
              stroke={Colors.dark.surfaceHighlight}
              strokeWidth={STROKE_WIDTH}
              fill="none"
              strokeLinecap="round"
            />
            
            <Path
              d={calculateArcPath()}
              stroke={getArcColor()}
              strokeWidth={STROKE_WIDTH}
              fill="none"
              strokeLinecap="round"
            />
            
            <Circle
              cx={indicatorPos.x}
              cy={indicatorPos.y}
              r={8}
              fill={Colors.dark.text}
            />
          </Svg>
          
          <View style={styles.dialInner}>
            <View style={styles.innerCircle}>
              <View style={styles.indicatorLine} />
            </View>
          </View>
        </Animated.View>

        <Text style={styles.volumeText}>Volume {localVolume}%</Text>
        
        {localVolume > 100 && (
          <View style={styles.warningContainer}>
            <AlertTriangle size={16} color={Colors.dark.warning} />
            <Text style={styles.warningText}>High volume may damage hearing</Text>
          </View>
        )}

        <View style={styles.presetsContainer}>
          <Text style={styles.presetsTitle}>Click to adjust volume</Text>
          
          <View style={styles.presetsGrid}>
            {VOLUME_PRESETS.slice(0, 4).map((preset) => (
              <TouchableOpacity
                key={preset.value}
                style={[
                  styles.presetButton,
                  localVolume === preset.value && styles.presetButtonActive
                ]}
                onPress={() => handleVolumeChange(preset.value)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.presetText,
                  localVolume === preset.value && styles.presetTextActive
                ]}>
                  {preset.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={styles.presetsGrid}>
            {VOLUME_PRESETS.slice(4).map((preset) => (
              <TouchableOpacity
                key={preset.value}
                style={[
                  styles.presetButton,
                  styles.presetButtonBoost,
                  localVolume === preset.value && styles.presetButtonActive
                ]}
                onPress={() => handleVolumeChange(preset.value)}
                activeOpacity={0.7}
              >
                <View style={styles.presetContent}>
                  <Text style={[
                    styles.presetText,
                    localVolume === preset.value && styles.presetTextActive
                  ]}>
                    {preset.label}
                  </Text>

                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 40,
  },
  dialContainer: {
    width: DIAL_SIZE,
    height: DIAL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialInner: {
    position: 'absolute',
    width: DIAL_SIZE,
    height: DIAL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: {
    width: DIAL_SIZE * 0.55,
    height: DIAL_SIZE * 0.55,
    borderRadius: DIAL_SIZE * 0.275,
    backgroundColor: Colors.dark.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  indicatorLine: {
    width: 3,
    height: 30,
    backgroundColor: Colors.dark.text,
    borderRadius: 2,
  },
  volumeText: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    marginTop: 24,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 152, 0, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
    gap: 8,
  },
  warningText: {
    fontSize: 13,
    color: Colors.dark.warning,
    fontWeight: '500' as const,
  },
  presetsContainer: {
    width: '100%',
    paddingHorizontal: 24,
    marginTop: 40,
  },
  presetsTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.dark.textSecondary,
    marginBottom: 16,
  },
  presetsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  presetButton: {
    flex: 1,
    backgroundColor: Colors.dark.surface,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  presetButtonBoost: {
    backgroundColor: Colors.dark.surfaceHighlight,
  },
  presetButtonActive: {
    backgroundColor: '#4ECDC4',
  },
  presetContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  presetText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.dark.textSecondary,
  },
  presetTextActive: {
    color: Colors.dark.background,
  },

});
