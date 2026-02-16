import { db, collection, doc, setDoc } from './firebase';

interface Problem {
  id: string;
  subject: string;
  grade: number;
  questionType: 'mcq' | 'ox' | 'subjective';
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  choices?: string[];
  correctAnswer: string;
  explanation: string;
  season?: string;
}

const SAMPLE_PROBLEMS: Problem[] = [
  // === 1학년 국어 ===
  { id: 'kr-1-001', subject: 'korean', grade: 1, questionType: 'mcq', difficulty: 'easy', question: '다음 중 받침이 있는 글자는 무엇일까요?', choices: ['나', '강', '그', '미'], correctAnswer: '강', explanation: '"강"은 "ㅇ" 받침이 있는 글자입니다.' },
  { id: 'kr-1-002', subject: 'korean', grade: 1, questionType: 'mcq', difficulty: 'easy', question: '"ㄱ"으로 시작하는 낱말은?', choices: ['사과', '바나나', '고구마', '딸기'], correctAnswer: '고구마', explanation: '"고구마"는 "ㄱ"으로 시작하는 낱말입니다.' },
  { id: 'kr-1-003', subject: 'korean', grade: 1, questionType: 'ox', difficulty: 'easy', question: '"사과"는 두 글자로 이루어진 낱말이다.', choices: ['O', 'X'], correctAnswer: 'O', explanation: '"사"와 "과" 두 글자로 이루어져 있습니다.' },

  // === 1학년 수학 ===
  { id: 'ma-1-001', subject: 'math', grade: 1, questionType: 'mcq', difficulty: 'easy', question: '3 + 2 = ?', choices: ['3', '4', '5', '6'], correctAnswer: '5', explanation: '3에 2를 더하면 5가 됩니다.' },
  { id: 'ma-1-002', subject: 'math', grade: 1, questionType: 'mcq', difficulty: 'easy', question: '7 - 4 = ?', choices: ['2', '3', '4', '5'], correctAnswer: '3', explanation: '7에서 4를 빼면 3이 됩니다.' },
  { id: 'ma-1-003', subject: 'math', grade: 1, questionType: 'ox', difficulty: 'easy', question: '5는 3보다 크다.', choices: ['O', 'X'], correctAnswer: 'O', explanation: '5는 3보다 2만큼 더 큰 수입니다.' },

  // === 1학년 통합교과 ===
  { id: 'ig-1-001', subject: 'integrated', grade: 1, questionType: 'mcq', difficulty: 'easy', question: '봄에 볼 수 있는 꽃은?', choices: ['코스모스', '개나리', '국화', '동백'], correctAnswer: '개나리', explanation: '개나리는 봄에 피는 대표적인 꽃입니다.' },
  { id: 'ig-1-002', subject: 'integrated', grade: 1, questionType: 'mcq', difficulty: 'easy', question: '학교에서 지켜야 할 약속이 아닌 것은?', choices: ['복도에서 뛰기', '인사하기', '차례 지키기', '정리정돈'], correctAnswer: '복도에서 뛰기', explanation: '복도에서는 뛰지 않고 걸어야 안전합니다.' },
  { id: 'ig-1-003', subject: 'integrated', grade: 1, questionType: 'ox', difficulty: 'easy', question: '가을에는 나뭇잎이 떨어진다.', choices: ['O', 'X'], correctAnswer: 'O', explanation: '가을에는 나뭇잎이 단풍이 들고 떨어집니다.' },

  // === 2학년 국어 ===
  { id: 'kr-2-001', subject: 'korean', grade: 2, questionType: 'mcq', difficulty: 'easy', question: '다음 중 흉내 내는 말은?', choices: ['사과', '반짝반짝', '학교', '연필'], correctAnswer: '반짝반짝', explanation: '"반짝반짝"은 빛이 나는 모양을 흉내 낸 말입니다.' },
  { id: 'kr-2-002', subject: 'korean', grade: 2, questionType: 'mcq', difficulty: 'easy', question: '"즐겁다"의 반대말은?', choices: ['기쁘다', '슬프다', '행복하다', '신나다'], correctAnswer: '슬프다', explanation: '"즐겁다"의 반대말은 "슬프다"입니다.' },
  { id: 'kr-2-003', subject: 'korean', grade: 2, questionType: 'ox', difficulty: 'easy', question: '"친구"와 "친구들"은 같은 뜻이다.', choices: ['O', 'X'], correctAnswer: 'X', explanation: '"친구"는 한 명, "친구들"은 여러 명을 뜻합니다.' },

  // === 2학년 수학 ===
  { id: 'ma-2-001', subject: 'math', grade: 2, questionType: 'mcq', difficulty: 'easy', question: '15 + 8 = ?', choices: ['22', '23', '24', '25'], correctAnswer: '23', explanation: '15에 8을 더하면 23이 됩니다.' },
  { id: 'ma-2-002', subject: 'math', grade: 2, questionType: 'mcq', difficulty: 'medium', question: '구구단 3 × 7 = ?', choices: ['18', '21', '24', '27'], correctAnswer: '21', explanation: '3 곱하기 7은 21입니다.' },
  { id: 'ma-2-003', subject: 'math', grade: 2, questionType: 'ox', difficulty: 'easy', question: '100은 세 자리 수이다.', choices: ['O', 'X'], correctAnswer: 'O', explanation: '100은 백의 자리가 있는 세 자리 수입니다.' },

  // === 2학년 통합교과 ===
  { id: 'ig-2-001', subject: 'integrated', grade: 2, questionType: 'mcq', difficulty: 'easy', question: '우리 동네에서 볼 수 있는 곳이 아닌 것은?', choices: ['우체국', '소방서', '우주정거장', '병원'], correctAnswer: '우주정거장', explanation: '우주정거장은 우리 동네에서 볼 수 없습니다.' },
  { id: 'ig-2-002', subject: 'integrated', grade: 2, questionType: 'mcq', difficulty: 'easy', question: '여름에 하면 좋은 활동은?', choices: ['스키타기', '수영하기', '눈사람만들기', '낙엽줍기'], correctAnswer: '수영하기', explanation: '여름에는 더위를 피해 수영을 하면 좋습니다.' },
  { id: 'ig-2-003', subject: 'integrated', grade: 2, questionType: 'ox', difficulty: 'easy', question: '겨울에는 낮이 짧고 밤이 길다.', choices: ['O', 'X'], correctAnswer: 'O', explanation: '겨울에는 해가 일찍 져서 낮이 짧고 밤이 깁니다.' },

  // === 3학년 국어 ===
  { id: 'kr-3-001', subject: 'korean', grade: 3, questionType: 'mcq', difficulty: 'medium', question: '다음 중 높임말이 바르게 쓰인 것은?', choices: ['할머니가 밥을 먹었다', '선생님이 말했다', '어머니께서 요리하셨다', '아빠가 잤다'], correctAnswer: '어머니께서 요리하셨다', explanation: '"께서"와 "-셨다"를 사용하여 높임말을 바르게 표현했습니다.' },
  { id: 'kr-3-002', subject: 'korean', grade: 3, questionType: 'mcq', difficulty: 'easy', question: '"학교"의 받침 개수는?', choices: ['0개', '1개', '2개', '3개'], correctAnswer: '1개', explanation: '"학"에 "ㄱ" 받침이 하나 있습니다.' },
  { id: 'kr-3-003', subject: 'korean', grade: 3, questionType: 'ox', difficulty: 'easy', question: '"달리다"는 움직임을 나타내는 말이다.', choices: ['O', 'X'], correctAnswer: 'O', explanation: '"달리다"는 동작을 나타내는 동사입니다.' },

  // === 3학년 수학 ===
  { id: 'ma-3-001', subject: 'math', grade: 3, questionType: 'mcq', difficulty: 'medium', question: '256 + 178 = ?', choices: ['424', '434', '444', '454'], correctAnswer: '434', explanation: '256 + 178 = 434 입니다.' },
  { id: 'ma-3-002', subject: 'math', grade: 3, questionType: 'mcq', difficulty: 'medium', question: '1km는 몇 m인가요?', choices: ['10m', '100m', '1000m', '10000m'], correctAnswer: '1000m', explanation: '1km = 1000m 입니다.' },
  { id: 'ma-3-003', subject: 'math', grade: 3, questionType: 'ox', difficulty: 'easy', question: '1/2은 반을 나타낸다.', choices: ['O', 'X'], correctAnswer: 'O', explanation: '1/2은 전체를 2로 나눈 것 중 1, 즉 반입니다.' },

  // === 3학년 과학 ===
  { id: 'sc-3-001', subject: 'science', grade: 3, questionType: 'mcq', difficulty: 'easy', question: '식물이 자라는 데 필요하지 않은 것은?', choices: ['물', '햇빛', '공기', '소금'], correctAnswer: '소금', explanation: '식물은 물, 햇빛, 공기가 필요하지만 소금은 필요하지 않습니다.' },
  { id: 'sc-3-002', subject: 'science', grade: 3, questionType: 'mcq', difficulty: 'medium', question: '물의 세 가지 상태가 아닌 것은?', choices: ['고체', '액체', '기체', '플라즈마'], correctAnswer: '플라즈마', explanation: '물의 세 가지 상태는 고체(얼음), 액체(물), 기체(수증기)입니다.' },
  { id: 'sc-3-003', subject: 'science', grade: 3, questionType: 'ox', difficulty: 'easy', question: '자석은 철을 끌어당긴다.', choices: ['O', 'X'], correctAnswer: 'O', explanation: '자석은 철로 된 물체를 끌어당기는 성질이 있습니다.' },

  // === 3학년 사회 ===
  { id: 'so-3-001', subject: 'social', grade: 3, questionType: 'mcq', difficulty: 'easy', question: '지도에서 위쪽은 어느 방향인가요?', choices: ['동', '서', '남', '북'], correctAnswer: '북', explanation: '지도에서 위쪽은 북쪽입니다.' },
  { id: 'so-3-002', subject: 'social', grade: 3, questionType: 'mcq', difficulty: 'medium', question: '우리 고장의 모습을 알 수 있는 것이 아닌 것은?', choices: ['지도', '사진', '그림', '일기예보'], correctAnswer: '일기예보', explanation: '일기예보는 날씨를 알려주는 것으로, 고장의 모습과는 다릅니다.' },
  { id: 'so-3-003', subject: 'social', grade: 3, questionType: 'ox', difficulty: 'easy', question: '시장에서는 물건을 사고판다.', choices: ['O', 'X'], correctAnswer: 'O', explanation: '시장은 물건을 사고파는 곳입니다.' },

  // === 3학년 영어 ===
  { id: 'en-3-001', subject: 'english', grade: 3, questionType: 'mcq', difficulty: 'easy', question: '"사과"를 영어로 하면?', choices: ['Banana', 'Orange', 'Apple', 'Grape'], correctAnswer: 'Apple', explanation: '사과는 영어로 Apple입니다.' },
  { id: 'en-3-002', subject: 'english', grade: 3, questionType: 'mcq', difficulty: 'easy', question: '"Hello"의 뜻은?', choices: ['안녕', '감사', '미안', '잘가'], correctAnswer: '안녕', explanation: '"Hello"는 "안녕"이라는 인사말입니다.' },
  { id: 'en-3-003', subject: 'english', grade: 3, questionType: 'ox', difficulty: 'easy', question: '"Dog"은 고양이를 뜻한다.', choices: ['O', 'X'], correctAnswer: 'X', explanation: '"Dog"은 개를 뜻합니다. 고양이는 "Cat"입니다.' },
];

export const uploadSampleProblems = async () => {
  let count = 0;
  for (const problem of SAMPLE_PROBLEMS) {
    await setDoc(doc(db, 'Problems', problem.id), {
      subject: problem.subject,
      grade: problem.grade,
      questionType: problem.questionType,
      difficulty: problem.difficulty,
      question: problem.question,
      choices: problem.choices || [],
      correctAnswer: problem.correctAnswer,
      explanation: problem.explanation,
      season: problem.season || null,
      isActive: true,
      createdAt: new Date(),
    });
    count++;
  }
  return count;
};

export const getProblemsForSubject = (subject: string, grade: number): Problem[] => {
  return SAMPLE_PROBLEMS.filter(p => p.subject === subject && p.grade === grade);
};

export { SAMPLE_PROBLEMS };
export type { Problem };
