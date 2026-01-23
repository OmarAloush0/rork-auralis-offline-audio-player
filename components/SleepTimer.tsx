import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { X, Moon, Clock } from 'lucide-react-native';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { Colors } from '@/constants/colors';

interface SleepTimerProps {
  visible: boolean;
  onClose: () => void;
}

const timerOptions = [
  { label: '5 minutes', minutes: 5 },
  { label: '10 minutes', minutes: 10 },
  { label: '15 minutes', minutes: 15 },
  { label: '30 minutes', minutes: 30 },
  { label: '45 minutes', minutes: 45 },
  { label: '1 hour', minutes: 60 },
  { label: '1.5 hours', minutes: 90 },
  { label: '2 hours', minutes: 120 },
];

export default function SleepTimer({ visible, onClose }: SleepTimerProps) {
  const { sleepTimer, startSleepTimer, cancelSleepTimer } = useAudioPlayer();

  const formatRemaining = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Moon size={24} color={Colors.dark.accent} />
            </View>
            <Text style={styles.title}>Sleep Timer</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color={Colors.dark.textSecondary} />
            </TouchableOpacity>
          </View>

          {sleepTimer.enabled ? (
            <View style={styles.activeTimer}>
              <Clock size={48} color={Colors.dark.accent} />
              <Text style={styles.remainingTime}>
                {formatRemaining(sleepTimer.remaining)}
              </Text>
              <Text style={styles.remainingLabel}>remaining</Text>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  cancelSleepTimer();
                  onClose();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel Timer</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.optionsContainer}>
              {timerOptions.map((option) => (
                <TouchableOpacity
                  key={option.minutes}
                  style={styles.optionButton}
                  onPress={() => {
                    startSleepTimer(option.minutes);
                    onClose();
                  }}
                >
                  <Text style={styles.optionText}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.dark.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  headerIcon: {
    marginRight: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 20,
  },
  activeTimer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  remainingTime: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.dark.accent,
    marginTop: 16,
  },
  remainingLabel: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    marginTop: 4,
  },
  cancelButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 32,
    backgroundColor: Colors.dark.error,
    borderRadius: 24,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  optionsContainer: {
    paddingVertical: 8,
  },
  optionButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  optionText: {
    fontSize: 16,
    color: Colors.dark.text,
    textAlign: 'center',
  },
});
