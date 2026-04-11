import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, ScrollView, Image, ImageSourcePropType } from 'react-native';
import SafeLayout from '../../components/SafeLayout';
import BottomTabBar from '../../components/BottomTabBar';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSerialCode, useSerialCode, upgradeChildTier, getChild } from '../../utils/firestore';
import { DEFAULT_AVATAR, resolveAvatar } from '../../utils/avatars';

function formatSerial(raw: string): string {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (clean.length <= 4) return clean;
  if (clean.length <= 6) return clean.slice(0, 4) + '-' + clean.slice(4);
  return clean.slice(0, 4) + '-' + clean.slice(4, 6) + '-' + clean.slice(6, 10);
}

export default function EnterSerialScreen() {
  const router = useRouter();
  const [parentId, setParentId] = useState('');
  const [childId, setChildId] = useState('');
  const [childName, setChildName] = useState('');
  const [childAvatar, setChildAvatar] = useState<ImageSourcePropType>(DEFAULT_AVATAR);
  const [childGrade, setChildGrade] = useState('1');
  const [serialCode, setSerialCode] = useState('');
  const [serialDisplay, setSerialDisplay] = useState('');
  const [serialRaw, setSerialRaw] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'error' | 'success'>('error');
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    loadChildData();
  }, []);

  const loadChildData = async () => {
    try {
      const pId = await AsyncStorage.getItem('parentId');
      const cId = await AsyncStorage.getItem('childId');
      if (!pId || !cId) return;

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
            setSerialRaw(childData.serialNumber);
            setSerialDisplay(formatSerial(childData.serialNumber));
          }
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
    const trimmedCode = serialRaw.trim();

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
      const serialData = await getSerialCode(trimmedCode);
      if (!serialData) {
        showErrorModal('인증 실패', '유효하지 않은 시리얼번호입니다');
        return;
      }
      if (serialData.isUsed === true) {
        showErrorModal('인증 실패', '이미 사용된 시리얼번호입니다');
        return;
      }

      await useSerialCode(trimmedCode, childId);
      await upgradeChildTier(parentId, childId, 'baeum', trimmedCode, serialData.expiry, serialData.calendarYear);
      await AsyncStorage.setItem('childTier', 'baeum');

      setIsVerified(true);
      showSuccessModal('등록 완료', '배움회원으로 업그레이드되었습니다 🎉');
    } catch (error) {
      showErrorModal('오류', '인증 처리 중 오류가 발생했습니다');
    }
  };

  const handleModalConfirm = () => {
    setShowModal(false);
  };

  if (loading) {
    return (
      <SafeLayout showHeader headerTitle="시리얼번호 등록">
        <Text style={styles.loadingText}>로딩 중...</Text>
      </SafeLayout>
    );
  }

  return (
    <SafeLayout showHeader headerTitle="시리얼번호 등록">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* 자녀 정보 카드 */}
        <View style={styles.childInfoCard}>
          <Image source={childAvatar} style={styles.avatarImage} />
          <View style={styles.childInfoText}>
            <Text style={styles.childName}>{childName}</Text>
            <Text style={styles.childGrade}>{childGrade}학년</Text>
          </View>
        </View>

        <Text style={styles.infoText}>이 자녀에게 시리얼번호를 등록합니다</Text>

        {/* 시리얼번호 입력 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>시리얼번호</Text>
          <TextInput
            style={[styles.input, isVerified && styles.inputDisabled]}
            value={serialDisplay}
            onChangeText={(text) => {
              const clean = text.toUpperCase().replace(/[^A-Z0-9-]/g, '').replace(/-/g, '');
              if (clean.length <= 10) {
                setSerialRaw(clean);
                setSerialDisplay(formatSerial(clean));
              }
            }}
            placeholder="0000-00-0000"
            placeholderTextColor="#999"
            maxLength={12}
            autoCapitalize="characters"
            editable={!isVerified}
          />
          <Text style={styles.charCount}>{serialRaw.length}/10</Text>
        </View>

        {/* 안내 박스 */}
        <View style={styles.guideBox}>
          <Text style={styles.guideText}>📖 배움달력 뒷면의 시리얼번호 10자리를 입력해주세요</Text>
          <Text style={styles.guideWarning}>⚠️ 시리얼 유효기간은 다음 해 2월 28일까지입니다.</Text>
        </View>

        {/* 등록 버튼 */}
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

      {/* 모달 */}
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

      <BottomTabBar />
    </SafeLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 24,
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
  // 모달 오버레이
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  // 태블릿 대응: 고정 280px → 화면 폭의 90%, 최대 400px
  modalBox: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
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
