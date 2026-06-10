export const SUBJECT_THEME: Record<string, { label: string; primary: string; soft: string; accent: string }> = {
  korean: {
    label: '국어',
    primary: '#F58AA0',
    soft: '#FFF1F4',
    accent: '#E76C86',
  },
  math: {
    label: '수학',
    primary: '#4D8DF7',
    soft: '#EEF5FF',
    accent: '#2F6FE4',
  },
  integrated: {
    label: '통합교과',
    primary: '#6FBE72',
    soft: '#F1FAF0',
    accent: '#4E9F54',
  },
};

export const GRADE_THEME = {
  lower: {
    grades: [1, 2],
    radius: 28,
    questionFontSize: 28,
    answerFontSize: 22,
    optionMinHeight: 76,
    decorationLevel: 'high',
  },
};
