import { useCallback, useMemo, useState } from 'react';
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import SafeLayout from '../../components/SafeLayout';

type HiddenItem = {
  id: string;
  label: string;
  x: string;
  y: string;
  rotate?: string;
  size?: number;
};

type Stage = {
  id: string;
  title: string;
  subtitle: string;
  hint: string;
  targets: string[];
  hiddenItems: HiddenItem[];
  scene: 'classroom' | 'garden' | 'playground' | 'beach';
};

const SCENE_IMAGES = {
  classroom: require('../../assets/images/hidden_picture_classroom_scene.png'),
  garden: require('../../assets/images/hidden_picture_garden_scene.png'),
  playground: require('../../assets/images/hidden_picture_playground_scene.png'),
  beach: require('../../assets/images/hidden_picture_beach_scene.png'),
} as const;

const STAGES_BY_GRADE: Record<number, Stage[]> = {
  1: [
    {
      id: 'g1-classroom',
      title: '교실에서 찾아요',
      subtitle: '그림 속에 숨은 글자와 숫자를 찾아보세요.',
      hint: '칠판 근처와 책상 아래를 잘 살펴보세요.',
      targets: ['ㄱ', '3', '해'],
      hiddenItems: [
        { id: 'ㄱ', label: 'ㄱ', x: '18%', y: '24%', rotate: '-8deg' },
        { id: '3', label: '3', x: '72%', y: '60%', rotate: '6deg' },
        { id: '해', label: '해', x: '46%', y: '78%', rotate: '-4deg', size: 18 },
      ],
      scene: 'classroom',
    },
    {
      id: 'g1-garden',
      title: '꽃밭에서 찾아요',
      subtitle: '꽃과 풀 사이에 숨은 낱말을 콕콕 찾아요.',
      hint: '꽃잎과 나뭇잎 사이를 천천히 눌러보세요.',
      targets: ['ㅂ', '7', '나'],
      hiddenItems: [
        { id: 'ㅂ', label: 'ㅂ', x: '22%', y: '66%', rotate: '4deg' },
        { id: '7', label: '7', x: '68%', y: '26%', rotate: '-6deg' },
        { id: '나', label: '나', x: '52%', y: '78%', rotate: '3deg', size: 18 },
      ],
      scene: 'garden',
    },
  ],
  2: [
    {
      id: 'g2-playground',
      title: '놀이터에서 찾아요',
      subtitle: '받침 낱말과 수를 찾으며 집중해요.',
      hint: '미끄럼틀과 그네 주변을 먼저 살펴보세요.',
      targets: ['봄', '12', '공'],
      hiddenItems: [
        { id: '봄', label: '봄', x: '17%', y: '28%', rotate: '-3deg', size: 18 },
        { id: '12', label: '12', x: '67%', y: '65%', rotate: '5deg', size: 18 },
        { id: '공', label: '공', x: '42%', y: '79%', rotate: '-7deg', size: 18 },
      ],
      scene: 'playground',
    },
    {
      id: 'g2-beach',
      title: '바닷가에서 찾아요',
      subtitle: '숫자와 생활 낱말을 차분히 찾아봐요.',
      hint: '파도 끝과 모래성 근처를 눌러보세요.',
      targets: ['파', '20', '배'],
      hiddenItems: [
        { id: '파', label: '파', x: '24%', y: '58%', rotate: '-4deg', size: 18 },
        { id: '20', label: '20', x: '71%', y: '33%', rotate: '5deg', size: 18 },
        { id: '배', label: '배', x: '49%', y: '76%', rotate: '-6deg', size: 18 },
      ],
      scene: 'beach',
    },
  ],
};

function SceneArtwork({ scene }: { scene: Stage['scene'] }) {
  return (
    <ImageBackground
      source={SCENE_IMAGES[scene]}
      resizeMode="cover"
      style={styles.sceneWrap}
      imageStyle={styles.sceneImage}
    >
      <View style={styles.sceneOverlay} />
    </ImageBackground>
  );
}

