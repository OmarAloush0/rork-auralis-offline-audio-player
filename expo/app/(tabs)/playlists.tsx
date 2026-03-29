import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Sparkles, Play, MoreVertical, X, Zap, Moon, Dumbbell, BookOpen, Car, Clock, Heart, Music2, Trash2, Edit2, ListPlus } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useLibrary } from '@/contexts/LibraryContext';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { Playlist, Track } from '@/types/audio';
import AddSongsModal from '@/components/AddSongsModal';

const smartPlaylistIcons: Record<string, React.ReactNode> = {
  'Driving Vibes': <Car size={20} color={Colors.dark.accent} />,
  'Late Night Chill': <Moon size={20} color="#8B5CF6" />,
  'Workout Mix': <Dumbbell size={20} color="#EF5350" />,
  'Focus Mode': <BookOpen size={20} color="#4CAF50" />,
  'Recently Added': <Clock size={20} color="#2196F3" />,
  'Most Played': <Heart size={20} color="#E91E63" />,
};

export default function PlaylistsScreen() {
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [playlistOptionsVisible, setPlaylistOptionsVisible] = useState(false);
  const [addSongsModalVisible, setAddSongsModalVisible] = useState(false);
  const [playlistDetailVisible, setPlaylistDetailVisible] = useState(false);
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [renameText, setRenameText] = useState('');
  
  const { playlists, smartPlaylists, createPlaylist, deletePlaylist, removeFromPlaylist, tracks, updatePlaylist } = useLibrary();
  const { playTrack } = useAudioPlayer();

  const userPlaylists = playlists.filter(p => !p.isSmartPlaylist);

  const handlePlayPlaylist = (playlist: Playlist) => {
    if (playlist.tracks.length > 0) {
      playTrack(playlist.tracks[0]);
    }
  };

  const handleCreatePlaylist = async () => {
    if (newPlaylistName.trim()) {
      const newPlaylist = await createPlaylist(newPlaylistName.trim());
      setNewPlaylistName('');
      setCreateModalVisible(false);
      setSelectedPlaylist(newPlaylist);
      setAddSongsModalVisible(true);
    }
  };

  const handleOpenPlaylistOptions = (playlist: Playlist) => {
    setSelectedPlaylist(playlist);
    setPlaylistOptionsVisible(true);
  };

  const handleDeletePlaylist = () => {
    if (selectedPlaylist) {
      Alert.alert(
        'Delete Playlist',
        `Are you sure you want to delete "${selectedPlaylist.name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              deletePlaylist(selectedPlaylist.id);
              setPlaylistOptionsVisible(false);
              setSelectedPlaylist(null);
            },
          },
        ]
      );
    }
  };

  const handleAddSongsToPlaylist = () => {
    setPlaylistOptionsVisible(false);
    setAddSongsModalVisible(true);
  };

  const handleOpenPlaylistDetail = (playlist: Playlist) => {
    setSelectedPlaylist(playlist);
    setPlaylistDetailVisible(true);
  };

  const handleRemoveTrackFromPlaylist = (trackId: string) => {
    if (selectedPlaylist) {
      removeFromPlaylist(selectedPlaylist.id, trackId);
      const updatedPlaylist = {
        ...selectedPlaylist,
        tracks: selectedPlaylist.tracks.filter(t => t.id !== trackId),
        trackCount: selectedPlaylist.trackCount - 1,
      };
      setSelectedPlaylist(updatedPlaylist);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Music2 size={48} color={Colors.dark.accent} />
      </View>
      <Text style={styles.emptyTitle}>No Playlists Yet</Text>
      <Text style={styles.emptySubtitle}>
        Create your own custom playlists to organize your music. Smart playlists will appear when you have songs in your library.
      </Text>
      <TouchableOpacity 
        style={styles.createFirstButton}
        onPress={() => setCreateModalVisible(true)}
      >
        <Plus size={20} color={Colors.dark.background} />
        <Text style={styles.createFirstText}>Create Playlist</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPlaylistDetail = () => {
    if (!selectedPlaylist) return null;

    return (
      <Modal
        visible={playlistDetailVisible}
        animationType="slide"
        onRequestClose={() => setPlaylistDetailVisible(false)}
      >
        <SafeAreaView style={styles.detailContainer} edges={['top']}>
          <View style={styles.detailHeader}>
            <TouchableOpacity 
              onPress={() => setPlaylistDetailVisible(false)}
              style={styles.detailBackButton}
            >
              <X size={24} color={Colors.dark.text} />
            </TouchableOpacity>
            <Text style={styles.detailTitle} numberOfLines={1}>{selectedPlaylist.name}</Text>
            <TouchableOpacity 
              onPress={() => {
                setPlaylistDetailVisible(false);
                setAddSongsModalVisible(true);
              }}
              style={styles.detailAddButton}
            >
              <Plus size={24} color={Colors.dark.accent} />
            </TouchableOpacity>
          </View>

          <View style={styles.detailInfo}>
            {selectedPlaylist.artwork ? (
              <Image source={{ uri: selectedPlaylist.artwork }} style={styles.detailArtwork} />
            ) : (
              <View style={styles.detailArtworkPlaceholder}>
                <Music2 size={48} color={Colors.dark.textTertiary} />
              </View>
            )}
            <Text style={styles.detailTrackCount}>{selectedPlaylist.trackCount} tracks</Text>
            {selectedPlaylist.tracks.length > 0 && (
              <TouchableOpacity 
                style={styles.playAllButton}
                onPress={() => handlePlayPlaylist(selectedPlaylist)}
              >
                <Play size={20} color={Colors.dark.background} fill={Colors.dark.background} />
                <Text style={styles.playAllText}>Play All</Text>
              </TouchableOpacity>
            )}
          </View>

          {selectedPlaylist.tracks.length === 0 ? (
            <View style={styles.emptyPlaylistDetail}>
              <Text style={styles.emptyPlaylistText}>No songs in this playlist</Text>
              <TouchableOpacity 
                style={styles.addSongsButton}
                onPress={() => {
                  setPlaylistDetailVisible(false);
                  setAddSongsModalVisible(true);
                }}
              >
                <ListPlus size={20} color={Colors.dark.background} />
                <Text style={styles.addSongsButtonText}>Add Songs</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView style={styles.detailTrackList} showsVerticalScrollIndicator={false}>
              {selectedPlaylist.tracks.map((track, index) => (
                <TouchableOpacity 
                  key={track.id}
                  style={styles.detailTrackItem}
                  onPress={() => playTrack(track)}
                >
                  <Text style={styles.detailTrackIndex}>{index + 1}</Text>
                  <Image source={{ uri: track.albumArt }} style={styles.detailTrackArtwork} />
                  <View style={styles.detailTrackInfo}>
                    <Text style={styles.detailTrackTitle} numberOfLines={1}>{track.title}</Text>
                    <Text style={styles.detailTrackArtist} numberOfLines={1}>
                      {track.artist} • {formatDuration(track.duration)}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.removeTrackButton}
                    onPress={() => handleRemoveTrackFromPlaylist(track.id)}
                  >
                    <X size={18} color={Colors.dark.textTertiary} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
              <View style={{ height: 100 }} />
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    );
  };

  if (tracks.length === 0 && userPlaylists.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Playlists</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setCreateModalVisible(true)}
          >
            <Plus size={22} color={Colors.dark.text} />
          </TouchableOpacity>
        </View>
        {renderEmptyState()}
        
        <Modal
          visible={createModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setCreateModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>New Playlist</Text>
                <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                  <X size={24} color={Colors.dark.textSecondary} />
                </TouchableOpacity>
              </View>
              
              <TextInput
                style={styles.modalInput}
                placeholder="Playlist name"
                placeholderTextColor={Colors.dark.textTertiary}
                value={newPlaylistName}
                onChangeText={setNewPlaylistName}
                autoFocus
              />
              
              <TouchableOpacity 
                style={[styles.createButton, !newPlaylistName && styles.createButtonDisabled]}
                disabled={!newPlaylistName}
                onPress={handleCreatePlaylist}
              >
                <Text style={styles.createButtonText}>Create Playlist</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Playlists</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setCreateModalVisible(true)}
        >
          <Plus size={22} color={Colors.dark.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {smartPlaylists.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Sparkles size={20} color={Colors.dark.accent} />
              <Text style={styles.sectionTitle}>Smart Playlists</Text>
            </View>
            <Text style={styles.sectionSubtitle}>Auto-generated based on your music</Text>
            
            <View style={styles.smartGrid}>
              {smartPlaylists.map(playlist => (
                <TouchableOpacity 
                  key={playlist.id} 
                  style={styles.smartCard}
                  onPress={() => handlePlayPlaylist(playlist)}
                >
                  <View style={styles.smartCardHeader}>
                    <View style={styles.smartIcon}>
                      {smartPlaylistIcons[playlist.name] || <Zap size={20} color={Colors.dark.accent} />}
                    </View>
                    <TouchableOpacity 
                      style={styles.playSmartButton}
                      onPress={() => handlePlayPlaylist(playlist)}
                    >
                      <Play size={16} color={Colors.dark.background} fill={Colors.dark.background} />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.smartName}>{playlist.name}</Text>
                  <Text style={styles.smartCriteria}>{playlist.description}</Text>
                  <Text style={styles.smartCount}>{playlist.trackCount} tracks</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Playlists</Text>
          
          {userPlaylists.length === 0 ? (
            <View style={styles.noPlaylistsContainer}>
              <Text style={styles.noPlaylistsText}>No custom playlists yet</Text>
              <TouchableOpacity 
                style={styles.createInlineButton}
                onPress={() => setCreateModalVisible(true)}
              >
                <Plus size={16} color={Colors.dark.accent} />
                <Text style={styles.createInlineText}>Create one</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.playlistList}>
              {userPlaylists.map(playlist => (
                <TouchableOpacity 
                  key={playlist.id} 
                  style={styles.playlistItem}
                  onPress={() => handleOpenPlaylistDetail(playlist)}
                >
                  {playlist.artwork ? (
                    <Image 
                      source={{ uri: playlist.artwork }} 
                      style={styles.playlistArtwork} 
                    />
                  ) : (
                    <View style={styles.playlistArtworkPlaceholder}>
                      <Music2 size={24} color={Colors.dark.textTertiary} />
                    </View>
                  )}
                  <View style={styles.playlistInfo}>
                    <Text style={styles.playlistName}>{playlist.name}</Text>
                    <Text style={styles.playlistMeta}>
                      {playlist.trackCount} tracks
                    </Text>
                  </View>
                  {playlist.tracks.length > 0 && (
                    <TouchableOpacity 
                      style={styles.playButton}
                      onPress={() => handlePlayPlaylist(playlist)}
                    >
                      <Play size={18} color={Colors.dark.background} fill={Colors.dark.background} />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity 
                    style={styles.moreButton}
                    onPress={() => handleOpenPlaylistOptions(playlist)}
                  >
                    <MoreVertical size={20} color={Colors.dark.textTertiary} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <Modal
        visible={createModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Playlist</Text>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                <X size={24} color={Colors.dark.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Playlist name"
              placeholderTextColor={Colors.dark.textTertiary}
              value={newPlaylistName}
              onChangeText={setNewPlaylistName}
              autoFocus
            />
            
            <TouchableOpacity 
              style={[styles.createButton, !newPlaylistName && styles.createButtonDisabled]}
              disabled={!newPlaylistName}
              onPress={handleCreatePlaylist}
            >
              <Text style={styles.createButtonText}>Create & Add Songs</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={playlistOptionsVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPlaylistOptionsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.optionsContent}>
            <View style={styles.optionsHeader}>
              <Text style={styles.optionsTitle}>{selectedPlaylist?.name}</Text>
              <TouchableOpacity onPress={() => setPlaylistOptionsVisible(false)}>
                <X size={24} color={Colors.dark.textSecondary} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.optionItem} onPress={handleAddSongsToPlaylist}>
              <ListPlus size={22} color={Colors.dark.text} />
              <Text style={styles.optionText}>Add Songs</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionItem} onPress={() => {
              setPlaylistOptionsVisible(false);
              if (selectedPlaylist) handlePlayPlaylist(selectedPlaylist);
            }}>
              <Play size={22} color={Colors.dark.text} />
              <Text style={styles.optionText}>Play</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionItem} onPress={() => {
              if (selectedPlaylist) {
                setRenameText(selectedPlaylist.name);
                setPlaylistOptionsVisible(false);
                setRenameModalVisible(true);
              }
            }}>
              <Edit2 size={22} color={Colors.dark.text} />
              <Text style={styles.optionText}>Rename</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.optionItem, styles.optionItemDanger]} onPress={handleDeletePlaylist}>
              <Trash2 size={22} color={Colors.dark.error} />
              <Text style={[styles.optionText, styles.optionTextDanger]}>Delete Playlist</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <AddSongsModal
        visible={addSongsModalVisible}
        playlist={selectedPlaylist}
        onClose={() => {
          setAddSongsModalVisible(false);
        }}
        onSongsAdded={(count) => {
          console.log('[Playlists] Added', count, 'songs to playlist');
        }}
      />

      {renderPlaylistDetail()}

      <Modal
        visible={renameModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRenameModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rename Playlist</Text>
              <TouchableOpacity onPress={() => setRenameModalVisible(false)}>
                <X size={24} color={Colors.dark.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.modalInput}
              placeholder="New playlist name"
              placeholderTextColor={Colors.dark.textTertiary}
              value={renameText}
              onChangeText={setRenameText}
              autoFocus
            />
            
            <TouchableOpacity 
              style={[styles.createButton, !renameText.trim() && styles.createButtonDisabled]}
              disabled={!renameText.trim()}
              onPress={async () => {
                if (selectedPlaylist && renameText.trim()) {
                  await updatePlaylist(selectedPlaylist.id, { name: renameText.trim() });
                  setRenameModalVisible(false);
                  setSelectedPlaylist(null);
                  setRenameText('');
                }
              }}
            >
              <Text style={styles.createButtonText}>Save</Text>
            </TouchableOpacity>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.dark.text,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.dark.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 100,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.dark.accentGlow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: Colors.dark.textTertiary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  createFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.accent,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    gap: 8,
  },
  createFirstText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.dark.background,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.dark.textTertiary,
    marginTop: 4,
    marginBottom: 16,
  },
  smartGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  smartCard: {
    width: '48%',
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 16,
  },
  smartCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  smartIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.dark.accentGlow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playSmartButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.dark.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smartName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    marginBottom: 4,
  },
  smartCriteria: {
    fontSize: 11,
    color: Colors.dark.textTertiary,
    marginBottom: 8,
  },
  smartCount: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  noPlaylistsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  noPlaylistsText: {
    fontSize: 14,
    color: Colors.dark.textTertiary,
  },
  createInlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  createInlineText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.dark.accent,
  },
  playlistList: {
    gap: 12,
    marginTop: 16,
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  playlistArtwork: {
    width: 56,
    height: 56,
    borderRadius: 8,
  },
  playlistArtworkPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: Colors.dark.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playlistInfo: {
    flex: 1,
  },
  playlistName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.dark.text,
    marginBottom: 4,
  },
  playlistMeta: {
    fontSize: 12,
    color: Colors.dark.textTertiary,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.dark.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreButton: {
    padding: 8,
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
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
  modalInput: {
    backgroundColor: Colors.dark.surfaceHighlight,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.dark.text,
    marginBottom: 20,
  },
  createButton: {
    backgroundColor: Colors.dark.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.dark.background,
  },
  optionsContent: {
    backgroundColor: Colors.dark.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  optionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  optionsTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 16,
  },
  optionItemDanger: {
    marginTop: 8,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  optionText: {
    fontSize: 16,
    color: Colors.dark.text,
  },
  optionTextDanger: {
    color: Colors.dark.error,
  },
  detailContainer: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  detailBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  detailAddButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailInfo: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  detailArtwork: {
    width: 150,
    height: 150,
    borderRadius: 16,
    marginBottom: 16,
  },
  detailArtworkPlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 16,
    backgroundColor: Colors.dark.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailTrackCount: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginBottom: 16,
  },
  playAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  playAllText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.dark.background,
  },
  emptyPlaylistDetail: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyPlaylistText: {
    fontSize: 16,
    color: Colors.dark.textTertiary,
    marginBottom: 20,
  },
  addSongsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.accent,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    gap: 10,
  },
  addSongsButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.dark.background,
  },
  detailTrackList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  detailTrackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  detailTrackIndex: {
    width: 24,
    fontSize: 14,
    color: Colors.dark.textTertiary,
    textAlign: 'center',
  },
  detailTrackArtwork: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  detailTrackInfo: {
    flex: 1,
  },
  detailTrackTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.dark.text,
    marginBottom: 4,
  },
  detailTrackArtist: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
  },
  removeTrackButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.dark.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
