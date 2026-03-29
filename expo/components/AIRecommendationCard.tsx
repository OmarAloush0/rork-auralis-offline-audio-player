import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated } from 'react-native';
import { Book, Mic, GraduationCap, Heart } from 'lucide-react-native';
import { AIRecommendation, IslamicContentType } from '@/types/audio';
import { Colors } from '@/constants/colors';

interface AIRecommendationCardProps {
  recommendation: AIRecommendation;
  onPress?: () => void;
}

const typeConfig: Record<IslamicContentType, { icon: React.ReactNode; color: string; label: string }> = {
  quran: {
    icon: <Book size={14} color="#4CAF50" />,
    color: '#4CAF50',
    label: 'Quran',
  },
  nasheed: {
    icon: <Mic size={14} color="#2196F3" />,
    color: '#2196F3',
    label: 'Nasheed',
  },
  lecture: {
    icon: <GraduationCap size={14} color="#FF9800" />,
    color: '#FF9800',
    label: 'Lecture',
  },
  dua: {
    icon: <Heart size={14} color="#E91E63" />,
    color: '#E91E63',
    label: 'Dua',
  },
};

export default function AIRecommendationCard({ recommendation, onPress }: AIRecommendationCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const config = typeConfig[recommendation.type];

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <Image 
          source={{ uri: recommendation.thumbnail }} 
          style={styles.thumbnail}
        />
        <View style={styles.overlay} />
        
        <View style={styles.content}>
          <View style={[styles.typeBadge, { backgroundColor: config.color + '20' }]}>
            {config.icon}
            <Text style={[styles.typeLabel, { color: config.color }]}>{config.label}</Text>
          </View>
          
          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={2}>{recommendation.title}</Text>
            <Text style={styles.artist} numberOfLines={1}>{recommendation.artist}</Text>
          </View>
        </View>
        
        <View style={styles.reasonContainer}>
          <Text style={styles.reasonText} numberOfLines={2}>{recommendation.reason}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function AIRecommendationListItem({ recommendation, onPress }: AIRecommendationCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const config = typeConfig[recommendation.type];

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={styles.listItem}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <Image 
          source={{ uri: recommendation.thumbnail }} 
          style={styles.listThumbnail}
        />
        
        <View style={styles.listContent}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle} numberOfLines={1}>{recommendation.title}</Text>
            <View style={[styles.listTypeBadge, { backgroundColor: config.color + '20' }]}>
              {config.icon}
            </View>
          </View>
          <Text style={styles.listArtist} numberOfLines={1}>{recommendation.artist}</Text>
          <Text style={styles.listReason} numberOfLines={1}>{recommendation.reason}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 180,
    marginRight: 12,
  },
  card: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: 120,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    height: 120,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  content: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    padding: 12,
    justifyContent: 'space-between',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  typeLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  info: {
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  artist: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  reasonContainer: {
    padding: 12,
    paddingTop: 10,
  },
  reasonText: {
    fontSize: 11,
    color: Colors.dark.textTertiary,
    lineHeight: 15,
  },
  listItem: {
    flexDirection: 'row',
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },
  listThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  listContent: {
    flex: 1,
    justifyContent: 'center',
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  listTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  listTypeBadge: {
    padding: 4,
    borderRadius: 6,
  },
  listArtist: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  listReason: {
    fontSize: 11,
    color: Colors.dark.textTertiary,
    marginTop: 4,
  },
});
