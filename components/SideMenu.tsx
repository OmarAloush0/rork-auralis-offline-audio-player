import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Switch,
  Modal,
} from 'react-native';
import {
  X,
  Sliders,
  Volume2,
  Volume1,
  Gauge,
  Headphones,
  Zap,
  Moon,
  Sun,
  Vibrate,
  Timer,
  Shuffle,
  Brain,
  TrendingUp,
  Database,
  Cloud,
  Shield,
  Repeat,
  Music2,
  Radio,
  Mic2,
  SlidersHorizontal,
  Waves,
  Activity,
  Disc,
  Heart,
  Star,
  Bell,
  Lock,
  Info,
  ChevronRight,
  Settings,

} from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useRouter } from 'expo-router';

interface SideMenuProps {
  visible: boolean;
  onClose: () => void;
}

interface MenuItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (value: boolean) => void;
  badge?: string;
  premium?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MENU_WIDTH = SCREEN_WIDTH * 0.85;

function MenuItem({
  icon,
  title,
  subtitle,
  onPress,
  toggle,
  toggleValue,
  onToggle,
  badge,
  premium,
}: MenuItemProps) {
  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      disabled={toggle}
      activeOpacity={toggle ? 1 : 0.7}
    >
      <View style={styles.menuItemIcon}>{icon}</View>
      <View style={styles.menuItemContent}>
        <View style={styles.menuItemTitleRow}>
          <Text style={styles.menuItemTitle}>{title}</Text>

          {badge && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          )}
        </View>
        {subtitle && <Text style={styles.menuItemSubtitle}>{subtitle}</Text>}
      </View>
      {toggle ? (
        <Switch
          value={toggleValue}
          onValueChange={onToggle}
          trackColor={{ false: Colors.dark.surfaceHighlight, true: Colors.dark.accent }}
          thumbColor={Colors.dark.text}
        />
      ) : (
        <ChevronRight size={18} color={Colors.dark.textTertiary} />
      )}
    </TouchableOpacity>
  );
}

function MenuSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

