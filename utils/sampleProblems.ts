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
  { id: 'kr-2-004', subject: 'korean', grade: 2, questionType: 'mcq', difficulty: 'easy', question: '다음 중 꾸며 주는 말이 있는 문장은?', choices: ['예쁜 꽃이 피었다', '나는 학교에 간다', '밥을 먹었다', '책을 읽었다'], correctAnswer: '예쁜 꽃이 피었다', explanation: '"예쁜"이 "꽃"을 꾸며 주는 말입니다.' },
  { id: 'kr-2-005', subject: 'korean', grade: 2, questionType: 'mcq', difficulty: 'easy', question: '"ㅎ"으로 시작하는 낱말은?', choices: ['가방', '하늘', '나무', '다리'], correctAnswer: '하늘', explanation: '"하늘"은 "ㅎ"으로 시작하는 낱말입니다.' },
  { id: 'kr-2-006', subject: 'korean', grade: 2, questionType: 'mcq', difficulty: 'medium', question: '다음 중 높임말로 바르게 고친 것은?', choices: ['할머니가 밥을 먹었다 → 할머니께서 진지를 드셨다', '할머니가 밥을 먹었다 → 할머니가 밥을 먹었습니다', '할머니가 밥을 먹었다 → 할머니 밥 먹었어', '할머니가 밥을 먹었다 → 할머니가 밥을 드셨다'], correctAnswer: '할머니가 밥을 먹었다 → 할머니께서 진지를 드셨다', explanation: '할머니를 높이려면 "께서", 밥은 "진지", 먹다는 "드시다"로 바꿉니다.' },
  { id: 'kr-2-007', subject: 'korean', grade: 2, questionType: 'mcq', difficulty: 'medium', question: '일기에 꼭 들어가야 하는 것이 아닌 것은?', choices: ['날짜', '날씨', '친구 전화번호', '있었던 일'], correctAnswer: '친구 전화번호', explanation: '일기에는 날짜, 날씨, 있었던 일, 느낀 점을 씁니다.' },
  { id: 'kr-2-008', subject: 'korean', grade: 2, questionType: 'mcq', difficulty: 'medium', question: '"사과"를 소리 나는 대로 쓰면?', choices: ['사과', '사꽈', '사콰', '사가'], correctAnswer: '사과', explanation: '"사과"는 소리와 표기가 같은 낱말입니다.' },
  { id: 'kr-2-009', subject: 'korean', grade: 2, questionType: 'mcq', difficulty: 'medium', question: '다음 중 느낌을 나타내는 말은?', choices: ['빨간', '신나는', '동그란', '커다란'], correctAnswer: '신나는', explanation: '"신나는"은 기분이나 느낌을 나타내는 말입니다.' },
  { id: 'kr-2-010', subject: 'korean', grade: 2, questionType: 'mcq', difficulty: 'medium', question: '편지를 쓸 때 가장 먼저 쓰는 것은?', choices: ['하고 싶은 말', '받는 사람 이름', '보내는 날짜', '내 이름'], correctAnswer: '받는 사람 이름', explanation: '편지는 받는 사람의 이름을 먼저 쓰고 인사말을 씁니다.' },
  { id: 'kr-2-011', subject: 'korean', grade: 2, questionType: 'mcq', difficulty: 'hard', question: '다음 문장에서 틀린 띄어쓰기를 찾으세요: "나는오늘 학교에 갔다"', choices: ['나는오늘', '학교에', '갔다', '틀린 곳 없음'], correctAnswer: '나는오늘', explanation: '"나는"과 "오늘" 사이를 띄어야 합니다. "나는 오늘"이 맞습니다.' },
  { id: 'kr-2-012', subject: 'korean', grade: 2, questionType: 'mcq', difficulty: 'hard', question: '다음 중 이야기의 순서가 바른 것은? ① 학교에 도착했다 ② 아침에 일어났다 ③ 집에서 출발했다', choices: ['①②③', '②③①', '③②①', '②①③'], correctAnswer: '②③①', explanation: '아침에 일어나서(②) 집에서 출발하고(③) 학교에 도착합니다(①).' },
  { id: 'kr-2-013', subject: 'korean', grade: 2, questionType: 'mcq', difficulty: 'hard', question: '"바람이 살랑살랑 분다"에서 "살랑살랑"은 어떤 종류의 말인가요?', choices: ['움직임을 나타내는 말', '소리를 흉내 내는 말', '모양을 흉내 내는 말', '느낌을 나타내는 말'], correctAnswer: '모양을 흉내 내는 말', explanation: '"살랑살랑"은 바람이 부는 모양을 흉내 낸 의태어입니다.' },
  { id: 'kr-2-014', subject: 'korean', grade: 2, questionType: 'mcq', difficulty: 'hard', question: '다음 글을 읽고 글쓴이의 마음으로 알맞은 것은? "시험에서 100점을 받았다. 엄마한테 빨리 보여드리고 싶다."', choices: ['슬프다', '무섭다', '기쁘다', '화난다'], correctAnswer: '기쁘다', explanation: '100점을 받아서 빨리 보여드리고 싶으니 기쁜 마음입니다.' },
  { id: 'kr-2-015', subject: 'korean', grade: 2, questionType: 'mcq', difficulty: 'hard', question: '다음 중 의견을 나타내는 문장은?', choices: ['오늘 비가 왔다', '교실에 학생이 있다', '우리 반은 더 깨끗해야 한다', '사과는 빨간색이다'], correctAnswer: '우리 반은 더 깨끗해야 한다', explanation: '"~해야 한다"는 자신의 생각이나 의견을 나타내는 표현입니다.' },

  // === 2학년 수학 ===
  { id: 'ma-2-001', subject: 'math', grade: 2, questionType: 'mcq', difficulty: 'easy', question: '15 + 8 = ?', choices: ['22', '23', '24', '25'], correctAnswer: '23', explanation: '15에 8을 더하면 23이 됩니다.' },
  { id: 'ma-2-002', subject: 'math', grade: 2, questionType: 'mcq', difficulty: 'medium', question: '구구단 3 × 7 = ?', choices: ['18', '21', '24', '27'], correctAnswer: '21', explanation: '3 곱하기 7은 21입니다.' },
  { id: 'ma-2-003', subject: 'math', grade: 2, questionType: 'ox', difficulty: 'easy', question: '100은 세 자리 수이다.', choices: ['O', 'X'], correctAnswer: 'O', explanation: '100은 백의 자리가 있는 세 자리 수입니다.' },
  { id: 'ma-2-004', subject: 'math', grade: 2, questionType: 'mcq', difficulty: 'easy', question: '25 + 13 = ?', choices: ['36', '37', '38', '39'], correctAnswer: '38', explanation: '25에 13을 더하면 38입니다.' },
  { id: 'ma-2-005', subject: 'math', grade: 2, questionType: 'mcq', difficulty: 'easy', question: '다음 중 가장 큰 수는?', choices: ['199', '210', '189', '201'], correctAnswer: '210', explanation: '210이 가장 큰 세 자리 수입니다.' },
  { id: 'ma-2-006', subject: 'math', grade: 2, questionType: 'mcq', difficulty: 'medium', question: '42 - 17 = ?', choices: ['24', '25', '26', '27'], correctAnswer: '25', explanation: '42에서 17을 빼면 25입니다. 받아내림이 필요합니다.' },
  { id: 'ma-2-007', subject: 'math', grade: 2, questionType: 'mcq', difficulty: 'medium', question: '1m는 몇 cm인가요?', choices: ['10cm', '50cm', '100cm', '1000cm'], correctAnswer: '100cm', explanation: '1미터는 100센티미터입니다.' },
  { id: 'ma-2-008', subject: 'math', grade: 2, questionType: 'mcq', difficulty: 'medium', question: '구구단 5 × 6 = ?', choices: ['25', '30', '35', '40'], correctAnswer: '30', explanation: '5 곱하기 6은 30입니다.' },
  { id: 'ma-2-009', subject: 'math', grade: 2, questionType: 'mcq', difficulty: 'medium', question: '시계가 3시 30분을 가리킬 때, 긴 바늘은 어디를 가리키나요?', choices: ['12', '3', '6', '9'], correctAnswer: '6', explanation: '30분일 때 긴 바늘(분침)은 6을 가리킵니다.' },
  { id: 'ma-2-010', subject: 'math', grade: 2, questionType: 'mcq', difficulty: 'medium', question: '다음 중 삼각형은 몇 개의 꼭짓점을 가지고 있나요?', choices: ['2개', '3개', '4개', '5개'], correctAnswer: '3개', explanation: '삼각형은 3개의 꼭짓점, 3개의 변을 가지고 있습니다.' },
  { id: 'ma-2-011', subject: 'math', grade: 2, questionType: 'mcq', difficulty: 'hard', question: '63 + 28 = ?', choices: ['81', '91', '89', '92'], correctAnswer: '91', explanation: '63에 28을 더하면 91입니다. 일의 자리에서 받아올림이 있습니다.' },
  { id: 'ma-2-012', subject: 'math', grade: 2, questionType: 'mcq', difficulty: 'hard', question: '□ × 4 = 32 에서 □에 들어갈 수는?', choices: ['6', '7', '8', '9'], correctAnswer: '8', explanation: '8 × 4 = 32이므로 □는 8입니다.' },
  { id: 'ma-2-013', subject: 'math', grade: 2, questionType: 'mcq', difficulty: 'hard', question: '2, 4, 6, 8, □ 에서 □에 들어갈 수는?', choices: ['9', '10', '11', '12'], correctAnswer: '10', explanation: '2씩 커지는 규칙이므로 8 다음은 10입니다.' },
  { id: 'ma-2-014', subject: 'math', grade: 2, questionType: 'mcq', difficulty: 'hard', question: '사과 3봉지에 각 봉지마다 6개씩 들어있습니다. 사과는 모두 몇 개?', choices: ['9개', '12개', '15개', '18개'], correctAnswer: '18개', explanation: '3 × 6 = 18이므로 사과는 모두 18개입니다.' },
  { id: 'ma-2-015', subject: 'math', grade: 2, questionType: 'mcq', difficulty: 'hard', question: '연필 24자루를 6명에게 똑같이 나누면 한 명에게 몇 자루?', choices: ['3자루', '4자루', '5자루', '6자루'], correctAnswer: '4자루', explanation: '24 ÷ 6 = 4이므로 한 명에게 4자루입니다.' },

  // === 2학년 통합교과 ===
  { id: 'ig-2-001', subject: 'integrated', grade: 2, questionType: 'mcq', difficulty: 'easy', question: '우리 동네에서 볼 수 있는 곳이 아닌 것은?', choices: ['우체국', '소방서', '우주정거장', '병원'], correctAnswer: '우주정거장', explanation: '우주정거장은 우리 동네에서 볼 수 없습니다.' },
  { id: 'ig-2-002', subject: 'integrated', grade: 2, questionType: 'mcq', difficulty: 'easy', question: '여름에 하면 좋은 활동은?', choices: ['스키타기', '수영하기', '눈사람만들기', '낙엽줍기'], correctAnswer: '수영하기', explanation: '여름에는 더위를 피해 수영을 하면 좋습니다.' },
  { id: 'ig-2-003', subject: 'integrated', grade: 2, questionType: 'ox', difficulty: 'easy', question: '겨울에는 낮이 짧고 밤이 길다.', choices: ['O', 'X'], correctAnswer: 'O', explanation: '겨울에는 해가 일찍 져서 낮이 짧고 밤이 깁니다.' },
  { id: 'ig-2-004', subject: 'integrated', grade: 2, questionType: 'mcq', difficulty: 'easy', question: '봄에 볼 수 있는 꽃은?', choices: ['코스모스', '개나리', '해바라기', '국화'], correctAnswer: '개나리', explanation: '개나리는 봄에 노란색으로 피는 꽃입니다.' },
  { id: 'ig-2-005', subject: 'integrated', grade: 2, questionType: 'mcq', difficulty: 'easy', question: '가족 중 아빠의 어머니를 부르는 말은?', choices: ['이모', '고모', '외할머니', '할머니'], correctAnswer: '할머니', explanation: '아빠의 어머니는 할머니라고 부릅니다.' },
  { id: 'ig-2-006', subject: 'integrated', grade: 2, questionType: 'mcq', difficulty: 'medium', question: '가을에 할 수 있는 활동으로 알맞은 것은?', choices: ['눈싸움', '수영', '단풍놀이', '꽃구경'], correctAnswer: '단풍놀이', explanation: '가을에는 나뭇잎이 빨갛고 노랗게 변하여 단풍놀이를 합니다.' },
  { id: 'ig-2-007', subject: 'integrated', grade: 2, questionType: 'mcq', difficulty: 'medium', question: '마을에서 아픈 사람을 돌봐주는 곳은?', choices: ['도서관', '소방서', '병원', '우체국'], correctAnswer: '병원', explanation: '병원은 아픈 사람을 진찰하고 치료하는 곳입니다.' },
  { id: 'ig-2-008', subject: 'integrated', grade: 2, questionType: 'mcq', difficulty: 'medium', question: '물건을 살 때 사용하는 것은?', choices: ['편지', '돈', '일기장', '색연필'], correctAnswer: '돈', explanation: '물건을 사려면 돈을 내고 물건을 받습니다.' },
  { id: 'ig-2-009', subject: 'integrated', grade: 2, questionType: 'mcq', difficulty: 'medium', question: '다음 중 겨울에 입는 옷으로 알맞은 것은?', choices: ['반팔 티셔츠', '반바지', '두꺼운 패딩', '민소매'], correctAnswer: '두꺼운 패딩', explanation: '겨울에는 추우므로 두꺼운 옷을 입어야 합니다.' },
  { id: 'ig-2-010', subject: 'integrated', grade: 2, questionType: 'mcq', difficulty: 'medium', question: '길을 건널 때 가장 먼저 해야 할 일은?', choices: ['빨리 뛰어간다', '좌우를 살핀다', '친구와 이야기한다', '핸드폰을 본다'], correctAnswer: '좌우를 살핀다', explanation: '길을 건널 때는 먼저 좌우를 살펴 차가 오는지 확인해야 합니다.' },
  { id: 'ig-2-011', subject: 'integrated', grade: 2, questionType: 'mcq', difficulty: 'hard', question: '다른 나라의 인사 방법으로 맞는 것은?', choices: ['모든 나라가 악수를 한다', '나라마다 인사 방법이 다르다', '인사를 안 하는 나라도 있다', '모든 나라가 절을 한다'], correctAnswer: '나라마다 인사 방법이 다르다', explanation: '한국은 절, 서양은 악수나 포옹 등 나라마다 인사법이 다릅니다.' },
  { id: 'ig-2-012', subject: 'integrated', grade: 2, questionType: 'mcq', difficulty: 'hard', question: '존경하는 인물의 공통점으로 알맞은 것은?', choices: ['키가 크다', '돈이 많다', '다른 사람을 위해 노력했다', '유명하다'], correctAnswer: '다른 사람을 위해 노력했다', explanation: '존경받는 인물들은 다른 사람이나 나라를 위해 노력한 점이 공통입니다.' },
  { id: 'ig-2-013', subject: 'integrated', grade: 2, questionType: 'mcq', difficulty: 'hard', question: '물건을 아껴 쓰는 방법이 아닌 것은?', choices: ['연필을 끝까지 사용한다', '쓰지 않는 물건은 버린다', '고장 난 물건을 고쳐 쓴다', '필요한 만큼만 산다'], correctAnswer: '쓰지 않는 물건은 버린다', explanation: '쓰지 않는 물건은 필요한 사람에게 나눠주는 것이 아끼는 방법입니다.' },
  { id: 'ig-2-014', subject: 'integrated', grade: 2, questionType: 'mcq', difficulty: 'hard', question: '우리나라를 상징하는 꽃은?', choices: ['장미', '무궁화', '튤립', '벚꽃'], correctAnswer: '무궁화', explanation: '무궁화는 우리나라를 대표하는 나라꽃입니다.' },
  { id: 'ig-2-015', subject: 'integrated', grade: 2, questionType: 'mcq', difficulty: 'hard', question: '1년을 마무리하는 12월에 하면 좋은 일은?', choices: ['새 학용품 사기', '올해를 돌아보고 감사하기', '여름 옷 준비하기', '운동회 준비하기'], correctAnswer: '올해를 돌아보고 감사하기', explanation: '12월에는 한 해를 돌아보며 감사한 일을 떠올려 봅니다.' },

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
