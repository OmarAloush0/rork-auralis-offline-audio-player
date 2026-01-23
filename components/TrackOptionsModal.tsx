import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  ScrollView,
  Platform,
  Linking,
  Share,
  Alert,
} from 'react-native';
import {
  Heart,
  Clock,
  Volume2,
  User,
  Bell,
  FileEdit,
  EyeOff,
  Trash2,
  ListPlus,
  PlaySquare,
  ListMusic,
  ListMinus,
  Youtube,
  Share2,
  Edit3,
  Image as ImageIcon,
  Info,
  X,
} from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { Track } from '@/types/audio';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { useLibrary } from '@/contexts/LibraryContext';
import { useRouter } from 'expo-router';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface TrackOptionsModalProps {
  visible: boolean;
  track: Track | null;
  onClose: () => void;
  onSleepTimer?: () => void;
}

interface OptionItem {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  color?: string;
}

export default function TrackOptionsModal({
  visible,
  track,
  onClose,
  onSleepTimer,
}: TrackOptionsModalProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);
  
  const router = useRouter();
  const { addToQueue } = useAudioPlayer();
  const { toggleFavorite, favorites } = useLibrary();

  const isFavorite = track ? favorites.some(f => f.id === track.id) : false;

  useEffect(() => {
    if (visible) {
      setCurrentPage(0);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 25,
          stiffness: 300,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handleFavorite = () => {
    if (track) {
      toggleFavorite(track);
    }
    handleClose();
  };

  const handleSleepTimer = () => {
    handleClose();
    if (onSleepTimer) {
      onSleepTimer();
    }
  };

  const handleVolumeBooster = () => {
    handleClose();
    router.push('/volume-booster');
  };

  const handleGoToArtist = () => {
    handleClose();
  };

  const handleAddToQueue = () => {
    if (track) {
      addToQueue(track);
    }
    handleClose();
  };

  const handlePlayNext = () => {
    if (track) {
      addToQueue(track);
    }
    handleClose();
  };

  const handleSearchYoutube = () => {
    if (track) {
      const query = encodeURIComponent(`${track.title} ${track.artist}`);
      Linking.openURL(`https://www.youtube.com/results?search_query=${query}`);
    }
    handleClose();
  };

  const handleShare = async () => {
    if (track) {
      try {
        await Share.share({
          message: `Check out "${track.title}" by ${track.artist}`,
        });
      } catch (error) {
        console.log('Share error:', error);
      }
    }
    handleClose();
  };

  const page1Options: OptionItem[] = [
    {
      icon: <Heart size={24} color={isFavorite ? Colors.dark.error : Colors.dark.text} fill={isFavorite ? Colors.dark.error : 'transparent'} />,
      label: 'Favorite',
      onPress: handleFavorite,
    },
    {
      icon: <Clock size={24} color={Colors.dark.text} />,
      label: 'Sleep Timer',
      onPress: handleSleepTimer,
    },
    {
      icon: (
        <View style={styles.volumeIconContainer}>
          <Volume2 size={24} color={Colors.dark.text} />
          <View style={styles.maxBadge}>
            <Text style={styles.maxText}>MAX</Text>
          </View>
        </View>
      ),
      label: 'Volume Booster',
      onPress: handleVolumeBooster,
    },
    {
      icon: <User size={24} color={Colors.dark.text} />,
      label: 'Go to artist',
      onPress: handleGoToArtist,
    },
  ];

  const showFeatureNotice = (feature: string) => {
    Alert.alert(
      'Coming Soon',
      `${feature} will be available in a future update.`,
      [{ text: 'OK' }]
    );
    handleClose();
  };

  const page1Options2: OptionItem[] = [
    {
      icon: <Bell size={24} color={Colors.dark.text} />,
      label: 'Set as ringtone',
      onPress: () => showFeatureNotice('Set as ringtone'),
    },
    {
      icon: <FileEdit size={24} color={Colors.dark.text} />,
      label: 'Edit Tag',
      onPress: () => showFeatureNotice('Tag editing'),
    },
    {
      icon: <EyeOff size={24} color={Colors.dark.text} />,
      label: 'Hide Songs',
      onPress: () => showFeatureNotice('Hide songs'),
    },
    {
      icon: <Trash2 size={24} color={Colors.dark.text} />,
      label: 'Delete from device',
      onPress: () => showFeatureNotice('Delete from device'),
    },
  ];

  const page2Options: OptionItem[] = [
    {
      icon: <PlaySquare size={24} color={Colors.dark.text} />,
      label: 'Play next',
      onPress: handlePlayNext,
    },
    {
      icon: <ListPlus size={24} color={Colors.dark.text} />,
      label: 'Add to playlist',
      onPress: handleClose,
    },
    {
      icon: <ListMusic size={24} color={Colors.dark.text} />,
      label: 'Add to playing queue',
      onPress: handleAddToQueue,
    },
    {
      icon: <ListMinus size={24} color={Colors.dark.text} />,
      label: 'Remove from playlist',
      onPress: handleClose,
    },
  ];

  const page2Options2: OptionItem[] = [
    {
      icon: <Youtube size={24} color={Colors.dark.text} />,
      label: 'Search in Youtube',
      onPress: handleSearchYoutube,
    },
    {
      icon: <Share2 size={24} color={Colors.dark.text} />,
      label: 'Share',
      onPress: handleShare,
    },
    {
      icon: <Edit3 size={24} color={Colors.dark.text} />,
      label: 'Rename',
      onPress: () => showFeatureNotice('Rename track'),
    },
    {
      icon: <ImageIcon size={24} color={Colors.dark.text} />,
      label: 'Change Cover',
      onPress: () => showFeatureNotice('Change cover'),
    },
  ];

  const renderOptionButton = (option: OptionItem, index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.optionButton}
      onPress={option.onPress}
      activeOpacity={0.7}
    >
      <View style={styles.optionIconContainer}>
        {option.icon}
      </View>
      <Text style={styles.optionLabel} numberOfLines={2}>
        {option.label}
      </Text>
    </TouchableOpacity>
  );

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const width = event.nativeEvent.layoutMeasurement.width;
    const page = Math.round(offsetX / width);
    setCurrentPage(page);
  };

  if (!track) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: backdropAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.7],
              }),
            },
          ]}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={handleClose}
            activeOpacity={1}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.bottomSheet,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.handle} />

          <View style={styles.trackHeader}>
            <Image source={{ uri: track.albumArt }} style={styles.trackArtwork} />
            <View style={styles.trackInfo}>
              <Text style={styles.trackTitle} numberOfLines={1}>
                {track.title}
              </Text>
              <Text style={styles.trackArtist} numberOfLines={1}>
                {track.artist} - {track.album}
              </Text>
            </View>
            <TouchableOpacity style={styles.infoButton} onPress={handleClose}>
              <Info size={22} color={Colors.dark.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            style={styles.pagesContainer}
          >
            <View style={styles.page}>
              <View style={styles.optionsRow}>
                {page1Options.map(renderOptionButton)}
              </View>
              <View style={styles.optionsRow}>
                {page1Options2.map(renderOptionButton)}
              </View>
            </View>

            <View style={styles.page}>
              <View style={styles.optionsRow}>
                {page2Options.map(renderOptionButton)}
              </View>
              <View style={styles.optionsRow}>
                {page2Options2.map(renderOptionButton)}
              </View>
            </View>
          </ScrollView>

          <View style={styles.pagination}>
            <View style={[styles.dot, currentPage === 0 && styles.activeDot]} />
            <View style={[styles.dot, currentPage === 1 && styles.activeDot]} />
          </View>

          <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
            <Text style={styles.cancelText}>CANCEL</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  bottomSheet: {
    backgroundColor: '#1E3A5F',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.dark.textTertiary,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  trackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  trackArtwork: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.dark.text,
    marginBottom: 4,
  },
  trackArtist: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
  },
  infoButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pagesContainer: {
    maxHeight: 220,
  },
  page: {
    width: SCREEN_WIDTH,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  optionButton: {
    alignItems: 'center',
    width: (SCREEN_WIDTH - 32) / 4,
  },
  optionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionLabel: {
    fontSize: 11,
    color: Colors.dark.text,
    textAlign: 'center',
    lineHeight: 14,
  },
  volumeIconContainer: {
    position: 'relative',
  },
  maxBadge: {
    position: 'absolute',
    top: -8,
    right: -12,
    backgroundColor: Colors.dark.accent,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  maxText: {
    fontSize: 8,
    fontWeight: '700' as const,
    color: Colors.dark.background,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
  },
  dot: {
    width: 8,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  activeDot: {
    width: 16,
    backgroundColor: Colors.dark.accent,
  },
  cancelButton: {
    marginHorizontal: 20,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.dark.textSecondary,
    letterSpacing: 1,
  },
});
