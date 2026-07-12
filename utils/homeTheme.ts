export type HomeSeasonThemeId = 'spring' | 'summer' | 'autumn' | 'winter';
export type HomeThemeId = HomeSeasonThemeId | 'auto';

export type HomeTheme = {
  id: HomeSeasonThemeId;
  name: string;
  message: string;
  backgroundColor: string;
  heroBackgroundColor: string;
  heroWaveColor: string;
  primaryColor: string;
  primarySoftColor: string;
  accentColor: string;
  borderColor: string;
  decorationColor: string;
};

export const HOME_SEASON_THEMES: Record<HomeSeasonThemeId, HomeTheme> = {
  spring: {
    id: 'spring',
    name: '봄',
    message: '봄처럼 가볍게 오늘의 배움을 시작해요.',
    backgroundColor: '#FFFFFF',
    heroBackgroundColor: '#F0FBF5',
    heroWaveColor: '#DFF6EA',
    primaryColor: '#1DA884',
    primarySoftColor: '#EEF9F3',
    accentColor: '#F6B23C',
    borderColor: '#BFE9DB',
    decorationColor: '#FFB6C8',
  },
  summer: {
    id: 'summer',
    name: '여름',
    message: '시원하게 오늘의 배움을 시작해요.',
    backgroundColor: '#FFFFFF',
    heroBackgroundColor: '#EEF9FF',
    heroWaveColor: '#DFF4FF',
    primaryColor: '#16A6C9',
    primarySoftColor: '#EFFBFF',
    accentColor: '#FFD166',
    borderColor: '#BDE7F7',
    decorationColor: '#7BC6EF',
  },
  autumn: {
    id: 'autumn',
    name: '가을',
    message: '가을바람처럼 차분하게 배워볼까요?',
    backgroundColor: '#FFFFFF',
    heroBackgroundColor: '#FFF7EA',
    heroWaveColor: '#FBE6C9',
    primaryColor: '#D9822B',
    primarySoftColor: '#FFF7EC',
    accentColor: '#E8A13A',
    borderColor: '#F2D4AD',
    decorationColor: '#C98B4A',
  },
  winter: {
    id: 'winter',
    name: '겨울',
    message: '따뜻하게 오늘의 배움을 채워봐요.',
    backgroundColor: '#FFFFFF',
    heroBackgroundColor: '#F4F8FF',
    heroWaveColor: '#E4EFFB',
    primaryColor: '#3D7FA8',
    primarySoftColor: '#F2F7FC',
    accentColor: '#E9B84A',
    borderColor: '#C9DEED',
    decorationColor: '#8EC5E7',
  },
};

export const HOME_THEME_OPTIONS: { id: HomeThemeId; label: string }[] = [
  { id: 'auto', label: '계절에 맞게 자동 변경' },
  { id: 'spring', label: '봄 새싹' },
  { id: 'summer', label: '여름 하늘' },
  { id: 'autumn', label: '가을 독서' },
  { id: 'winter', label: '겨울 별빛' },
];

export const getSeasonThemeId = (date = new Date()): HomeSeasonThemeId => {
  const month = date.getMonth() + 1;
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
};

export const resolveHomeTheme = (themeId: HomeThemeId | string | null | undefined, date = new Date()): HomeTheme => {
  const resolvedId = themeId && themeId !== 'auto' && themeId in HOME_SEASON_THEMES
    ? themeId as HomeSeasonThemeId
    : getSeasonThemeId(date);

  return HOME_SEASON_THEMES[resolvedId];
};
