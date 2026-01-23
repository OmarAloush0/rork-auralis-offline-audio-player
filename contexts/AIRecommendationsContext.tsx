import React, { useState, useEffect, useCallback } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateObject } from '@rork-ai/toolkit-sdk';
import { z } from 'zod';
import { AIRecommendation, IslamicContentType, UserPreferences, MoodType, ListeningStats } from '@/types/audio';

const STORAGE_KEYS = {
  PREFERENCES: 'auralis_user_preferences',
  RECOMMENDATIONS: 'auralis_ai_recommendations',
  LAST_FETCH: 'auralis_last_recommendation_fetch',
};

const recommendationSchema = z.object({
  recommendations: z.array(z.object({
    id: z.string(),
    title: z.string(),
    artist: z.string(),
    type: z.enum(['quran', 'nasheed', 'lecture', 'dua']),
    description: z.string(),
    reason: z.string(),
  })),
});

const defaultPreferences: UserPreferences = {
  favoriteReciters: [],
  favoriteNasheedArtists: [],
  preferredMoods: [],
  listeningTimes: [],
  topGenres: [],
  recentSearches: [],
};

export const [AIRecommendationsProvider, useAIRecommendations] = createContextHook(() => {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  useEffect(() => {
    loadStoredData();
  }, []);

  const loadStoredData = async () => {
    try {
      console.log('[AIRecommendations] Loading stored data...');
      const [prefsData, recsData, lastFetchData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.PREFERENCES),
        AsyncStorage.getItem(STORAGE_KEYS.RECOMMENDATIONS),
        AsyncStorage.getItem(STORAGE_KEYS.LAST_FETCH),
      ]);

      if (prefsData) {
        setPreferences(JSON.parse(prefsData));
      }
      if (recsData) {
        setRecommendations(JSON.parse(recsData));
      }
      if (lastFetchData) {
        setLastFetch(new Date(lastFetchData));
      }
      console.log('[AIRecommendations] Stored data loaded');
    } catch (err) {
      console.error('[AIRecommendations] Error loading stored data:', err);
    }
  };

  const updatePreferences = useCallback(async (newPrefs: Partial<UserPreferences>) => {
    const updated = { ...preferences, ...newPrefs };
    setPreferences(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(updated));
    console.log('[AIRecommendations] Preferences updated');
  }, [preferences]);

  const buildPreferencesFromListening = useCallback((listeningStats?: ListeningStats) => {
    const prefs: Partial<UserPreferences> = {};

    if (listeningStats?.topArtists && listeningStats.topArtists.length > 0) {
      prefs.favoriteReciters = listeningStats.topArtists
        .slice(0, 5)
        .map(a => a.name);
    }

    if (listeningStats?.topGenres && listeningStats.topGenres.length > 0) {
      prefs.topGenres = listeningStats.topGenres
        .slice(0, 5)
        .map(g => g.name);
    }

    if (listeningStats?.topMoods && listeningStats.topMoods.length > 0) {
      prefs.preferredMoods = listeningStats.topMoods
        .slice(0, 3)
        .map(m => m.mood);
    }

    const hour = new Date().getHours();
    let timeOfDay = 'morning';
    if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
    else if (hour >= 17 && hour < 21) timeOfDay = 'evening';
    else if (hour >= 21 || hour < 5) timeOfDay = 'night';
    
    prefs.listeningTimes = [timeOfDay];

    return prefs;
  }, []);

  const fetchRecommendations = useCallback(async (listeningStats?: ListeningStats) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('[AIRecommendations] Fetching AI recommendations...');

      const currentPrefs = buildPreferencesFromListening(listeningStats);
      await updatePreferences(currentPrefs);

      const hour = new Date().getHours();
      let contextHint = 'general listening';
      if (hour >= 4 && hour < 6) contextHint = 'Fajr prayer time';
      else if (hour >= 12 && hour < 14) contextHint = 'Dhuhr prayer time';
      else if (hour >= 15 && hour < 17) contextHint = 'Asr prayer time';
      else if (hour >= 17 && hour < 19) contextHint = 'Maghrib prayer time';
      else if (hour >= 19 && hour < 21) contextHint = 'Isha prayer time';
      else if (hour >= 21 || hour < 4) contextHint = 'night reflection time';
      else if (hour >= 6 && hour < 9) contextHint = 'morning motivation time';

      const prompt = `You are an Islamic audio content recommender for a Muslim user. 
      
IMPORTANT RULES:
- ONLY recommend Islamic content: Quran recitations, Nasheeds (Islamic vocal songs WITHOUT musical instruments), Islamic lectures, and Duas
- NEVER recommend any music with instruments as it is haram
- Nasheeds must be VOCAL ONLY (no musical instruments)
- Focus on well-known reciters and nasheed artists

User Context:
- Current time context: ${contextHint}
- Favorite reciters/artists: ${currentPrefs.favoriteReciters?.join(', ') || 'None specified'}
- Preferred moods: ${currentPrefs.preferredMoods?.join(', ') || 'calm, focus'}
- Top genres: ${currentPrefs.topGenres?.join(', ') || 'Islamic, Quran'}

Generate 8 personalized recommendations. Mix of:
- 3 Quran recitations (suggest specific surahs with reciters like Mishary Rashid Alafasy, Abdul Rahman Al-Sudais, Maher Al Muaiqly, etc.)
- 3 Nasheeds (vocal only, artists like Maher Zain, Sami Yusuf, Mesut Kurtis, Raef - only their acapella/vocal versions)
- 1 Islamic lecture (scholars like Mufti Menk, Omar Suleiman, Nouman Ali Khan)
- 1 Dua (morning/evening adhkar or specific duas)

Each recommendation should have a meaningful reason related to the user's context.`;

      const result = await generateObject({
        messages: [{ role: 'user', content: prompt }],
        schema: recommendationSchema,
      });

      const newRecommendations: AIRecommendation[] = result.recommendations.map((rec, index) => ({
        ...rec,
        id: `ai-rec-${Date.now()}-${index}`,
        thumbnail: getDefaultThumbnail(rec.type as IslamicContentType),
      }));

      setRecommendations(newRecommendations);
      setLastFetch(new Date());

      await AsyncStorage.setItem(STORAGE_KEYS.RECOMMENDATIONS, JSON.stringify(newRecommendations));
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_FETCH, new Date().toISOString());

      console.log('[AIRecommendations] Fetched', newRecommendations.length, 'recommendations');
    } catch (err) {
      console.error('[AIRecommendations] Error fetching recommendations:', err);
      console.log('[AIRecommendations] Using fallback recommendations');
      
      const fallbackRecs = getFallbackRecommendations();
      setRecommendations(fallbackRecs);
      setLastFetch(new Date());
      await AsyncStorage.setItem(STORAGE_KEYS.RECOMMENDATIONS, JSON.stringify(fallbackRecs));
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_FETCH, new Date().toISOString());
      setError(null);
    } finally {
      setIsLoading(false);
    }
  }, [buildPreferencesFromListening, updatePreferences]);

  const getDefaultThumbnail = (type: IslamicContentType): string => {
    const thumbnails: Record<IslamicContentType, string> = {
      quran: 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=400&h=400&fit=crop',
      nasheed: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?w=400&h=400&fit=crop',
      lecture: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=400&h=400&fit=crop',
      dua: 'https://images.unsplash.com/photo-1542816417-0983c9c9ad53?w=400&h=400&fit=crop',
    };
    return thumbnails[type];
  };

  const getFallbackRecommendations = (): AIRecommendation[] => {
    const hour = new Date().getHours();
    let contextualRecs: AIRecommendation[] = [];

    if (hour >= 4 && hour < 7) {
      contextualRecs = [
        {
          id: 'fallback-fajr-1',
          title: 'Surah Al-Fajr',
          artist: 'Mishary Rashid Alafasy',
          type: 'quran',
          description: 'Beautiful recitation of Surah Al-Fajr',
          reason: 'Perfect for Fajr prayer time',
          thumbnail: getDefaultThumbnail('quran'),
        },
      ];
    } else if (hour >= 21 || hour < 4) {
      contextualRecs = [
        {
          id: 'fallback-night-1',
          title: 'Surah Al-Mulk',
          artist: 'Abdul Rahman Al-Sudais',
          type: 'quran',
          description: 'Recommended recitation before sleep',
          reason: 'Sunnah to recite before sleeping',
          thumbnail: getDefaultThumbnail('quran'),
        },
      ];
    }

    const baseRecommendations: AIRecommendation[] = [
      {
        id: 'fallback-quran-1',
        title: 'Surah Ar-Rahman',
        artist: 'Mishary Rashid Alafasy',
        type: 'quran',
        description: 'The Most Merciful - Beautiful recitation',
        reason: 'One of the most beautiful surahs for reflection',
        thumbnail: getDefaultThumbnail('quran'),
      },
      {
        id: 'fallback-quran-2',
        title: 'Surah Yasin',
        artist: 'Abdul Rahman Al-Sudais',
        type: 'quran',
        description: 'Heart of the Quran',
        reason: 'Highly rewarding to recite and listen',
        thumbnail: getDefaultThumbnail('quran'),
      },
      {
        id: 'fallback-quran-3',
        title: 'Surah Al-Kahf',
        artist: 'Maher Al Muaiqly',
        type: 'quran',
        description: 'Protection and guidance',
        reason: 'Sunnah to recite on Fridays',
        thumbnail: getDefaultThumbnail('quran'),
      },
      {
        id: 'fallback-nasheed-1',
        title: 'Rahmatun Lil Aalameen',
        artist: 'Maher Zain',
        type: 'nasheed',
        description: 'Vocal nasheed about the Prophet (PBUH)',
        reason: 'Uplifting nasheed for daily motivation',
        thumbnail: getDefaultThumbnail('nasheed'),
      },
      {
        id: 'fallback-nasheed-2',
        title: 'Hasbi Rabbi',
        artist: 'Sami Yusuf',
        type: 'nasheed',
        description: 'Peaceful vocal nasheed',
        reason: 'Beautiful reminder of trust in Allah',
        thumbnail: getDefaultThumbnail('nasheed'),
      },
      {
        id: 'fallback-nasheed-3',
        title: 'The Way of Love',
        artist: 'Mesut Kurtis',
        type: 'nasheed',
        description: 'Soulful vocal performance',
        reason: 'Touching lyrics about faith',
        thumbnail: getDefaultThumbnail('nasheed'),
      },
      {
        id: 'fallback-lecture-1',
        title: 'Finding Peace in Difficult Times',
        artist: 'Mufti Menk',
        type: 'lecture',
        description: 'Inspiring lecture on patience and faith',
        reason: 'Practical advice for daily challenges',
        thumbnail: getDefaultThumbnail('lecture'),
      },
      {
        id: 'fallback-dua-1',
        title: 'Morning Adhkar',
        artist: 'Mishary Rashid Alafasy',
        type: 'dua',
        description: 'Essential morning remembrances',
        reason: 'Start your day with protection and blessings',
        thumbnail: getDefaultThumbnail('dua'),
      },
    ];

    return [...contextualRecs, ...baseRecommendations];
  };

  const clearRecommendations = useCallback(async () => {
    setRecommendations([]);
    await AsyncStorage.removeItem(STORAGE_KEYS.RECOMMENDATIONS);
    console.log('[AIRecommendations] Recommendations cleared');
  }, []);

  const addToSearchHistory = useCallback(async (search: string) => {
    const updated = {
      ...preferences,
      recentSearches: [search, ...preferences.recentSearches.filter(s => s !== search)].slice(0, 10),
    };
    setPreferences(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(updated));
  }, [preferences]);

  return {
    recommendations,
    preferences,
    isLoading,
    error,
    lastFetch,
    fetchRecommendations,
    updatePreferences,
    clearRecommendations,
    addToSearchHistory,
  };
});
