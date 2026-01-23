import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Search, X, Check, Music2 } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { Track, Playlist } from '@/types/audio';
import { useLibrary } from '@/contexts/LibraryContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AddSongsModalProps {
  visible: boolean;
  playlist: Playlist | null;
  onClose: () => void;
  onSongsAdded?: (count: number) => void;
}

export default function AddSongsModal({
  visible,
  playlist,
  onClose,
  onSongsAdded,
}: AddSongsModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const { tracks, addTracksToPlaylist } = useLibrary();

  useEffect(() => {
    if (visible) {
      setSelectedIds(new Set());
      setSearchQuery('');
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

  const existingTrackIds = useMemo(() => {
    if (!playlist) return new Set<string>();
    return new Set(playlist.tracks.map(t => t.id));
  }, [playlist]);

  const availableTracks = useMemo(() => {
    let filtered = tracks.filter(t => !existingTrackIds.has(t.id));

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        t =>
          t.title.toLowerCase().includes(query) ||
          t.artist.toLowerCase().includes(query) ||
          t.album.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [tracks, existingTrackIds, searchQuery]);

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

  const toggleTrackSelection = (trackId: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(trackId)) {
        newSet.delete(trackId);
      } else {
        newSet.add(trackId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === availableTracks.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(availableTracks.map(t => t.id)));
    }
  };

  const handleAddSongs = async () => {
    if (!playlist || selectedIds.size === 0) return;

    await addTracksToPlaylist(playlist.id, Array.from(selectedIds));
    
    if (onSongsAdded) {
      onSongsAdded(selectedIds.size);
    }
    
    handleClose();
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderTrackItem = ({ item }: { item: Track }) => {
    const isSelected = selectedIds.has(item.id);

    return (
      <TouchableOpacity
        style={[styles.trackItem, isSelected && styles.trackItemSelected]}
        onPress={() => toggleTrackSelection(item.id)}
        activeOpacity={0.7}
      >
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Check size={16} color={Colors.dark.background} />}
        </View>
        <Image source={{ uri: item.albumArt }} style={styles.trackArtwork} />
        <View style={styles.trackInfo}>
          <Text style={styles.trackTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.trackArtist} numberOfLines={1}>
            {item.artist} • {formatDuration(item.duration)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Music2 size={40} color={Colors.dark.textTertiary} />
      </View>
      <Text style={styles.emptyTitle}>
        {searchQuery ? 'No songs found' : 'All songs already added'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery
          ? `No songs match "${searchQuery}"`
          : 'All available songs are already in this playlist'}
      </Text>
    </View>
  );

  if (!playlist) return null;

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

          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color={Colors.dark.textSecondary} />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Add Songs</Text>
              <Text style={styles.headerSubtitle}>to {playlist.name}</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.addButton,
                selectedIds.size === 0 && styles.addButtonDisabled,
              ]}
              onPress={handleAddSongs}
              disabled={selectedIds.size === 0}
            >
              <Text
                style={[
                  styles.addButtonText,
                  selectedIds.size === 0 && styles.addButtonTextDisabled,
                ]}
              >
                Add ({selectedIds.size})
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Search size={20} color={Colors.dark.textTertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search songs..."
              placeholderTextColor={Colors.dark.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {availableTracks.length > 0 && (
            <View style={styles.selectionBar}>
              <Text style={styles.selectionText}>
                {availableTracks.length} songs available
              </Text>
              <TouchableOpacity onPress={handleSelectAll}>
                <Text style={styles.selectAllText}>
                  {selectedIds.size === availableTracks.length
                    ? 'Deselect All'
                    : 'Select All'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <FlatList
            data={availableTracks}
            keyExtractor={item => item.id}
            renderItem={renderTrackItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyState}
          />
        </Animated.View>
      </View>
    </Modal>
  );
}

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
    backgroundColor: Colors.dark.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.85,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.dark.textTertiary,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  addButton: {
    backgroundColor: Colors.dark.accent,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addButtonDisabled: {
    backgroundColor: Colors.dark.surface,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.dark.background,
  },
  addButtonTextDisabled: {
    color: Colors.dark.textTertiary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 14,
    borderRadius: 12,
    height: 44,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.dark.text,
  },
  selectionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  selectionText: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
  },
  selectAllText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.dark.accent,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
    gap: 12,
  },
  trackItemSelected: {
    backgroundColor: Colors.dark.accentGlow,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.dark.textTertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.dark.accent,
    borderColor: Colors.dark.accent,
  },
  trackArtwork: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.dark.text,
    marginBottom: 4,
  },
  trackArtist: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.dark.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.dark.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.dark.textTertiary,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
