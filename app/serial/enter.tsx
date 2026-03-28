import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, Modal, ScrollView, Image, ImageSourcePropType } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSerialCode, useSerialCode, upgradeChildTier, getChild } from '../../utils/firestore';
import { DEFAULT_AVATAR, resolveAvatar } from '../../utils/avatars';

export default function EnterSerialScreen() {
  const router = useRouter();
  const [parentId, setParentId] = useState('');
  const [childId, setChildId] = useState('');
  const [childName, setChildName] = useState('');
  const [childAvatar, setChildAvatar] = useState<ImageSourcePropType>(DEFAULT_AVATAR);
  const [childGrade, setChildGrade] = useState('1');
  const [serialCode, setSerialCode] = useState('');
  const [serial1, setSerial1] = useState('');
  const [serial2, setSerial2] = useState('');
  const [serial3, setSerial3] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'error' | 'success'>('error');
  const [isVerified, setIsVerified] = useState(false);

  const input1Ref = useRef<TextInput>(null);
  const input2Ref = useRef<TextInput>(null);
  const input3Ref = useRef<TextInput>(null);

  useEffect(() => {
    loadChildData();
  }, []);

  const loadChildData = async () => {
    try {
      const pId = await AsyncStorage.getItem('parentId');
      const cId = await AsyncStorage.getItem('childId');

      if (!pId || !cId) {
        console.log('No parentId or childId');
        return;
      }

      setParentId(pId);
      setChildId(cId);

      const childData = await getChild(pId, cId) as any;
      if (childData) {
        setChildName(childData.name || '학생');
        setChildAvatar(resolveAvatar(childData.avatar));
        setChildGrade(childData.grade?.toString() || '1');

        if (childData.tier === 'baeum' || childData.tier === 'sky') {
          setIsVerified(true);
          setSerialCode(childData.serialNumber || '');
          if (childData.serialNumber) {
            const sn = childData.serialNumber;
            setSerial1(sn.substring(0, 4));
            setSerial2(sn.substring(4, 6));
            setSerial3(sn.substring(6, 10));
          }
          console.log("이미 인증된 회원:", childData.tier);
        }
      }
    } catch (error) {
      console.log('Load child error:', error);
    } finally {
      setLoading(false);
    }
  };

  const showErrorModal = (title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType('error');
    setShowModal(true);
  };

  const showSuccessModal = (title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType('success');
    setShowModal(true);
  };

  const handleVerify = async () => {
    console.log('=== 인증 버튼 클릭 ===');
    const fullSerialCode = serial1 + serial2 + serial3;
    console.log('입력값:', fullSerialCode);

    const trimmedCode = fullSerialCode.trim();

    if (!trimmedCode) {
      showErrorModal('입력 오류', '시리얼번호를 입력해주세요');
      return;
    }

    const serialRegex = /^[A-Z0-9]{10}$/;
    if (!serialRegex.test(trimmedCode)) {
      showErrorModal('시리얼 번호 확인', '시리얼번호를 다시 확인해주세요.\n배움달력 뒷면의 10자리를 입력해주세요.\n(예: 26JH26A7K3)');
      return;
    }

    try {
      console.log('=== Firestore 조회 ===');
      const serialData = await getSerialCode(trimmedCode);
      console.log('조회 결과:', serialData);

      if (!serialData) {
        showErrorModal('인증 실패', '유효하지 않은 시리얼번호입니다');
        return;
      }

      if (serialData.isUsed === true) {
        showErrorModal('인증 실패', '이미 사용된 시리얼번호입니다');
        return;
      }

      console.log('=== 시리얼 사용 처리 시작 ===');
      await useSerialCode(trimmedCode, childId);
      console.log('=== 시리얼 사용 처리 완료 ===');

      console.log('=== 등급 업그레이드 시작 ===');
      await upgradeChildTier(parentId, childId, 'baeum', trimmedCode, serialData.expiry, serialData.calendarYear);
      console.log('=== 등급 업그레이드 성공 ===');

      await AsyncStorage.setItem('childTier', 'baeum');
      console.log("AsyncStorage childTier 저장: baeum");

      setIsVerified(true);
      console.log('인증 완료, isVerified:', true);
      showSuccessModal('등록 완료', '배움회원으로 업그레이드되었습니다 🎉');
    } catch (error) {
      console.log('=== 인증 에러 ===', error);
      showErrorModal('오류', '인증 처리 중 오류가 발생했습니다');
    }
  };

  const handleModalConfirm = () => {
    setShowModal(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>로딩 중...</Text>
      </SafeAreaView>
    );
  }

  console.log("현재 isVerified:", isVerified);

  const fullSerialCode = serial1 + serial2 + serial3;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(auth)/select-child')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>시리얼번호 입력</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.childInfoCard}>
          <Image source={childAvatar} style={styles.avatarImage} />
          <View style={styles.childInfoText}>
            <Text style={styles.childName}>{childName}</Text>
            <Text style={styles.childGrade}>{childGrade}학년</Text>
          </View>
        </View>

        <Text style={styles.infoText}>이 자녀에게 시리얼번호를 등록합니다</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>시리얼번호</Text>
          <View style={styles.serialInputRow}>
            <TextInput
              ref={input1Ref}
              style={[styles.serialInput, styles.serialInput4, isVerified && styles.inputDisabled]}
              value={serial1}
              onChangeText={(text) => {
                const upper = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
                setSerial1(upper);
                if (upper.length === 4) input2Ref.current?.focus();
              }}
              placeholder="XXXX"
              placeholderTextColor="#999"
              maxLength={4}
              autoCapitalize="characters"
              editable={!isVerified}
            />
            <Text style={styles.serialDash}>-</Text>
            <TextInput
              ref={input2Ref}
              style={[styles.serialInput, styles.serialInput2, isVerified && styles.inputDisabled]}
              value={serial2}
              onChangeText={(text) => {
                const upper = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
                setSerial2(upper);
                if (upper.length === 2) input3Ref.current?.focus();
                if (upper.length === 0) input1Ref.current?.focus();
              }}
              placeholder="XX"
              placeholderTextColor="#999"
              maxLength={2}
              autoCapitalize="characters"
              editable={!isVerified}
            />
            <Text style={styles.serialDash}>-</Text>
            <TextInput
              ref={input3Ref}
              style={[styles.serialInput, styles.serialInput4, isVerified && styles.inputDisabled]}
              value={serial3}
              onChangeText={(text) => {
                const upper = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
                setSerial3(upper);
                if (upper.length === 0) input2Ref.current?.focus();
              }}
              placeholder="XXXX"
              placeholderTextColor="#999"
              maxLength={4}
              autoCapitalize="characters"
              editable={!isVerified}
            />
          </View>
          <Text style={styles.charCount}>{fullSerialCode.length}/10</Text>
        </View>

        <View style={styles.guideBox}>
          <Text style={styles.guideText}>📖 배움달력 뒷면의 시리얼번호 10자리를 입력해주세요</Text>
          <Text style={styles.guideWarning}>⚠️ 시리얼 유효기간은 다음 해 2월 28일까지입니다.</Text>
        </View>

        <TouchableOpacity
          style={[styles.verifyButton, isVerified && styles.verifyButtonDisabled]}
          onPress={handleVerify}
          disabled={isVerified}
        >
          <Text style={styles.verifyButtonText}>
            {isVerified ? '✅ 인증완료' : '등록하기'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

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
    </SafeAreaView>
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
    padding: 16,
  },
  loadingText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20,
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  childInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9F7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#5BBFAA',
    gap: 16,
  },
  childInfoText: {
    flex: 1,
  },
  childName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  childGrade: {
    fontSize: 14,
    color: '#666',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  inputDisabled: {
    backgroundColor: '#E0E0E0',
    color: '#999',
  },
  serialInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  serialInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    color: '#333',
    fontWeight: 'bold',
    letterSpacing: 2,
    textAlign: 'center',
  },
  serialInput4: {
    flex: 4,
  },
  serialInput2: {
    flex: 2,
  },
  serialDash: {
    fontSize: 20,
    color: '#999',
    fontWeight: 'bold',
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  guideBox: {
    backgroundColor: '#FFF9E6',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FFE69C',
  },
  guideText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  guideWarning: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
  verifyButton: {
    backgroundColor: '#5BBFAA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  verifyButtonDisabled: {
    backgroundColor: '#B0BEC5',
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
    width: 280,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalConfirmBtn: {
    backgroundColor: '#5BBFAA',
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderRadius: 8,
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
});
