import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, FlatList, ActivityIndicator, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Shuffle, Folder, Music2, Sparkles, Brain, TrendingUp, Clock, Play, Menu, RefreshCw, SortAsc } from 'lucide-react-native';
import SideMenu from '@/components/SideMenu';
import { Colors } from '@/constants/colors';
import { useLibrary } from '@/contexts/LibraryContext';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import TrackItem from '@/components/TrackItem';
import AlbumCard from '@/components/AlbumCard';
import ArtistCard from '@/components/ArtistCard';
import TrackOptionsModal from '@/components/TrackOptionsModal';
import { LibraryTab, Track } from '@/types/audio';
import { moodDescriptions } from '@/mocks/audioData';

type TabType = 'tracks' | 'albums' | 'artists' | 'genres' | 'folders' | 'smart';
type SortType = 'name' | 'artist' | 'album' | 'dateAdded' | 'recent';

export default function LibraryScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('tracks');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [menuVisible, setMenuVisible] = useState(false);
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [sortBy, setSortBy] = useState<SortType>('name');
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);
  
  const { 
    tracks, 
    albums, 
    artists, 
    genres, 
    folders,
    isLoading,
    isScanning,
    scanProgress,
    permissionStatus,
    hasScannedBefore,
    libraryStats,
    listeningStats,
    getSimilarTracks,
    getSmartShuffleTrack,
    recentlyPlayedTracks,
    scanAndUpdateLibrary,
    rescanLibrary,
    requestPermissions,
  } = useLibrary();
  
  const { playTrack, updateAllTracks } = useAudioPlayer();

  useEffect(() => {
    updateAllTracks(tracks);
  }, [tracks, updateAllTracks]);

  useEffect(() => {
    if (permissionStatus === 'granted' && !hasScannedBefore && tracks.length === 0 && !isScanning && !isLoading) {
      console.log('[Library] Auto-scanning device for first time...');
      scanAndUpdateLibrary();
    }
  }, [permissionStatus, hasScannedBefore, tracks.length, isScanning, isLoading]);

  const tabs: { key: TabType; label: string; icon?: React.ReactNode }[] = [
    { key: 'tracks', label: 'Tracks' },
    { key: 'albums', label: 'Albums' },
    { key: 'artists', label: 'Artists' },
    { key: 'genres', label: 'Genres' },
    { key: 'folders', label: 'Folders' },
    { key: 'smart', label: 'Smart', icon: <Brain size={14} color={Colors.dark.accent} /> },
  ];

  const sortOptions: { key: SortType; label: string }[] = [
    { key: 'name', label: 'Name' },
    { key: 'artist', label: 'Artist' },
    { key: 'album', label: 'Album' },
    { key: 'dateAdded', label: 'Date Added' },
    { key: 'recent', label: 'Recently Played' },
  ];

  const filteredTracks = useMemo(() => {
    let filtered = tracks;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        t => t.title.toLowerCase().includes(query) ||
             t.artist.toLowerCase().includes(query) ||
             t.album.toLowerCase().includes(query)
      );
    }
    
    if (selectedGenre !== 'All') {
      filtered = filtered.filter(t => t.genre === selectedGenre);
    }

    if (selectedArtist) {
      filtered = filtered.filter(t => t.artist === selectedArtist);
    }

    const sorted = [...filtered];
    switch (sortBy) {
      case 'name':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'artist':
        sorted.sort((a, b) => a.artist.localeCompare(b.artist));
        break;
      case 'album':
        sorted.sort((a, b) => a.album.localeCompare(b.album));
        break;
      case 'dateAdded':
        sorted.sort((a, b) => {
          const dateA = a.dateAdded ? new Date(a.dateAdded).getTime() : 0;
          const dateB = b.dateAdded ? new Date(b.dateAdded).getTime() : 0;
          return dateB - dateA;
        });
        break;
      case 'recent':
        sorted.sort((a, b) => {
          const dateA = a.lastPlayed ? new Date(a.lastPlayed).getTime() : 0;
          const dateB = b.lastPlayed ? new Date(b.lastPlayed).getTime() : 0;
          return dateB - dateA;
        });
        break;
    }
    
    return sorted;
  }, [tracks, searchQuery, selectedGenre, sortBy, selectedArtist]);

  const handleShuffleAll = () => {
    if (filteredTracks.length === 0) return;
    const smartTrack = getSmartShuffleTrack(null, []);
    if (smartTrack) {
      playTrack(smartTrack);
    } else {
      const randomTrack = filteredTracks[Math.floor(Math.random() * filteredTracks.length)];
      playTrack(randomTrack);
    }
  };

  const handlePlaySimilar = (track: Track) => {
    const similar = getSimilarTracks(track, 1);
    if (similar.length > 0) {
      playTrack(similar[0]);
    }
  };

  const handleOpenOptions = (track: Track) => {
    setSelectedTrack(track);
    setOptionsModalVisible(true);
  };

  const handleCloseOptions = () => {
    setOptionsModalVisible(false);
    setSelectedTrack(null);
  };

  const handleScanLibrary = async () => {
    if (permissionStatus !== 'granted') {
      const granted = await requestPermissions();
      if (!granted) return;
    }
    await scanAndUpdateLibrary();
  };

  const handleRescan = async () => {
    const newCount = await rescanLibrary();
    console.log('[Library] Rescan found', newCount, 'new tracks');
  };

  const renderScanningState = () => (
    <View style={styles.scanningContainer}>
      <ActivityIndicator size="large" color={Colors.dark.accent} />
      <Text style={styles.scanningTitle}>Scanning Your Music</Text>
      <Text style={styles.scanningSubtitle}>Finding audio files on your device...</Text>
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${scanProgress}%` }]} />
      </View>
      <Text style={styles.progressText}>{scanProgress}%</Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Music2 size={48} color={Colors.dark.accent} />
      </View>
      <Text style={styles.emptyTitle}>No Music Found</Text>
      <Text style={styles.emptySubtitle}>
        {Platform.OS === 'web' 
          ? 'Device scanning is not available on web. Please use the mobile app to scan your music library.'
          : 'Scan your device to find all your music files. We support MP3, WAV, FLAC, AAC, OGG, M4A, and more.'}
      </Text>
      {Platform.OS !== 'web' && (
        <TouchableOpacity style={styles.scanButton} onPress={handleScanLibrary}>
          <RefreshCw size={20} color={Colors.dark.background} />
          <Text style={styles.scanButtonText}>Scan Device for Music</Text>
        </TouchableOpacity>
      )}
      <View style={styles.emptyFeatures}>
        <View style={styles.featureItem}>
          <Brain size={20} color={Colors.dark.accent} />
          <Text style={styles.featureText}>Smart mood analysis</Text>
        </View>
        <View style={styles.featureItem}>
          <Sparkles size={20} color={Colors.dark.accent} />
          <Text style={styles.featureText}>Auto-generated playlists</Text>
        </View>
        <View style={styles.featureItem}>
          <TrendingUp size={20} color={Colors.dark.accent} />
          <Text style={styles.featureText}>Listening insights</Text>
        </View>
      </View>
    </View>
  );

  const renderRecentlyPlayed = () => {
    if (recentlyPlayedTracks.length === 0) return null;

    return (
      <View style={styles.recentSection}>
        <View style={styles.recentHeader}>
          <Clock size={18} color={Colors.dark.accent} />
          <Text style={styles.recentTitle}>Recently Played</Text>
        </View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.recentList}
        >
          {recentlyPlayedTracks.slice(0, 10).map((track) => (
            <TouchableOpacity 
              key={track.id} 
              style={styles.recentItem}
              onPress={() => playTrack(track)}
              activeOpacity={0.8}
            >
              <Image source={{ uri: track.albumArt }} style={styles.recentArtwork} />
              <View style={styles.recentPlayOverlay}>
                <Play size={20} color={Colors.dark.text} fill={Colors.dark.text} />
              </View>
              <Text style={styles.recentTrackTitle} numberOfLines={1}>{track.title}</Text>
              <Text style={styles.recentTrackArtist} numberOfLines={1}>{track.artist}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderSortMenu = () => {
    if (!sortMenuVisible) return null;

    return (
      <View style={styles.sortMenu}>
        {sortOptions.map(option => (
          <TouchableOpacity
            key={option.key}
            style={[styles.sortOption, sortBy === option.key && styles.sortOptionActive]}
            onPress={() => {
              setSortBy(option.key);
              setSortMenuVisible(false);
            }}
          >
            <Text style={[styles.sortOptionText, sortBy === option.key && styles.sortOptionTextActive]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderTracks = () => {
    if (filteredTracks.length === 0 && tracks.length === 0) {
      return renderEmptyState();
    }

    if (filteredTracks.length === 0) {
      return (
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsText}>No tracks found matching "{searchQuery}"</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={filteredTracks}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <TrackItem 
            track={item} 
            index={index} 
            onOptionsPress={() => handleOpenOptions(item)}
            onLongPress={() => handleOpenOptions(item)}
          />
        )}
        ListHeaderComponent={
          <>
            {renderRecentlyPlayed()}
            <View style={styles.listHeader}>
              <Text style={styles.trackCount}>{filteredTracks.length} tracks</Text>
              <View style={styles.headerActions}>
                <TouchableOpacity 
                  style={styles.sortButton} 
                  onPress={() => setSortMenuVisible(!sortMenuVisible)}
                >
                  <SortAsc size={16} color={Colors.dark.textSecondary} />
                  <Text style={styles.sortButtonText}>{sortOptions.find(o => o.key === sortBy)?.label}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.shuffleButton} onPress={handleShuffleAll}>
                  <Shuffle size={18} color={Colors.dark.background} />
                  <Text style={styles.shuffleText}>Shuffle</Text>
                </TouchableOpacity>
              </View>
            </View>
            {renderSortMenu()}
          </>
        }
        contentContainerStyle={styles.trackList}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  const renderAlbums = () => {
    if (albums.length === 0) {
      return renderEmptyState();
    }

    return (
      <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.gridContainer}>
          {albums.map(album => (
            <View key={album.id} style={styles.albumGridItem}>
              <AlbumCard
                album={album}
                onPress={() => {
                  if (album.tracks.length > 0) {
                    playTrack(album.tracks[0]);
                  }
                }}
                size="medium"
              />
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  const handleArtistPress = (artistName: string) => {
    setSelectedArtist(artistName);
    setActiveTab('tracks');
  };

  const renderArtists = () => {
    if (artists.length === 0) {
      return renderEmptyState();
    }

    return (
      <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.artistGrid}>
          {artists.map(artist => (
            <ArtistCard key={artist.id} artist={artist} onPress={() => handleArtistPress(artist.name)} />
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderGenres = () => {
    if (genres.length <= 1) {
      return renderEmptyState();
    }

    return (
      <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.genreGrid}>
          {genres.filter(g => g !== 'All').map((genre, index) => {
            const genreTracks = tracks.filter(t => t.genre === genre);
            const colors = [
              Colors.dark.visualizer.primary,
              Colors.dark.visualizer.secondary,
              Colors.dark.visualizer.tertiary,
              '#4CAF50',
              '#2196F3',
              '#9C27B0',
              '#FF5722',
            ];
            return (
              <TouchableOpacity
                key={genre}
                style={[styles.genreCard, { backgroundColor: colors[index % colors.length] + '30' }]}
                onPress={() => {
                  setSelectedGenre(genre);
                  setActiveTab('tracks');
                }}
              >
                <Music2 size={24} color={colors[index % colors.length]} />
                <Text style={styles.genreTitle}>{genre}</Text>
                <Text style={styles.genreCount}>{genreTracks.length} tracks</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    );
  };

  const renderFolders = () => {
    if (folders.length === 0) {
      return (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Folder size={48} color={Colors.dark.accent} />
          </View>
          <Text style={styles.emptyTitle}>No Folders Found</Text>
          <Text style={styles.emptySubtitle}>
            Scan your device to discover music folders.
          </Text>
          {Platform.OS !== 'web' && (
            <TouchableOpacity style={styles.scanButton} onPress={handleScanLibrary}>
              <RefreshCw size={20} color={Colors.dark.background} />
              <Text style={styles.scanButtonText}>Scan Device</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return (
      <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.folderList}>
          {folders.map(folder => (
            <TouchableOpacity key={folder.id} style={styles.folderItem}>
              <View style={styles.folderIcon}>
                <Folder size={24} color={Colors.dark.accent} />
              </View>
              <View style={styles.folderInfo}>
                <Text style={styles.folderName}>{folder.name}</Text>
                <Text style={styles.folderPath} numberOfLines={1}>{folder.path}</Text>
                <Text style={styles.folderCount}>{folder.trackCount} tracks</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderSmartTab = () => {
    if (tracks.length === 0) {
      return renderEmptyState();
    }

    const moodGroups = tracks.reduce((acc, track) => {
      const mood = track.mood || 'unknown';
      if (!acc[mood]) acc[mood] = [];
      acc[mood].push(track);
      return acc;
    }, {} as Record<string, Track[]>);

    return (
      <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.smartSection}>
          <Text style={styles.smartSectionTitle}>Mood Analysis</Text>
          <Text style={styles.smartSectionSubtitle}>Your tracks organized by detected mood</Text>
          
          <View style={styles.moodGrid}>
            {Object.entries(moodGroups).map(([mood, moodTracks]) => {
              const moodInfo = moodDescriptions[mood] || { color: '#607D8B', description: 'Unknown mood' };
              return (
                <TouchableOpacity
                  key={mood}
                  style={[styles.moodCard, { borderLeftColor: moodInfo.color }]}
                  onPress={() => {
                    if (moodTracks.length > 0) {
                      playTrack(moodTracks[0]);
                    }
                  }}
                >
                  <View style={[styles.moodIndicator, { backgroundColor: moodInfo.color }]} />
                  <View style={styles.moodInfo}>
                    <Text style={styles.moodName}>{mood.charAt(0).toUpperCase() + mood.slice(1)}</Text>
                    <Text style={styles.moodDescription}>{moodInfo.description}</Text>
                    <Text style={styles.moodCount}>{moodTracks.length} tracks</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {listeningStats.topArtists.length > 0 && (
          <View style={styles.smartSection}>
            <Text style={styles.smartSectionTitle}>Top Artists</Text>
            <View style={styles.topList}>
              {listeningStats.topArtists.slice(0, 5).map((artist, index) => (
                <View key={artist.name} style={styles.topItem}>
                  <Text style={styles.topRank}>#{index + 1}</Text>
                  <Text style={styles.topName}>{artist.name}</Text>
                  <Text style={styles.topCount}>{artist.playCount} plays</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {listeningStats.topGenres.length > 0 && (
          <View style={styles.smartSection}>
            <Text style={styles.smartSectionTitle}>Top Genres</Text>
            <View style={styles.topList}>
              {listeningStats.topGenres.slice(0, 5).map((genre, index) => (
                <View key={genre.name} style={styles.topItem}>
                  <Text style={styles.topRank}>#{index + 1}</Text>
                  <Text style={styles.topName}>{genre.name}</Text>
                  <Text style={styles.topCount}>{genre.playCount} plays</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.dark.accent} />
          <Text style={styles.loadingText}>Loading library...</Text>
        </View>
      );
    }

    if (isScanning) {
      return renderScanningState();
    }

    switch (activeTab) {
      case 'tracks':
        return renderTracks();
      case 'albums':
        return renderAlbums();
      case 'artists':
        return renderArtists();
      case 'genres':
        return renderGenres();
      case 'folders':
        return renderFolders();
      case 'smart':
        return renderSmartTab();
      default:
        return renderTracks();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <SideMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.menuButton} 
          onPress={() => setMenuVisible(true)}
          activeOpacity={0.7}
        >
          <Menu size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>AURALIS</Text>
        </View>
        {Platform.OS !== 'web' && tracks.length > 0 && (
          <TouchableOpacity 
            style={styles.rescanButton} 
            onPress={handleRescan}
            activeOpacity={0.7}
          >
            <RefreshCw size={20} color={Colors.dark.textSecondary} />
          </TouchableOpacity>
        )}
        {(Platform.OS === 'web' || tracks.length === 0) && <View style={styles.placeholder} />}
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color={Colors.dark.textTertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search songs, artists, albums..."
          placeholderTextColor={Colors.dark.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {(selectedGenre !== 'All' || selectedArtist) && (
        <View style={styles.filterBadge}>
          <Text style={styles.filterText}>
            {selectedArtist ? `Artist: ${selectedArtist}` : `Genre: ${selectedGenre}`}
          </Text>
          <TouchableOpacity onPress={() => {
            setSelectedGenre('All');
            setSelectedArtist(null);
          }}>
            <Text style={styles.clearFilter}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key)}
          >
            {tab.icon && <View style={styles.tabIcon}>{tab.icon}</View>}
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.content}>
        {renderContent()}
      </View>

      <TrackOptionsModal
        visible={optionsModalVisible}
        track={selectedTrack}
        onClose={handleCloseOptions}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scanningContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  scanningTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    marginTop: 24,
    marginBottom: 8,
  },
  scanningSubtitle: {
    fontSize: 15,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  progressContainer: {
    width: '100%',
    height: 6,
    backgroundColor: Colors.dark.surface,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.dark.accent,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.dark.accent,
    marginTop: 12,
  },
  recentSection: {
    marginBottom: 20,
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
  recentList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  recentItem: {
    width: 120,
    alignItems: 'center',
  },
  recentArtwork: {
    width: 120,
    height: 120,
    borderRadius: 12,
    marginBottom: 8,
  },
  recentPlayOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentTrackTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.dark.text,
    textAlign: 'center',
    width: '100%',
  },
  recentTrackArtist: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    marginTop: 2,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.dark.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rescanButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.dark.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.dark.accent,
    letterSpacing: 2,
  },
  placeholder: {
    width: 44,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    marginHorizontal: 16,
    paddingHorizontal: 14,
    borderRadius: 12,
    height: 48,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.dark.text,
  },
  filterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.dark.accentGlow,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  filterText: {
    fontSize: 13,
    color: Colors.dark.accent,
    fontWeight: '600' as const,
  },
  clearFilter: {
    fontSize: 13,
    color: Colors.dark.text,
    fontWeight: '600' as const,
  },
  tabsContainer: {
    marginTop: 16,
    maxHeight: 44,
  },
  tabsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.dark.surface,
    marginRight: 8,
    gap: 6,
  },
  activeTab: {
    backgroundColor: Colors.dark.accent,
  },
  tabIcon: {
    marginRight: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.dark.textSecondary,
  },
  activeTabText: {
    color: Colors.dark.background,
  },
  content: {
    flex: 1,
    marginTop: 16,
  },
  contentScroll: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
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
    marginBottom: 24,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.accent,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    gap: 10,
    marginBottom: 32,
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.dark.background,
  },
  emptyFeatures: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  noResultsText: {
    fontSize: 15,
    color: Colors.dark.textTertiary,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  sortButtonText: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  sortMenu: {
    backgroundColor: Colors.dark.surface,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sortOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  sortOptionActive: {
    backgroundColor: Colors.dark.accentGlow,
  },
  sortOptionText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  sortOptionTextActive: {
    color: Colors.dark.accent,
    fontWeight: '600' as const,
  },
  trackCount: {
    fontSize: 13,
    color: Colors.dark.textTertiary,
  },
  shuffleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  shuffleText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.dark.background,
  },
  trackList: {
    paddingBottom: 100,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  albumGridItem: {
    width: '50%',
    marginBottom: 16,
  },
  artistGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  genreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 100,
  },
  genreCard: {
    width: '47%',
    padding: 20,
    borderRadius: 16,
    alignItems: 'flex-start',
    gap: 8,
  },
  genreTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
  genreCount: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  folderList: {
    paddingHorizontal: 16,
    paddingBottom: 100,
    gap: 8,
  },
  folderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    padding: 16,
    borderRadius: 12,
    gap: 14,
  },
  folderIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.dark.accentGlow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  folderInfo: {
    flex: 1,
  },
  folderName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.dark.text,
    marginBottom: 2,
  },
  folderPath: {
    fontSize: 12,
    color: Colors.dark.textTertiary,
    marginBottom: 2,
  },
  folderCount: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  smartSection: {
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  smartSectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    marginBottom: 4,
  },
  smartSectionSubtitle: {
    fontSize: 13,
    color: Colors.dark.textTertiary,
    marginBottom: 16,
  },
  moodGrid: {
    gap: 10,
  },
  moodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    gap: 12,
  },
  moodIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  moodInfo: {
    flex: 1,
  },
  moodName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  moodDescription: {
    fontSize: 12,
    color: Colors.dark.textTertiary,
    marginTop: 2,
  },
  moodCount: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    marginTop: 4,
  },
  topList: {
    gap: 8,
  },
  topItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    borderRadius: 10,
    padding: 12,
    gap: 12,
  },
  topRank: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.dark.accent,
    width: 30,
  },
  topName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.dark.text,
  },
  topCount: {
    fontSize: 12,
    color: Colors.dark.textTertiary,
  },
});
