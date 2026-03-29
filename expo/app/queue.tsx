import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Trash2, Play, GripVertical, History, Clock } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { QueueItem, Track } from '@/types/audio';

export default function QueueScreen() {
  const router = useRouter();
  const { queue, history, currentTrack, removeFromQueue, clearQueue, playTrack, isPlaying } = useAudioPlayer();

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderQueueItem = ({ item, index }: { item: QueueItem; index: number }) => (
    <View style={styles.queueItem}>
      <View style={styles.dragHandle}>
        <GripVertical size={20} color={Colors.dark.textTertiary} />
      </View>
      <Image source={{ uri: item.track.albumArt }} style={styles.itemArtwork} />
      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle} numberOfLines={1}>{item.track.title}</Text>
        <Text style={styles.itemArtist} numberOfLines={1}>{item.track.artist}</Text>
      </View>
      <Text style={styles.itemDuration}>{formatDuration(item.track.duration)}</Text>
      <TouchableOpacity 
        style={styles.removeButton}
        onPress={() => removeFromQueue(index)}
      >
        <Trash2 size={18} color={Colors.dark.error} />
      </TouchableOpacity>
    </View>
  );

  const renderHistoryItem = ({ item }: { item: Track }) => (
    <TouchableOpacity style={styles.historyItem} onPress={() => playTrack(item)}>
      <Image source={{ uri: item.albumArt }} style={styles.historyArtwork} />
      <View style={styles.historyInfo}>
        <Text style={styles.historyTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.historyArtist} numberOfLines={1}>{item.artist}</Text>
      </View>
      <TouchableOpacity style={styles.playHistoryButton} onPress={() => playTrack(item)}>
        <Play size={16} color={Colors.dark.background} fill={Colors.dark.background} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={28} color={Colors.dark.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Queue</Text>
        <TouchableOpacity 
          style={styles.clearButton}
          onPress={clearQueue}
          disabled={queue.length === 0}
        >
          <Text style={[styles.clearText, queue.length === 0 && styles.clearTextDisabled]}>
            Clear
          </Text>
        </TouchableOpacity>
      </View>

      {currentTrack && (
        <View style={styles.nowPlayingSection}>
          <View style={styles.sectionHeader}>
            <Play size={16} color={Colors.dark.accent} />
            <Text style={styles.sectionTitle}>Now Playing</Text>
          </View>
          <View style={styles.nowPlayingCard}>
            <Image source={{ uri: currentTrack.albumArt }} style={styles.nowPlayingArtwork} />
            <View style={styles.nowPlayingInfo}>
              <Text style={styles.nowPlayingTitle} numberOfLines={1}>{currentTrack.title}</Text>
              <Text style={styles.nowPlayingArtist} numberOfLines={1}>{currentTrack.artist}</Text>
            </View>
            <View style={styles.nowPlayingIndicator}>
              {isPlaying && (
                <View style={styles.playingBars}>
                  <View style={[styles.bar, styles.bar1]} />
                  <View style={[styles.bar, styles.bar2]} />
                  <View style={[styles.bar, styles.bar3]} />
                </View>
              )}
            </View>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Clock size={16} color={Colors.dark.textSecondary} />
          <Text style={styles.sectionTitle}>Up Next</Text>
          <Text style={styles.sectionCount}>{queue.length} tracks</Text>
        </View>
        
        {queue.length > 0 ? (
          <FlatList
            data={queue}
            keyExtractor={(item, index) => `queue-${item.track.id}-${index}`}
            renderItem={renderQueueItem}
            style={styles.queueList}
            contentContainerStyle={styles.queueListContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Queue is empty</Text>
            <Text style={styles.emptySubtext}>Add tracks from your library</Text>
          </View>
        )}
      </View>

      {history.length > 0 && (
        <View style={styles.historySection}>
          <View style={styles.sectionHeader}>
            <History size={16} color={Colors.dark.textSecondary} />
            <Text style={styles.sectionTitle}>Recently Played</Text>
          </View>
          <FlatList
            data={history.slice(0, 5)}
            keyExtractor={(item, index) => `history-${item.id}-${index}`}
            renderItem={renderHistoryItem}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.historyList}
          />
        </View>
      )}
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
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  clearText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.error,
  },
  clearTextDisabled: {
    opacity: 0.4,
  },
  nowPlayingSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.textSecondary,
    flex: 1,
  },
  sectionCount: {
    fontSize: 12,
    color: Colors.dark.textTertiary,
  },
  nowPlayingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.accentGlow,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.dark.accent,
    gap: 12,
  },
  nowPlayingArtwork: {
    width: 56,
    height: 56,
    borderRadius: 12,
  },
  nowPlayingInfo: {
    flex: 1,
  },
  nowPlayingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.dark.text,
    marginBottom: 2,
  },
  nowPlayingArtist: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
  },
  nowPlayingIndicator: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playingBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 20,
  },
  bar: {
    width: 4,
    backgroundColor: Colors.dark.accent,
    borderRadius: 2,
  },
  bar1: {
    height: 10,
  },
  bar2: {
    height: 18,
  },
  bar3: {
    height: 14,
  },
  section: {
    flex: 1,
    paddingHorizontal: 16,
  },
  queueList: {
    flex: 1,
  },
  queueListContent: {
    paddingBottom: 20,
  },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    gap: 10,
  },
  dragHandle: {
    padding: 4,
  },
  itemArtwork: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 2,
  },
  itemArtist: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  itemDuration: {
    fontSize: 12,
    color: Colors.dark.textTertiary,
  },
  removeButton: {
    padding: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.textSecondary,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.dark.textTertiary,
  },
  historySection: {
    paddingBottom: 20,
  },
  historyList: {
    paddingHorizontal: 16,
  },
  historyItem: {
    width: 140,
    marginRight: 12,
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  historyArtwork: {
    width: 140,
    height: 100,
  },
  historyInfo: {
    padding: 10,
  },
  historyTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 2,
  },
  historyArtist: {
    fontSize: 11,
    color: Colors.dark.textTertiary,
  },
  playHistoryButton: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.dark.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
