import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';

export default function ResultScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🎉</Text>
        <Text style={styles.resultTitle}>정답이에요!</Text>
        <Text style={styles.answerText}>정답: ② 강</Text>

        <View style={styles.explanationCard}>
          <Text style={styles.explanationTitle}>💡 해설</Text>
          <Text style={styles.explanationText}>
            '강'은 'ㅇ' 받침이 있는 글자예요. 나, 아, 오는 받침이 없는 글자랍니다.
          </Text>
        </View>
      </View>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.nextButton}>
          <Text style={styles.nextButtonText}>다음 문제 →</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quitButton}>
          <Text style={styles.quitButtonText}>학습 그만하기</Text>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 64,
  },
  resultTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#7ED4C0',
    marginTop: 16,
  },
  answerText: {
    fontSize: 16,
    color: '#333333',
    marginTop: 8,
  },
  explanationCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 24,
    marginTop: 24,
    alignSelf: 'stretch',
  },
  explanationTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333333',
  },
  explanationText: {
    fontSize: 14,
    color: '#333333',
    marginTop: 8,
    lineHeight: 22,
  },
  buttonsContainer: {
    marginHorizontal: 24,
    marginBottom: 24,
  },
  nextButton: {
    backgroundColor: '#7ED4C0',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  quitButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  quitButtonText: {
    color: '#999999',
    fontSize: 16,
  },
});