export default function HiddenPictureScreen() {
  const [childGrade, setChildGrade] = useState(1);
  const [stageIndex, setStageIndex] = useState(0);
  const [foundIds, setFoundIds] = useState<string[]>([]);
  const [hintUsed, setHintUsed] = useState(false);
  const [revealedHintId, setRevealedHintId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      const load = async () => {
        const storedGrade = await AsyncStorage.getItem('childGrade');
        if (mounted) {
          setChildGrade(Number(storedGrade) || 1);
        }
      };

      load();

      return () => {
        mounted = false;
      };
    }, [])
  );

  const stageSet = useMemo(() => {
    if (childGrade <= 1) return STAGES_BY_GRADE[1];
    if (childGrade === 2) return STAGES_BY_GRADE[2];
    return STAGES_BY_GRADE[2];
  }, [childGrade]);

  const stage = stageSet[stageIndex];
  const allFound = stage.targets.every((target) => foundIds.includes(target));

  const resetStage = () => {
    setFoundIds([]);
    setHintUsed(false);
    setRevealedHintId(null);
  };

  const handleFind = (itemId: string) => {
    if (foundIds.includes(itemId)) return;
    setFoundIds((prev) => [...prev, itemId]);
    if (revealedHintId === itemId) setRevealedHintId(null);
  };

  const handleHint = () => {
    if (hintUsed) return;
    const nextTarget = stage.targets.find((target) => !foundIds.includes(target));
    if (!nextTarget) return;
    setHintUsed(true);
    setRevealedHintId(nextTarget);
  };

  const handleNext = () => {
    if (stageIndex < stageSet.length - 1) {
      setStageIndex((prev) => prev + 1);
    } else {
      setStageIndex(0);
    }
    resetStage();
  };

  const handleRetry = () => {
    resetStage();
  };

  const progress = foundIds.length / stage.targets.length;

  return (
    <SafeLayout showHeader headerTitle="숨은그림찾기" backgroundColor="#FFFDF7">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <LinearGradient colors={['#E9FFF6', '#FFF8E8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.topCard}>
          <View style={styles.topBadge}>
            <Text style={styles.topBadgeText}>{childGrade}학년 맞춤 놀이</Text>
          </View>
          <Text style={styles.stageTitle}>{stage.title}</Text>
          <Text style={styles.stageSubtitle}>{stage.subtitle}</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>{foundIds.length} / {stage.targets.length} 찾았어요</Text>
        </LinearGradient>

        <View style={styles.targetRow}>
          {stage.targets.map((target) => {
            const found = foundIds.includes(target);
            return (
              <View key={target} style={[styles.targetChip, found && styles.targetChipDone]}>
                <Text style={[styles.targetText, found && styles.targetTextDone]}>{target}</Text>
                {found && <Ionicons name="checkmark-circle" size={16} color="#16A085" />}
              </View>
            );
          })}
        </View>

        <View style={styles.sceneCard}>
          <SceneArtwork scene={stage.scene} />
          {stage.hiddenItems.map((item) => {
            const found = foundIds.includes(item.id);
            const highlighted = revealedHintId === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => handleFind(item.id)}
                style={[
                  styles.hiddenItem,
                  {
                    left: item.x as any,
                    top: item.y as any,
                    transform: [{ rotate: item.rotate || '0deg' }],
                    opacity: found ? 0.28 : highlighted ? 1 : 0.68,
                  },
                  highlighted && styles.hiddenItemHint,
                ]}
              >
                <Text style={[styles.hiddenItemText, { fontSize: item.size || 22 }]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.hintCard}>
          <View style={styles.hintIcon}>
            <Ionicons name="bulb-outline" size={20} color="#F5A623" />
          </View>
          <View style={styles.hintTextWrap}>
            <Text style={styles.hintTitle}>힌트</Text>
            <Text style={styles.hintDesc}>{stage.hint}</Text>
          </View>
          <TouchableOpacity
            style={[styles.hintButton, hintUsed && styles.hintButtonDisabled]}
            onPress={handleHint}
            disabled={hintUsed}
          >
            <Text style={[styles.hintButtonText, hintUsed && styles.hintButtonTextDisabled]}>
              {hintUsed ? '사용 완료' : '힌트 보기'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footerCard}>
          {allFound ? (
            <>
              <Text style={styles.completeTitle}>참 잘했어요!</Text>
              <Text style={styles.completeDesc}>모든 숨은 그림을 찾았어요. 다음 장면으로 넘어가 볼까요?</Text>
              <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                <Text style={styles.nextButtonText}>
                  {stageIndex < stageSet.length - 1 ? '다음 장면' : '처음부터 다시'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.completeTitle}>아직 찾는 중이에요</Text>
              <Text style={styles.completeDesc}>남은 글자나 숫자를 천천히 눌러보세요.</Text>
              <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                <Text style={styles.retryButtonText}>이 장면 다시하기</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </SafeLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  topCard: {
    borderRadius: 28,
    padding: 20,
    marginBottom: 16,
  },
  topBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFFCC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 10,
  },
  topBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#17A57E',
  },
  stageTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#23324A',
    marginBottom: 8,
  },
  stageSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#5F6F7C',
    marginBottom: 14,
  },
  progressBar: {
    height: 12,
    backgroundColor: '#FFFFFFA8',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#1DA884',
  },
  progressText: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '700',
    color: '#46616C',
  },
  targetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  targetChip: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E6EFEA',
    paddingVertical: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  targetChipDone: {
    backgroundColor: '#E9FBF3',
    borderColor: '#B9EFD7',
  },
  targetText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#31414F',
  },
  targetTextDone: {
    color: '#17A57E',
  },
  sceneCard: {
    height: 320,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8F0EC',
    position: 'relative',
  },
  sceneWrap: {
    flex: 1,
  },
  sceneImage: {
    width: '100%',
    height: '100%',
  },
  sceneOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  classBoard: {
    position: 'absolute',
    top: '11%',
    left: '14%',
    width: '48%',
    height: '24%',
    borderRadius: 16,
    backgroundColor: '#6CCB93',
  },
  classShelf: {
    position: 'absolute',
    right: '10%',
    top: '24%',
    width: '20%',
    height: '36%',
    borderRadius: 18,
    backgroundColor: '#FFD891',
  },
  classDesk: {
    position: 'absolute',
    width: '22%',
    height: '12%',
    borderRadius: 16,
    backgroundColor: '#F2B672',
  },
  classWindow: {
    position: 'absolute',
    left: '7%',
    top: '16%',
    width: '18%',
    height: '20%',
    borderRadius: 16,
    backgroundColor: '#BEE7FF',
  },
  gardenSky: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '48%',
    backgroundColor: '#D6F4FF',
  },
  gardenHill: {
    position: 'absolute',
    bottom: '13%',
    left: '-6%',
    width: '112%',
    height: '38%',
    borderTopLeftRadius: 140,
    borderTopRightRadius: 140,
    backgroundColor: '#BDEB94',
  },
  flower: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  playSky: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '58%',
    backgroundColor: '#D5EEFF',
  },
  playCloudLeft: {
    position: 'absolute',
    left: '12%',
    top: '13%',
    width: 64,
    height: 24,
    borderRadius: 20,
    backgroundColor: '#FFFFFFCC',
  },
  playCloudRight: {
    position: 'absolute',
    right: '15%',
    top: '18%',
    width: 72,
    height: 26,
    borderRadius: 20,
    backgroundColor: '#FFFFFFCC',
  },
  playSun: {
    position: 'absolute',
    right: '10%',
    top: '10%',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFD65B',
  },
  playGrass: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '34%',
    backgroundColor: '#AEE07F',
  },
  playFence: {
    position: 'absolute',
    left: '8%',
    right: '8%',
    bottom: '27%',
    height: 10,
    borderRadius: 999,
    backgroundColor: '#FFF3D9',
  },
  treeTrunk: {
    position: 'absolute',
    left: '7%',
    bottom: '28%',
    width: 16,
    height: 72,
    borderRadius: 10,
    backgroundColor: '#9C6B43',
  },
  treeLeaf: {
    position: 'absolute',
    left: '2%',
    bottom: '44%',
    width: 72,
    height: 52,
    borderRadius: 28,
    backgroundColor: '#73C66C',
  },
  slideTower: {
    position: 'absolute',
    left: '18%',
    bottom: '28%',
    width: 44,
    height: 74,
    borderRadius: 10,
    backgroundColor: '#6FB6FF',
  },
  slideRoof: {
    position: 'absolute',
    left: '16.5%',
    bottom: '49%',
    width: 50,
    height: 18,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    backgroundColor: '#FF926F',
  },
  slideLadder: {
    position: 'absolute',
    left: '17.4%',
    bottom: '29%',
    width: 10,
    height: 68,
    borderRadius: 8,
    backgroundColor: '#4A94E0',
  },
  slideSlope: {
    position: 'absolute',
    left: '27%',
    bottom: '24%',
    width: 84,
    height: 20,
    borderRadius: 14,
    backgroundColor: '#FFC35D',
    transform: [{ rotate: '-24deg' }],
  },
  swingFrameLeft: {
    position: 'absolute',
    right: '28%',
    bottom: '27%',
    width: 8,
    height: 88,
    borderRadius: 8,
    backgroundColor: '#7DC4FF',
    transform: [{ rotate: '8deg' }],
  },
  swingFrameRight: {
    position: 'absolute',
    right: '15%',
    bottom: '27%',
    width: 8,
    height: 88,
    borderRadius: 8,
    backgroundColor: '#7DC4FF',
    transform: [{ rotate: '-8deg' }],
  },
  swingTopBar: {
    position: 'absolute',
    right: '16.5%',
    bottom: '53%',
    width: 72,
    height: 8,
    borderRadius: 8,
    backgroundColor: '#5AA8F8',
  },
  swingRopeLeft: {
    position: 'absolute',
    right: '24%',
    bottom: '35%',
    width: 2,
    height: 52,
    backgroundColor: '#7D889A',
  },
  swingRopeRight: {
    position: 'absolute',
    right: '19.3%',
    bottom: '35%',
    width: 2,
    height: 52,
    backgroundColor: '#7D889A',
  },
  swingSeat: {
    position: 'absolute',
    right: '19%',
    bottom: '34%',
    width: 34,
    height: 10,
    borderRadius: 6,
    backgroundColor: '#616F8F',
  },
  seesawBase: {
    position: 'absolute',
    left: '48%',
    bottom: '19%',
    width: 16,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FF8C8C',
  },
  seesawBoard: {
    position: 'absolute',
    left: '44%',
    bottom: '27%',
    width: 96,
    height: 12,
    borderRadius: 10,
    backgroundColor: '#8D68E8',
    transform: [{ rotate: '-10deg' }],
  },
  beachSky: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '38%',
    backgroundColor: '#D5F1FF',
  },
  beachSea: {
    position: 'absolute',
    top: '38%',
    left: 0,
    right: 0,
    height: '26%',
    backgroundColor: '#7FE0EA',
  },
  beachSand: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '36%',
    backgroundColor: '#FFE4A8',
  },
  beachUmbrella: {
    position: 'absolute',
    left: '18%',
    bottom: '20%',
    width: '18%',
    height: '22%',
    borderTopLeftRadius: 60,
    borderTopRightRadius: 60,
    backgroundColor: '#FF8C8C',
  },
  beachPalm: {
    position: 'absolute',
    right: '14%',
    bottom: '18%',
    width: '10%',
    height: '34%',
    borderRadius: 20,
    backgroundColor: '#70C47C',
  },
  hiddenItem: {
    position: 'absolute',
    minWidth: 34,
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 12,
  },
  hiddenItemHint: {
    backgroundColor: '#FFF9C499',
  },
  hiddenItemText: {
    fontWeight: '900',
    color: '#35525F',
  },
  hintCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EDF2EE',
    flexDirection: 'row',
    alignItems: 'center',
  },
  hintIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: '#FFF4DE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  hintTextWrap: {
    flex: 1,
    paddingRight: 8,
  },
  hintTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#22324A',
    marginBottom: 4,
  },
  hintDesc: {
    fontSize: 13,
    lineHeight: 19,
    color: '#637381',
  },
  hintButton: {
    backgroundColor: '#1DA884',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  hintButtonDisabled: {
    backgroundColor: '#E5F3EE',
  },
  hintButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  hintButtonTextDisabled: {
    color: '#88B8AA',
  },
  footerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EDF2EE',
  },
  completeTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#22324A',
    marginBottom: 8,
  },
  completeDesc: {
    fontSize: 14,
    lineHeight: 21,
    color: '#637381',
    marginBottom: 16,
  },
  nextButton: {
    backgroundColor: '#1DA884',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  retryButton: {
    backgroundColor: '#EEF6F3',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#1B7E66',
    fontWeight: '800',
    fontSize: 15,
  },
});




