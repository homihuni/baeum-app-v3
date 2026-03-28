import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal } from 'react-native';
import SafeLayout from '../../components/SafeLayout';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../utils/firebase';

export default function SerialScreen() {
  const router = useRouter();
  const { childId, childName } = useLocalSearchParams();
  const [serialCode, setSerialCode] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [failCount, setFailCount] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<Date | null>(null);

  const showErrorModal = (message: string) => {
    setModalTitle('안내');
    setModalMessage(message);
    setIsSuccess(false);
    setShowModal(true);
  };

  const handleRegister = async () => {
    if (lockedUntil && new Date() < lockedUntil) {
      const remainingSeconds = Math.ceil((lockedUntil.getTime() - Date.now()) / 1000);
      showErrorModal(`너무 많은 시도가 있었습니다.\n${remainingSeconds}초 후에 다시 시도해주세요.`);
      return;
    }

    if (!serialCode.trim()) {
      showErrorModal('시리얼 코드를 입력해주세요');
      return;
    }

    try {
      const serialDocRef = doc(db, 'Serials', serialCode.trim());
      const serialSnap = await getDoc(serialDocRef);

      if (!serialSnap.exists()) {
        const newFailCount = failCount + 1;
        setFailCount(newFailCount);

        if (newFailCount >= 5) {
          setLockedUntil(new Date(Date.now() + 60000));
          setFailCount(0);
          showErrorModal('5회 연속 실패했습니다.\n1분 후에 다시 시도해주세요.');
        } else {
          showErrorModal('유효하지 않은 시리얼 코드입니다');
        }
        return;
      }

      const serialData = serialSnap.data();

      if (serialData.isUsed) {
        const newFailCount = failCount + 1;
        setFailCount(newFailCount);

        if (newFailCount >= 5) {
          setLockedUntil(new Date(Date.now() + 60000));
          setFailCount(0);
          showErrorModal('5회 연속 실패했습니다.\n1분 후에 다시 시도해주세요.');
        } else {
          showErrorModal('이미 사용된 시리얼 코드입니다');
        }
        return;
      }

      const now = new Date();
      const expiry = serialData.expiry?.toDate();
      if (expiry && expiry < now) {
        const newFailCount = failCount + 1;
        setFailCount(newFailCount);

        if (newFailCount >= 5) {
          setLockedUntil(new Date(Date.now() + 60000));
          setFailCount(0);
          showErrorModal('5회 연속 실패했습니다.\n1분 후에 다시 시도해주세요.');
        } else {
          showErrorModal('만료된 시리얼 코드입니다');
        }
        return;
      }

      const parentId = await AsyncStorage.getItem('parentId');
      if (!parentId) {
        showErrorModal('사용자 정보를 찾을 수 없습니다');
        return;
      }

      await updateDoc(serialDocRef, {
        isUsed: true,
        usedBy: childId,
        usedAt: serverTimestamp(),
      });

      const childDocRef = doc(db, 'Parents', parentId, 'Children', childId as string);
      await updateDoc(childDocRef, {
        tier: 'baeum',
        serialCode: serialCode.trim(),
        serialExpiry: serialData.expiry ? serialData.expiry.toDate().toISOString() : null,
        serialCalendarYear: serialData.calendarYear || null,
      });

      setFailCount(0);

      const calendarYear = serialData.calendarYear || new Date().getFullYear();
      setModalTitle('시리얼 등록 완료!');
      setModalMessage(
        `${childName}이(가) 배움회원이 되었습니다.\n시리얼 유효기간은 다음 해 2월 28일까지입니다.`
      );
      setIsSuccess(true);
      setShowModal(true);
    } catch (error) {
      console.log('Serial registration error:', error);
      showErrorModal('시리얼 등록 중 오류가 발생했습니다');
    }
  };

  const handleModalConfirm = () => {
    setShowModal(false);
    if (isSuccess) {
      router.back();
    }
  };

  return (
    <SafeLayout>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>시리얼 등록</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.content}>
        <Text style={styles.infoText}>{childName}의 시리얼 코드를 입력해주세요</Text>

        <TextInput
          style={styles.input}
          value={serialCode}
          onChangeText={setSerialCode}
          placeholder="예: 26JH26A7K3"
          placeholderTextColor="#999"
          autoCapitalize="characters"
          maxLength={10}
        />

        <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
          <Text style={styles.registerButtonText}>등록하기</Text>
        </TouchableOpacity>

        <Text style={styles.hintText}>배움달력 뒷면의 시리얼번호 10자리를 입력해주세요</Text>
      </View>

      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{modalTitle}</Text>
            <Text style={styles.modalMessage}>{modalMessage}</Text>
            <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleModalConfirm}>
              <Text style={styles.modalConfirmText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 24,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
  },
  registerButton: {
    backgroundColor: '#4A90D9',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  hintText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalBox: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: 300,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  modalMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalConfirmBtn: {
    backgroundColor: '#4A90D9',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