export default function SideMenu({ visible, onClose }: SideMenuProps) {
  const router = useRouter();
  const slideAnim = useRef(new Animated.Value(-MENU_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [gaplessPlayback, setGaplessPlayback] = React.useState(true);
  const [crossfade, setCrossfade] = React.useState(true);
  const [loudnessNorm, setLoudnessNorm] = React.useState(true);
  const [bassBoost, setBassBoost] = React.useState(false);
  const [stereoWidening, setStereoWidening] = React.useState(false);
  const [bitPerfect, setBitPerfect] = React.useState(false);
  const [haptics, setHaptics] = React.useState(true);
  const [silenceSkip, setSilenceSkip] = React.useState(false);
  const [replayGain, setReplayGain] = React.useState(true);
  const [autoMix, setAutoMix] = React.useState(false);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -MENU_WIDTH,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, fadeAnim]);

  const handleNavigate = (route: string) => {
    onClose();
    setTimeout(() => {
      router.push(route as any);
    }, 300);
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <View style={styles.container}>
        <Animated.View
          style={[styles.overlay, { opacity: fadeAnim }]}
        >
          <TouchableOpacity style={styles.overlayTouch} onPress={onClose} activeOpacity={1} />
        </Animated.View>

        <Animated.View
          style={[styles.menu, { transform: [{ translateX: slideAnim }] }]}
        >
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.logoContainer}>
                <Music2 size={28} color={Colors.dark.accent} />
              </View>
              <View>
                <Text style={styles.appName}>AURALIS</Text>
                <Text style={styles.appTagline}>Audio Preferences</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={Colors.dark.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <MenuSection title="Audio Engine">
              <MenuItem
                icon={<Sliders size={20} color={Colors.dark.accent} />}
                title="Equalizer"
                subtitle="10-band parametric EQ"
                onPress={() => handleNavigate('/equalizer')}
              />
              <MenuItem
                icon={<Volume1 size={20} color={Colors.dark.accent} />}
                title="Volume Booster"
                subtitle="Boost up to 200%"
                onPress={() => handleNavigate('/volume-booster')}
              />
              <MenuItem
                icon={<Waves size={20} color={Colors.dark.accent} />}
                title="Bass Boost"
                subtitle="Enhance low frequencies"
                toggle
                toggleValue={bassBoost}
                onToggle={setBassBoost}
              />
              <MenuItem
                icon={<SlidersHorizontal size={20} color={Colors.dark.accent} />}
                title="Stereo Widening"
                subtitle="Expand stereo field"
                toggle
                toggleValue={stereoWidening}
                onToggle={setStereoWidening}
              />
              <MenuItem
                icon={<Activity size={20} color={Colors.dark.accent} />}
                title="Reverb & Effects"
                subtitle="Room simulation"
                onPress={() => {}}
                premium
              />
            </MenuSection>

            <MenuSection title="Playback">
              <MenuItem
                icon={<Gauge size={20} color={Colors.dark.accent} />}
                title="Gapless Playback"
                subtitle="Seamless transitions"
                toggle
                toggleValue={gaplessPlayback}
                onToggle={setGaplessPlayback}
              />
              <MenuItem
                icon={<Zap size={20} color={Colors.dark.accent} />}
                title="Crossfade"
                subtitle="Smooth fade between tracks"
                toggle
                toggleValue={crossfade}
                onToggle={setCrossfade}
              />
              <MenuItem
                icon={<Repeat size={20} color={Colors.dark.accent} />}
                title="Auto-Mix"
                subtitle="DJ-style transitions"
                toggle
                toggleValue={autoMix}
                onToggle={setAutoMix}
                premium
              />
              <MenuItem
                icon={<Mic2 size={20} color={Colors.dark.accent} />}
                title="Silence Skip"
                subtitle="Skip silent portions"
                toggle
                toggleValue={silenceSkip}
                onToggle={setSilenceSkip}
              />
              <MenuItem
                icon={<Timer size={20} color={Colors.dark.accent} />}
                title="Sleep Timer"
                subtitle="Auto-stop playback"
                onPress={() => {}}
              />
            </MenuSection>

            <MenuSection title="Audio Quality">
              <MenuItem
                icon={<Volume2 size={20} color={Colors.dark.accent} />}
                title="Loudness Normalization"
                subtitle="Balance volume levels"
                toggle
                toggleValue={loudnessNorm}
                onToggle={setLoudnessNorm}
              />
              <MenuItem
                icon={<TrendingUp size={20} color={Colors.dark.accent} />}
                title="ReplayGain"
                subtitle="Track volume adjustment"
                toggle
                toggleValue={replayGain}
                onToggle={setReplayGain}
              />
              <MenuItem
                icon={<Disc size={20} color={Colors.dark.accent} />}
                title="Bit-Perfect Mode"
                subtitle="No audio processing"
                toggle
                toggleValue={bitPerfect}
                onToggle={setBitPerfect}
              />
              <MenuItem
                icon={<Headphones size={20} color={Colors.dark.accent} />}
                title="Headphone Profiles"
                subtitle="Device-specific tuning"
                onPress={() => {}}
                badge="12 profiles"
              />
              <MenuItem
                icon={<Radio size={20} color={Colors.dark.accent} />}
                title="Output Device"
                subtitle="Speaker"
                onPress={() => {}}
              />
            </MenuSection>

            <MenuSection title="Smart Features">
              <MenuItem
                icon={<Brain size={20} color={Colors.dark.accent} />}
                title="Smart Shuffle"
                subtitle="Behavior-based selection"
                onPress={() => {}}
              />
              <MenuItem
                icon={<Heart size={20} color={Colors.dark.accent} />}
                title="Mood Analysis"
                subtitle="Auto-detect track moods"
                onPress={() => {}}
              />
              <MenuItem
                icon={<Star size={20} color={Colors.dark.accent} />}
                title="Auto Playlists"
                subtitle="AI-generated collections"
                onPress={() => {}}
              />
              <MenuItem
                icon={<TrendingUp size={20} color={Colors.dark.accent} />}
                title="Listening Insights"
                subtitle="Your music stats"
                onPress={() => {}}
              />
            </MenuSection>

            <MenuSection title="Library">
              <MenuItem
                icon={<Database size={20} color={Colors.dark.accent} />}
                title="Scan Library"
                subtitle="Find new music"
                onPress={() => {}}
              />
              <MenuItem
                icon={<Cloud size={20} color={Colors.dark.accent} />}
                title="Cloud Sync"
                subtitle="Backup & restore"
                onPress={() => {}}
              />
              <MenuItem
                icon={<Shield size={20} color={Colors.dark.accent} />}
                title="Backup Library"
                subtitle="Export playlists & data"
                onPress={() => {}}
              />
            </MenuSection>

            <MenuSection title="Appearance">
              <MenuItem
                icon={<Moon size={20} color={Colors.dark.accent} />}
                title="Theme"
                subtitle="Dark mode"
                onPress={() => {}}
              />
              <MenuItem
                icon={<Vibrate size={20} color={Colors.dark.accent} />}
                title="Haptic Feedback"
                subtitle="Vibration on tap"
                toggle
                toggleValue={haptics}
                onToggle={setHaptics}
              />
              <MenuItem
                icon={<Bell size={20} color={Colors.dark.accent} />}
                title="Notifications"
                subtitle="Playback alerts"
                onPress={() => {}}
              />
            </MenuSection>

            <MenuSection title="More">
              <MenuItem
                icon={<Lock size={20} color={Colors.dark.accent} />}
                title="Privacy"
                subtitle="Data & permissions"
                onPress={() => {}}
              />
              <MenuItem
                icon={<Settings size={20} color={Colors.dark.accent} />}
                title="All Settings"
                subtitle="Full settings menu"
                onPress={() => {
                  onClose();
                  router.push('/(tabs)/settings');
                }}
              />
              <MenuItem
                icon={<Info size={20} color={Colors.dark.accent} />}
                title="About AURALIS"
                subtitle="Version 1.0.0"
                onPress={() => {}}
              />
            </MenuSection>



            <View style={{ height: 40 }} />
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  overlayTouch: {
    flex: 1,
  },
  menu: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: MENU_WIDTH,
    backgroundColor: Colors.dark.background,
    borderRightWidth: 1,
    borderRightColor: Colors.dark.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
    backgroundColor: Colors.dark.surface,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.dark.accentGlow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appName: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.dark.accent,
    letterSpacing: 1,
  },
  appTagline: {
    fontSize: 12,
    color: Colors.dark.textTertiary,
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.dark.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sectionContent: {
    backgroundColor: Colors.dark.surface,
    marginHorizontal: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  menuItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.dark.accentGlow,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  menuItemTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  menuItemSubtitle: {
    fontSize: 12,
    color: Colors.dark.textTertiary,
    marginTop: 2,
  },
  badge: {
    backgroundColor: Colors.dark.accent,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.dark.background,
  },

});
