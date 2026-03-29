import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Modal, Alert, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Sliders, 
  Volume2,
  Volume1, 
  Gauge, 
  Database, 
  Info, 
  ChevronRight,
  Headphones,
  Zap,
  Moon,
  Vibrate,
  Shield,
  Cloud,
  CloudOff,
  Brain,
  TrendingUp,
  Trash2,
  X,
  RefreshCw,
  FolderSearch,
  CheckCircle2
} from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useRouter } from 'expo-router';
import { useLibrary } from '@/contexts/LibraryContext';

interface SettingItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (value: boolean) => void;
  danger?: boolean;
  loading?: boolean;
}

function SettingItem({ icon, title, subtitle, value, onPress, toggle, toggleValue, onToggle, danger, loading }: SettingItemProps) {
  return (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={onPress}
      disabled={toggle || loading}
      activeOpacity={toggle ? 1 : 0.7}
    >
      <View style={[styles.settingIcon, danger && styles.settingIconDanger]}>{icon}</View>
      <View style={styles.settingInfo}>
        <Text style={[styles.settingTitle, danger && styles.settingTitleDanger]}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {loading ? (
        <ActivityIndicator size="small" color={Colors.dark.accent} />
      ) : toggle ? (
        <Switch
          value={toggleValue}
          onValueChange={onToggle}
          trackColor={{ false: Colors.dark.surfaceHighlight, true: Colors.dark.accent }}
          thumbColor={Colors.dark.text}
        />
      ) : value ? (
        <View style={styles.settingValue}>
          <Text style={styles.settingValueText}>{value}</Text>
          <ChevronRight size={18} color={Colors.dark.textTertiary} />
        </View>
      ) : (
        <ChevronRight size={18} color={Colors.dark.textTertiary} />
      )}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { 
    libraryStats, 
    listeningStats, 
    cloudConfig, 
    smartShuffleConfig,
    updateCloudConfig,
    updateSmartShuffleConfig,
    clearLibrary,
    scanAndUpdateLibrary,
    rescanLibrary,
    isScanning,
    scanProgress,
    permissionStatus,
    requestPermissions,
  } = useLibrary();

  const [gaplessPlayback, setGaplessPlayback] = useState(true);
  const [crossfade, setCrossfade] = useState(true);
  const [loudnessNorm, setLoudnessNorm] = useState(true);
  const [haptics, setHaptics] = useState(true);
  const [bitPerfect, setBitPerfect] = useState(false);
  const [cloudModalVisible, setCloudModalVisible] = useState(false);
  const [smartShuffleModalVisible, setSmartShuffleModalVisible] = useState(false);
  const [scanResultModalVisible, setScanResultModalVisible] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<number>(0);

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handleScanLibrary = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not Available', 'Device scanning is not available on web. Please use the mobile app.');
      return;
    }

    if (permissionStatus !== 'granted') {
      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert('Permission Required', 'Please grant storage permission to scan your music library.');
        return;
      }
    }

    const count = await scanAndUpdateLibrary();
    setLastScanResult(count);
    setScanResultModalVisible(true);
  };

  const handleRescanLibrary = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not Available', 'Device scanning is not available on web. Please use the mobile app.');
      return;
    }

    if (permissionStatus !== 'granted') {
      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert('Permission Required', 'Please grant storage permission to scan your music library.');
        return;
      }
    }

    const newCount = await rescanLibrary();
    Alert.alert(
      'Rescan Complete',
      newCount > 0 
        ? `Found ${newCount} new track${newCount > 1 ? 's' : ''} on your device.`
        : 'No new tracks found. Your library is up to date.'
    );
  };

  const handleClearLibrary = () => {
    Alert.alert(
      'Clear Library',
      'This will remove all tracks, playlists, and listening history. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: () => {
            clearLibrary();
            console.log('[Settings] Library cleared');
          }
        },
      ]
    );
  };

  const cloudProviderLabels: Record<string, string> = {
    none: 'Not configured',
    google_drive: 'Google Drive',
    dropbox: 'Dropbox',
    icloud: 'iCloud',
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Library</Text>
          
          <View style={styles.sectionContent}>
            <SettingItem
              icon={<FolderSearch size={20} color={Colors.dark.accent} />}
              title="Scan Library"
              subtitle={libraryStats.totalTracks > 0 
                ? `${libraryStats.totalTracks} tracks in library`
                : "Find music on your device"}
              onPress={handleScanLibrary}
              loading={isScanning}
            />
            {libraryStats.totalTracks > 0 && (
              <SettingItem
                icon={<RefreshCw size={20} color={Colors.dark.accent} />}
                title="Rescan for New Music"
                subtitle="Find newly added songs"
                onPress={handleRescanLibrary}
                loading={isScanning}
              />
            )}
            <SettingItem
              icon={<Shield size={20} color={Colors.dark.accent} />}
              title="Backup & Restore"
              subtitle="Save your playlists and settings"
              onPress={() => {}}
            />
            <SettingItem
              icon={<Trash2 size={20} color="#EF5350" />}
              title="Clear Library"
              subtitle="Remove all tracks and data"
              onPress={handleClearLibrary}
              danger
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Audio</Text>
          
          <View style={styles.sectionContent}>
            <SettingItem
              icon={<Sliders size={20} color={Colors.dark.accent} />}
              title="Equalizer"
              subtitle="Customize your sound"
              onPress={() => router.push('/equalizer')}
            />
            <SettingItem
              icon={<Volume1 size={20} color={Colors.dark.accent} />}
              title="Volume Booster"
              subtitle="Boost volume up to 200%"
              onPress={() => router.push('/volume-booster')}
            />
            <SettingItem
              icon={<Volume2 size={20} color={Colors.dark.accent} />}
              title="Loudness Normalization"
              subtitle="Balance volume across tracks"
              toggle
              toggleValue={loudnessNorm}
              onToggle={setLoudnessNorm}
            />
            <SettingItem
              icon={<Gauge size={20} color={Colors.dark.accent} />}
              title="Gapless Playback"
              subtitle="Seamless transitions between tracks"
              toggle
              toggleValue={gaplessPlayback}
              onToggle={setGaplessPlayback}
            />
            <SettingItem
              icon={<Zap size={20} color={Colors.dark.accent} />}
              title="Crossfade"
              subtitle="Smooth fade between tracks"
              toggle
              toggleValue={crossfade}
              onToggle={setCrossfade}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quality</Text>
          
          <View style={styles.sectionContent}>
            <SettingItem
              icon={<Headphones size={20} color={Colors.dark.accent} />}
              title="Bit-Perfect Mode"
              subtitle="No audio processing for purists"
              toggle
              toggleValue={bitPerfect}
              onToggle={setBitPerfect}
            />
            <SettingItem
              icon={<Headphones size={20} color={Colors.dark.accent} />}
              title="Headphone Profiles"
              subtitle="Optimize for your headphones"
              value="None"
              onPress={() => {}}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Smart Features</Text>
          
          <View style={styles.sectionContent}>
            <SettingItem
              icon={<Brain size={20} color={Colors.dark.accent} />}
              title="Smart Shuffle"
              subtitle="Intelligent track selection"
              value={smartShuffleConfig.enabled ? 'On' : 'Off'}
              onPress={() => setSmartShuffleModalVisible(true)}
            />
            <SettingItem
              icon={<TrendingUp size={20} color={Colors.dark.accent} />}
              title="Mood Analysis"
              subtitle="Auto-detect track moods"
              toggle
              toggleValue={true}
              onToggle={() => {}}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cloud Sync</Text>
          
          <View style={styles.sectionContent}>
            <SettingItem
              icon={cloudConfig.enabled ? <Cloud size={20} color={Colors.dark.accent} /> : <CloudOff size={20} color={Colors.dark.accent} />}
              title="Cloud Backup"
              subtitle={cloudConfig.enabled ? 'Sync playlists & settings' : 'Not configured'}
              value={cloudProviderLabels[cloudConfig.provider]}
              onPress={() => setCloudModalVisible(true)}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Experience</Text>
          
          <View style={styles.sectionContent}>
            <SettingItem
              icon={<Moon size={20} color={Colors.dark.accent} />}
              title="Theme"
              value="Dark"
              onPress={() => {}}
            />
            <SettingItem
              icon={<Vibrate size={20} color={Colors.dark.accent} />}
              title="Haptic Feedback"
              subtitle="Vibration on interactions"
              toggle
              toggleValue={haptics}
              onToggle={setHaptics}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <View style={styles.sectionContent}>
            <SettingItem
              icon={<Info size={20} color={Colors.dark.accent} />}
              title="About AURALIS"
              subtitle="Version 1.0.0"
              onPress={() => {}}
            />
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{libraryStats.totalTracks}</Text>
            <Text style={styles.statLabel}>Tracks</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{libraryStats.totalAlbums}</Text>
            <Text style={styles.statLabel}>Albums</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{libraryStats.totalArtists}</Text>
            <Text style={styles.statLabel}>Artists</Text>
          </View>
        </View>

        {listeningStats.totalPlayTime > 0 && (
          <View style={styles.listeningStatsContainer}>
            <Text style={styles.listeningStatsTitle}>Listening Stats</Text>
            <View style={styles.listeningStatsGrid}>
              <View style={styles.listeningStat}>
                <Text style={styles.listeningStatValue}>{formatDuration(listeningStats.totalPlayTime)}</Text>
                <Text style={styles.listeningStatLabel}>Total Play Time</Text>
              </View>
              <View style={styles.listeningStat}>
                <Text style={styles.listeningStatValue}>{listeningStats.tracksPlayed}</Text>
                <Text style={styles.listeningStatLabel}>Tracks Played</Text>
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      <Modal
        visible={scanResultModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setScanResultModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.scanResultContent}>
            <View style={styles.scanResultIcon}>
              <CheckCircle2 size={48} color={Colors.dark.accent} />
            </View>
            <Text style={styles.scanResultTitle}>Scan Complete!</Text>
            <Text style={styles.scanResultText}>
              Found {lastScanResult} audio file{lastScanResult !== 1 ? 's' : ''} on your device.
            </Text>
            <TouchableOpacity 
              style={styles.scanResultButton}
              onPress={() => setScanResultModalVisible(false)}
            >
              <Text style={styles.scanResultButtonText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={cloudModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCloudModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cloud Sync</Text>
              <TouchableOpacity onPress={() => setCloudModalVisible(false)}>
                <X size={24} color={Colors.dark.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>
              Sync your playlists and settings across devices
            </Text>

            <View style={styles.cloudOptions}>
              {['none', 'google_drive', 'dropbox', 'icloud'].map(provider => (
                <TouchableOpacity
                  key={provider}
                  style={[
                    styles.cloudOption,
                    cloudConfig.provider === provider && styles.cloudOptionActive
                  ]}
                  onPress={() => updateCloudConfig({ 
                    provider: provider as 'none' | 'google_drive' | 'dropbox' | 'icloud',
                    enabled: provider !== 'none'
                  })}
                >
                  <Text style={[
                    styles.cloudOptionText,
                    cloudConfig.provider === provider && styles.cloudOptionTextActive
                  ]}>
                    {cloudProviderLabels[provider]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {cloudConfig.provider !== 'none' && (
              <View style={styles.cloudSettings}>
                <View style={styles.cloudSettingRow}>
                  <Text style={styles.cloudSettingLabel}>Auto Sync</Text>
                  <Switch
                    value={cloudConfig.autoSync}
                    onValueChange={(value) => updateCloudConfig({ autoSync: value })}
                    trackColor={{ false: Colors.dark.surfaceHighlight, true: Colors.dark.accent }}
                    thumbColor={Colors.dark.text}
                  />
                </View>
                <View style={styles.cloudSettingRow}>
                  <Text style={styles.cloudSettingLabel}>Sync Playlists</Text>
                  <Switch
                    value={cloudConfig.syncPlaylists}
                    onValueChange={(value) => updateCloudConfig({ syncPlaylists: value })}
                    trackColor={{ false: Colors.dark.surfaceHighlight, true: Colors.dark.accent }}
                    thumbColor={Colors.dark.text}
                  />
                </View>
                <View style={styles.cloudSettingRow}>
                  <Text style={styles.cloudSettingLabel}>Sync Settings</Text>
                  <Switch
                    value={cloudConfig.syncSettings}
                    onValueChange={(value) => updateCloudConfig({ syncSettings: value })}
                    trackColor={{ false: Colors.dark.surfaceHighlight, true: Colors.dark.accent }}
                    thumbColor={Colors.dark.text}
                  />
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={smartShuffleModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSmartShuffleModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Smart Shuffle</Text>
              <TouchableOpacity onPress={() => setSmartShuffleModalVisible(false)}>
                <X size={24} color={Colors.dark.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>
              Intelligent shuffle based on your listening habits
            </Text>

            <View style={styles.cloudSettings}>
              <View style={styles.cloudSettingRow}>
                <Text style={styles.cloudSettingLabel}>Enable Smart Shuffle</Text>
                <Switch
                  value={smartShuffleConfig.enabled}
                  onValueChange={(value) => updateSmartShuffleConfig({ enabled: value })}
                  trackColor={{ false: Colors.dark.surfaceHighlight, true: Colors.dark.accent }}
                  thumbColor={Colors.dark.text}
                />
              </View>
              <View style={styles.cloudSettingRow}>
                <Text style={styles.cloudSettingLabel}>Avoid Recently Played</Text>
                <Switch
                  value={smartShuffleConfig.avoidRecentlyPlayed}
                  onValueChange={(value) => updateSmartShuffleConfig({ avoidRecentlyPlayed: value })}
                  trackColor={{ false: Colors.dark.surfaceHighlight, true: Colors.dark.accent }}
                  thumbColor={Colors.dark.text}
                />
              </View>
              <View style={styles.cloudSettingRow}>
                <Text style={styles.cloudSettingLabel}>Prefer High Rated</Text>
                <Switch
                  value={smartShuffleConfig.preferHighRated}
                  onValueChange={(value) => updateSmartShuffleConfig({ preferHighRated: value })}
                  trackColor={{ false: Colors.dark.surfaceHighlight, true: Colors.dark.accent }}
                  thumbColor={Colors.dark.text}
                />
              </View>
              <View style={styles.cloudSettingRow}>
                <Text style={styles.cloudSettingLabel}>Mood Aware</Text>
                <Switch
                  value={smartShuffleConfig.moodAware}
                  onValueChange={(value) => updateSmartShuffleConfig({ moodAware: value })}
                  trackColor={{ false: Colors.dark.surfaceHighlight, true: Colors.dark.accent }}
                  thumbColor={Colors.dark.text}
                />
              </View>
            </View>

            <Text style={styles.energyFlowTitle}>Energy Flow</Text>
            <View style={styles.energyFlowOptions}>
              {[
                { key: 'maintain', label: 'Maintain' },
                { key: 'gradual_increase', label: 'Build Up' },
                { key: 'gradual_decrease', label: 'Wind Down' },
                { key: 'random', label: 'Random' },
              ].map(option => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.energyFlowOption,
                    smartShuffleConfig.energyFlow === option.key && styles.energyFlowOptionActive
                  ]}
                  onPress={() => updateSmartShuffleConfig({ energyFlow: option.key as 'maintain' | 'gradual_increase' | 'gradual_decrease' | 'random' })}
                >
                  <Text style={[
                    styles.energyFlowOptionText,
                    smartShuffleConfig.energyFlow === option.key && styles.energyFlowOptionTextActive
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.dark.text,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.dark.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  sectionContent: {
    backgroundColor: Colors.dark.surface,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.dark.accentGlow,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  settingIconDanger: {
    backgroundColor: 'rgba(239, 83, 80, 0.15)',
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  settingTitleDanger: {
    color: '#EF5350',
  },
  settingSubtitle: {
    fontSize: 12,
    color: Colors.dark.textTertiary,
    marginTop: 2,
  },
  settingValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  settingValueText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.dark.accent,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.dark.textTertiary,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.dark.border,
  },
  listeningStatsContainer: {
    backgroundColor: Colors.dark.surface,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    marginTop: 12,
  },
  listeningStatsTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.dark.text,
    marginBottom: 16,
  },
  listeningStatsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  listeningStat: {
    flex: 1,
    backgroundColor: Colors.dark.surfaceHighlight,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  listeningStatValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.dark.accent,
  },
  listeningStatLabel: {
    fontSize: 11,
    color: Colors.dark.textTertiary,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.dark.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.dark.textTertiary,
    marginBottom: 20,
  },
  cloudOptions: {
    gap: 8,
    marginBottom: 20,
  },
  cloudOption: {
    backgroundColor: Colors.dark.surfaceHighlight,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  cloudOptionActive: {
    backgroundColor: Colors.dark.accent,
  },
  cloudOptionText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.dark.textSecondary,
  },
  cloudOptionTextActive: {
    color: Colors.dark.background,
  },
  cloudSettings: {
    gap: 4,
  },
  cloudSettingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  cloudSettingLabel: {
    fontSize: 15,
    color: Colors.dark.text,
  },
  energyFlowTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.dark.text,
    marginTop: 16,
    marginBottom: 12,
  },
  energyFlowOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  energyFlowOption: {
    backgroundColor: Colors.dark.surfaceHighlight,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  energyFlowOptionActive: {
    backgroundColor: Colors.dark.accent,
  },
  energyFlowOptionText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.dark.textSecondary,
  },
  energyFlowOptionTextActive: {
    color: Colors.dark.background,
  },
  scanResultContent: {
    backgroundColor: Colors.dark.surface,
    marginHorizontal: 32,
    marginTop: 'auto',
    marginBottom: 'auto',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
  },
  scanResultIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.dark.accentGlow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  scanResultTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    marginBottom: 8,
  },
  scanResultText: {
    fontSize: 15,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  scanResultButton: {
    backgroundColor: Colors.dark.accent,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
  },
  scanResultButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.dark.background,
  },
});
