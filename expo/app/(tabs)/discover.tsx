import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Sparkles, RefreshCw, Book, Mic, GraduationCap, Heart, Wifi, WifiOff } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useAIRecommendations } from '@/contexts/AIRecommendationsContext';
import { useLibrary } from '@/contexts/LibraryContext';
import AIRecommendationCard, { AIRecommendationListItem } from '@/components/AIRecommendationCard';
import { IslamicContentType } from '@/types/audio';

const categoryInfo: Record<IslamicContentType, { icon: React.ReactNode; title: string; color: string }> = {
  quran: {
    icon: <Book size={20} color="#4CAF50" />,
    title: 'Quran Recitations',
    color: '#4CAF50',
  },
  nasheed: {
    icon: <Mic size={20} color="#2196F3" />,
    title: 'Nasheeds',
    color: '#2196F3',
  },
  lecture: {
    icon: <GraduationCap size={20} color="#FF9800" />,
    title: 'Islamic Lectures',
    color: '#FF9800',
  },
  dua: {
    icon: <Heart size={20} color="#E91E63" />,
    title: 'Duas & Adhkar',
    color: '#E91E63',
  },
};

export default function DiscoverScreen() {
  const { 
    recommendations, 
    isLoading, 
    error, 
    lastFetch,
    fetchRecommendations 
  } = useAIRecommendations();
  
  const { listeningStats } = useLibrary();

  const [refreshing, setRefreshing] = React.useState(false);

  const handleFetchRecommendations = useCallback(() => {
    fetchRecommendations(listeningStats);
  }, [fetchRecommendations, listeningStats]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRecommendations(listeningStats);
    setRefreshing(false);
  };

  const quranRecs = recommendations.filter(r => r.type === 'quran');
  const nasheedRecs = recommendations.filter(r => r.type === 'nasheed');
  const lectureRecs = recommendations.filter(r => r.type === 'lecture');
  const duaRecs = recommendations.filter(r => r.type === 'dua');

  const formatLastFetch = () => {
    if (!lastFetch) return 'Never';
    const now = new Date();
    const diff = now.getTime() - lastFetch.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return lastFetch.toLocaleDateString();
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Sparkles size={48} color={Colors.dark.accent} />
      </View>
      <Text style={styles.emptyTitle}>AI Recommendations</Text>
      <Text style={styles.emptySubtitle}>
        Get personalized Islamic content suggestions based on your listening preferences.
        {'\n\n'}
        Includes Quran recitations, vocal-only Nasheeds, Islamic lectures, and Duas.
      </Text>
      <TouchableOpacity 
        style={styles.fetchButton}
        onPress={handleFetchRecommendations}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={Colors.dark.background} />
        ) : (
          <>
            <Wifi size={18} color={Colors.dark.background} />
            <Text style={styles.fetchButtonText}>Get Recommendations</Text>
          </>
        )}
      </TouchableOpacity>
      <Text style={styles.halalNote}>
        Only halal content • No music with instruments
      </Text>
    </View>
  );

  const renderSection = (type: IslamicContentType, items: typeof recommendations) => {
    if (items.length === 0) return null;
    const info = categoryInfo[type];

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIcon, { backgroundColor: info.color + '20' }]}>
            {info.icon}
          </View>
          <Text style={styles.sectionTitle}>{info.title}</Text>
        </View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
        >
          {items.map(rec => (
            <AIRecommendationCard
              key={rec.id}
              recommendation={rec}
              onPress={() => console.log('[Discover] Selected:', rec.title)}
            />
          ))}
        </ScrollView>
      </View>
    );
  };

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Sparkles size={24} color={Colors.dark.accent} />
            <Text style={styles.title}>Discover</Text>
          </View>
        </View>
        <View style={styles.errorState}>
          <WifiOff size={48} color={Colors.dark.textTertiary} />
          <Text style={styles.errorTitle}>Connection Error</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleFetchRecommendations}>
            <RefreshCw size={16} color={Colors.dark.text} />
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Sparkles size={24} color={Colors.dark.accent} />
          <Text style={styles.title}>Discover</Text>
        </View>
        <Text style={styles.subtitle}>AI-powered Islamic content for you</Text>
      </View>

      {recommendations.length === 0 && !isLoading ? (
        renderEmptyState()
      ) : (
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.dark.accent}
              colors={[Colors.dark.accent]}
            />
          }
        >
          {isLoading && recommendations.length === 0 ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="large" color={Colors.dark.accent} />
              <Text style={styles.loadingText}>Generating recommendations...</Text>
              <Text style={styles.loadingSubtext}>Finding halal content for you</Text>
            </View>
          ) : (
            <>
              <View style={styles.statusBar}>
                <View style={styles.statusItem}>
                  <RefreshCw size={14} color={Colors.dark.textTertiary} />
                  <Text style={styles.statusText}>Updated {formatLastFetch()}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.refreshButton}
                  onPress={handleFetchRecommendations}
                  disabled={isLoading}
                >
                  <RefreshCw size={16} color={Colors.dark.accent} />
                </TouchableOpacity>
              </View>

              {renderSection('quran', quranRecs)}
              {renderSection('nasheed', nasheedRecs)}
              {renderSection('lecture', lectureRecs)}
              {renderSection('dua', duaRecs)}

              <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>About Recommendations</Text>
                <Text style={styles.infoText}>
                  All suggestions are 100% halal Islamic content. Nasheeds are vocal-only without musical instruments. 
                  Recommendations are personalized based on your listening history and current time of day.
                </Text>
              </View>

              <View style={{ height: 120 }} />
            </>
          )}
        </ScrollView>
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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.dark.text,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.dark.textTertiary,
    marginTop: 4,
    marginLeft: 34,
  },
  content: {
    flex: 1,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginBottom: 8,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    color: Colors.dark.textTertiary,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.dark.surface,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 10,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
  horizontalList: {
    paddingHorizontal: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 100,
  },
  emptyIconContainer: {
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
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 15,
    color: Colors.dark.textTertiary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  fetchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.accent,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    gap: 8,
  },
  fetchButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.dark.background,
  },
  halalNote: {
    fontSize: 12,
    color: Colors.dark.textTertiary,
    marginTop: 16,
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.dark.text,
    marginTop: 16,
  },
  loadingSubtext: {
    fontSize: 13,
    color: Colors.dark.textTertiary,
    marginTop: 4,
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.dark.text,
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: Colors.dark.textTertiary,
    textAlign: 'center',
    marginTop: 8,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    gap: 8,
    marginTop: 20,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  infoCard: {
    backgroundColor: Colors.dark.surface,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.dark.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: Colors.dark.textTertiary,
    lineHeight: 20,
  },
});
