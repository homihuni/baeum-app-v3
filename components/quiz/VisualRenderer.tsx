import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { QUIZ_OBJECT_EMOJI } from '../../utils/quizObjectAssets';

export type QuizVisual =
  | {
      type: 'none';
    }
  | {
      type: 'word_card';
      text?: string;
      emoji?: string;
      data?: { text?: string; word?: string; emoji?: string };
    }
  | {
      type: 'illustration';
      imageUrl?: string;
      altText?: string;
      data?: { imageUrl?: string; image_url?: string; altText?: string; alt_text?: string };
    }
  | {
      type: 'counting_objects';
      object?: 'apple' | 'pencil' | 'ball' | 'star' | 'flower';
      count?: number;
      data?: { object?: 'apple' | 'pencil' | 'ball' | 'star' | 'flower'; count?: number };
    };

type VisualRendererProps = {
  visual?: QuizVisual | null;
  softColor: string;
  accentColor: string;
};

export default function VisualRenderer({ visual, softColor, accentColor }: VisualRendererProps) {
  const [imageFailed, setImageFailed] = useState(false);

  if (!visual || visual.type === 'none') {
    return (
      <View style={[styles.placeholder, { backgroundColor: softColor }]}>
        <Text style={styles.placeholderIcon}>🌱</Text>
        <Text style={styles.placeholderText}>그림 없이 풀어볼까요?</Text>
      </View>
    );
  }

  if (visual.type === 'word_card') {
    const text = visual.text || visual.data?.text || visual.data?.word || '';
    const emoji = visual.emoji || visual.data?.emoji;

    return (
      <View style={[styles.wordCard, { backgroundColor: softColor, borderColor: accentColor }]}>
        {emoji ? <Text style={styles.wordEmoji}>{emoji}</Text> : null}
        <View style={styles.wordInnerBox}>
          <Text style={[styles.wordText, { color: accentColor }]}>{text}</Text>
        </View>
      </View>
    );
  }

  if (visual.type === 'illustration') {
    const imageUrl = visual.imageUrl || visual.data?.imageUrl || visual.data?.image_url || '';
    const altText = visual.altText || visual.data?.altText || visual.data?.alt_text || '그림 준비 중';

    if (imageUrl && !imageFailed) {
      return (
        <View style={[styles.illustrationCard, { borderColor: accentColor }]}>
          <View style={styles.illustrationInnerBox}>
            <Image
              source={{ uri: imageUrl }}
              style={styles.illustrationImage}
              resizeMode="contain"
              onError={() => setImageFailed(true)}
            />
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.placeholder, { backgroundColor: softColor }]}>
        <Text style={styles.placeholderIcon}>🖼️</Text>
        <Text style={styles.placeholderText}>{altText || '그림 준비 중'}</Text>
      </View>
    );
  }

  if (visual.type === 'counting_objects') {
    const objectKey = visual.object || visual.data?.object || 'star';
    const count = Math.min(Number(visual.count || visual.data?.count || 0), 20);
    const emoji = QUIZ_OBJECT_EMOJI[objectKey] || '⭐';

    return (
      <View style={[styles.countingCard, { backgroundColor: softColor }]}>
        {Array.from({ length: count }).map((_, index) => (
          <Text key={index} style={styles.countingEmoji}>{emoji}</Text>
        ))}
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  wordCard: {
    minHeight: 150,
    borderRadius: 28,
    borderWidth: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
    marginTop: 6,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  wordInnerBox: {
    width: '100%',
    minHeight: 92,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.72)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wordEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  wordText: {
    fontSize: 58,
    fontWeight: '900',
    letterSpacing: 0,
    textAlign: 'center',
  },
  illustrationCard: {
    minHeight: 210,
    borderRadius: 30,
    borderWidth: 2.5,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginTop: 6,
    marginBottom: 8,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  illustrationInnerBox: {
    width: '100%',
    minHeight: 170,
    borderRadius: 24,
    backgroundColor: '#FFF8FB',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  illustrationImage: {
    width: '100%',
    height: 170,
  },
  placeholder: {
    minHeight: 150,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
    marginBottom: 8,
  },
  placeholderIcon: {
    fontSize: 38,
    marginBottom: 6,
  },
  placeholderText: {
    fontSize: 15,
    color: '#6D6760',
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 24,
  },
  countingCard: {
    minHeight: 150,
    borderRadius: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    padding: 18,
    marginBottom: 8,
  },
  countingEmoji: {
    fontSize: 38,
  },
});