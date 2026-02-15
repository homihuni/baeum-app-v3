import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { useState } from 'react';

export default function CreateProfileScreen() {
  const [selectedGrade, setSelectedGrade] = useState('3학년');
  const [selectedGender, setSelectedGender] = useState('남자');

  const grades = ['1학년', '2학년', '3학년', '4학년', '5학년', '6학년'];
  const genders = ['남자', '여자'];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>자녀 프로필 만들기</Text>
        <Text style={styles.subtitle}>학습할 자녀의 정보를 입력해주세요</Text>

        <View style={styles.profileImageSection}>
          <View style={styles.profileCircle}>
            <Text style={styles.profileEmoji}>🍓</Text>
          </View>
          <Text style={styles.profileSelectText}>프로필 선택</Text>
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.label}>자녀 이름</Text>
          <TextInput
            style={styles.textInput}
            placeholder="이름을 입력하세요"
            placeholderTextColor="#999999"
          />

          <Text style={[styles.label, styles.labelMarginTop]}>생년월일</Text>
          <TextInput
            style={styles.textInput}
            placeholder="2018-01-01"
            placeholderTextColor="#999999"
          />

          <Text style={[styles.label, styles.labelMarginTop]}>학년</Text>
          <View style={styles.buttonRow}>
            {grades.map((grade) => (
              <TouchableOpacity
                key={grade}
                style={[
                  styles.gradeButton,
                  selectedGrade === grade && styles.gradeButtonSelected,
                ]}
                onPress={() => setSelectedGrade(grade)}
              >
                <Text
                  style={[
                    styles.gradeButtonText,
                    selectedGrade === grade && styles.gradeButtonTextSelected,
                  ]}
                >
                  {grade}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, styles.labelMarginTop]}>성별</Text>
          <View style={styles.buttonRow}>
            {genders.map((gender) => (
              <TouchableOpacity
                key={gender}
                style={[
                  styles.genderButton,
                  selectedGender === gender && styles.genderButtonSelected,
                ]}
                onPress={() => setSelectedGender(gender)}
              >
                <Text
                  style={[
                    styles.genderButtonText,
                    selectedGender === gender && styles.genderButtonTextSelected,
                  ]}
                >
                  {gender}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.bottomButtonContainer}>
          <TouchableOpacity style={styles.submitButton}>
            <Text style={styles.submitButtonText}>프로필 만들기</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#7ED4C0',
    textAlign: 'center',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginTop: 8,
  },
  profileImageSection: {
    alignItems: 'center',
    marginTop: 24,
  },
  profileCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#7ED4C0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileEmoji: {
    fontSize: 40,
  },
  profileSelectText: {
    fontSize: 12,
    color: '#999999',
    marginTop: 8,
  },
  inputSection: {
    marginHorizontal: 24,
    marginTop: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 6,
  },
  labelMarginTop: {
    marginTop: 16,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#333333',
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gradeButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  gradeButtonSelected: {
    backgroundColor: '#7ED4C0',
    borderWidth: 0,
  },
  gradeButtonText: {
    fontSize: 14,
    color: '#333333',
  },
  gradeButtonTextSelected: {
    color: '#FFFFFF',
  },
  genderButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flex: 1,
    alignItems: 'center',
  },
  genderButtonSelected: {
    backgroundColor: '#7ED4C0',
    borderWidth: 0,
  },
  genderButtonText: {
    fontSize: 14,
    color: '#333333',
  },
  genderButtonTextSelected: {
    color: '#FFFFFF',
  },
  bottomButtonContainer: {
    margin: 24,
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
