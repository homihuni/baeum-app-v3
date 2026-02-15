import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';

export default function QuestionsScreen() {
  const choices = [
    { id: 1, text: '① 나' },
    { id: 2, text: '② 강' },
    { id: 3, text: '③ 아' },
    { id: 4, text: '④ 오' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.topBarSubject}>국어</Text>
        <Text style={styles.topBarProgress}>1 / 3</Text>
        <Text style={styles.topBarClose}>✕</Text>
      </View>

      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarFill} />
      </View>

      <View style={styles.questionSection}>
        <Text style={styles.questionNumber}>Q1</Text>
        <Text style={styles.questionText}>
          다음 중 받침이 있는 글자는 무엇일까요?
        </Text>
      </View>

      <View style={styles.choicesContainer}>
        {choices.map((choice) => (
          <TouchableOpacity key={choice.id} style={styles.choiceButton}>
            <Text style={styles.choiceText}>{choice.text}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity style={styles.submitButton}>
          <Text style={styles.submitButtonText}>정답 확인</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  topBarSubject: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7ED4C0',
  },
  topBarProgress: {
    fontSize: 14,
    color: '#333333',
  },
  topBarClose: {
    fontSize: 20,
    color: '#333333',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 16,
    borderRadius: 3,
  },
  progressBarFill: {
    width: '33%',
    height: '100%',
    backgroundColor: '#7ED4C0',
    borderRadius: 3,
  },
  questionSection: {
    margin: 24,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#7ED4C0',
  },
  questionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 8,
    lineHeight: 26,
  },
  choicesContainer: {
    marginHorizontal: 24,
  },
  choiceButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  choiceText: {
    fontSize: 16,
    color: '#333333',
  },
  bottomButtonContainer: {
    margin: 24,
    marginTop: 'auto',
  },
  submitButton: {
    backgroundColor: '#7ED4C0',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
