import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import SafeLayout from '../../components/SafeLayout';
import BottomTabBar from '../../components/BottomTabBar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '@/utils/firebase';
import { doc, getDoc, updateDoc, deleteDoc, getDocs, collection } from 'firebase/firestore';

export default function SettingsDetailScreen() {
  const router = useRouter();
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [withdrawConfirmModalVisible, setWithdrawConfirmModalVisible] = useState(false);
  const [withdrawCompleteModalVisible, setWithdrawCompleteModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    console.log('=== 설정 화면 진입 ===');
  }, []);

  const handleLogout = () => {
    setLogoutModalVisible(true);
  };

  const confirmLogout = async () => {
    try {
      const keysToRemove = ['parentId', 'childId', 'childTier', 'childName', 'childAvatar', 'childGrade'];
      await AsyncStorage.multiRemove(keysToRemove);
      setLogoutModalVisible(false);
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('로그아웃 에러:', error);
    }
  };

  const handleWithdraw = () => {
    setWithdrawModalVisible(true);
  };

  const showWithdrawConfirm = () => {
    setWithdrawModalVisible(false);
    setWithdrawConfirmModalVisible(true);
  };

  const confirmWithdraw = async () => {
    setWithdrawConfirmModalVisible(false);
    try {
      const parentId = await AsyncStorage.getItem('parentId');
      const childId = await AsyncStorage.getItem('childId');

      if (!parentId || !childId) {
        setErrorMessage('계정 정보를 찾을 수 없습니다.');
        setErrorModalVisible(true);
        return;
      }

      const childDoc = await getDoc(doc(db, 'Parents', parentId, 'Children', childId));
      if (childDoc.exists()) {
        const childData = childDoc.data();
        const serialNumber = childData.serialNumber;
        if (serialNumber) {
          const now = new Date();
          const kstTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
          const withdrawnAt = kstTime.toISOString().replace('T', ' ').substring(0, 19);
          await updateDoc(doc(db, 'Serials', serialNumber), {
            usedBy: 'WITHDRAWN',
            withdrawnAt: withdrawnAt,
          });
        }
      }

      const recordsSnapshot = await getDocs(collection(db, 'Parents', parentId, 'Children', childId, 'Records'));
      for (const recordDoc of recordsSnapshot.docs) {
        await deleteDoc(recordDoc.ref);
      }

      await deleteDoc(doc(db, 'Parents', parentId, 'Children', childId));
      await deleteDoc(doc(db, 'Parents', parentId));
      await AsyncStorage.clear();
      setWithdrawCompleteModalVisible(true);
    } catch (error) {
      setErrorMessage('탈퇴 처리 중 문제가 발생했습니다.\n잠시 후 다시 시도해주세요.');
      setErrorModalVisible(true);
    }
  };

  const renderMenuItem = (
    label: string,
    onPress: () => void,
    textColor: string = '#333333',
    iconColor: string = '#999999'
  ) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <Text style={[styles.menuText, { color: textColor }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={20} color={iconColor} />
    </TouchableOpacity>
  );

  const renderDivider = () => <View style={styles.divider} />;

  return (
    <SafeLayout showHeader headerTitle="설정">
      <ScrollView>
        <Text style={styles.sectionHeader}>고객센터</Text>
        {renderMenuItem('자주 묻는 질문', () => console.log('FAQ 클릭'))}
        {renderDivider()}
        {renderMenuItem('1:1 문의 접수', () => console.log('문의 접수 클릭'))}
        {renderDivider()}
        {renderMenuItem('1:1 문의 내역 확인', () => console.log('문의 내역 클릭'))}

        <Text style={styles.sectionHeader}>알림</Text>
        {renderMenuItem('푸시 알림 설정', () => router.push('/settings/push-setting'))}

        <Text style={styles.sectionHeader}>약관 및 정책</Text>
        {renderMenuItem('이용약관', () => console.log('이용약관 클릭'))}
        {renderDivider()}
        {renderMenuItem('개인정보 처리방침', () => console.log('개인정보 처리방침 클릭'))}
        {renderDivider()}
        {renderMenuItem('운영정책', () => console.log('운영정책 클릭'))}

        <Text style={styles.sectionHeader}>앱 정보</Text>
        <View style={styles.menuItem}>
          <Text style={styles.menuText}>앱 버전</Text>
          <Text style={styles.versionText}>1.0.0</Text>
        </View>

        <View style={styles.accountSection}>
          <Text style={styles.withdrawWarning}>
            배움학습을 탈퇴하면 동일한 계정으로 재가입 및 접속이 불가능합니다.
          </Text>
          {renderMenuItem('회원탈퇴', handleWithdraw, '#FF4444', '#FF4444')}
        </View>

        <View style={styles.logoutSection}>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>로그아웃</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 로그아웃 모달 */}
      <Modal visible={logoutModalVisible} transparent animationType="fade" onRequestClose={() => setLogoutModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>로그아웃 하시겠습니까?</Text>
            <Text style={styles.modalSubtitle}>다시 로그인하면 학습 기록은 유지됩니다.</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={() => setLogoutModalVisible(false)}>
                <Text style={styles.modalCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmButton} onPress={confirmLogout}>
                <Text style={styles.modalConfirmText}>로그아웃</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 회원탈퇴 1차 모달 */}
      <Modal visible={withdrawModalVisible} transparent animationType="fade" onRequestClose={() => setWithdrawModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.warningIconContainer}>
              <Ionicons name="warning" size={40} color="#FF4444" />
            </View>
            <Text style={styles.modalTitleLarge}>정말 탈퇴하시겠습니까?</Text>
            <Text style={styles.withdrawWarningText}>
              탈퇴하면 아래 내용이 모두 삭제되며{'\n'}복구할 수 없습니다.{'\n\n'}
              • 자녀 프로필 및 학습 기록{'\n'}
              • 시리얼번호 영구 폐기{'\n'}
              • 동일 계정으로 재가입 불가
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={() => setWithdrawModalVisible(false)}>
                <Text style={styles.modalCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmButton} onPress={showWithdrawConfirm}>
                <Text style={styles.modalConfirmText}>탈퇴하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 회원탈퇴 2차 최종 확인 모달 */}
      <Modal visible={withdrawConfirmModalVisible} transparent animationType="fade" onRequestClose={() => setWithdrawConfirmModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalFinalConfirm}>
              마지막 확인입니다.{'\n'}정말 배움학습을 탈퇴하시겠습니까?
            </Text>
            <View style={styles.modalButtonsColumn}>
              <TouchableOpacity style={styles.modalStayButtonFull} onPress={() => setWithdrawConfirmModalVisible(false)}>
                <Text style={styles.modalStayTextFull}>아니요, 계속 이용할게요</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmButtonFull} onPress={confirmWithdraw}>
                <Text style={styles.modalConfirmTextFull}>네, 탈퇴합니다</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 탈퇴 완료 모달 */}
      <Modal visible={withdrawCompleteModalVisible} transparent animationType="fade" onRequestClose={() => { setWithdrawCompleteModalVisible(false); router.replace('/(auth)/login'); }}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalCompleteText}>
              탈퇴가 완료되었습니다.{'\n'}그동안 배움학습을 이용해주셔서{'\n'}감사합니다.
            </Text>
            <TouchableOpacity style={styles.modalSingleButton} onPress={() => { setWithdrawCompleteModalVisible(false); router.replace('/(auth)/login'); }}>
              <Text style={styles.modalSingleButtonText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 에러 모달 */}
      <Modal visible={errorModalVisible} transparent animationType="fade" onRequestClose={() => setErrorModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalCompleteText}>{errorMessage}</Text>
            <TouchableOpacity style={styles.modalSingleButton} onPress={() => setErrorModalVisible(false)}>
              <Text style={styles.modalSingleButtonText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <BottomTabBar />
    </SafeLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#444444',
    paddingLeft: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 52,
    paddingHorizontal: 16,
  },
  menuText: {
    fontSize: 15,
    color: '#333333',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 16,
  },
  versionText: {
    fontSize: 15,
    color: '#888888',
  },
  accountSection: {
    paddingTop: 30,
  },
  withdrawWarning: {
    fontSize: 13,
    color: '#999999',
    paddingHorizontal: 16,
    paddingBottom: 12,
    lineHeight: 18,
  },
  logoutSection: {
    paddingTop: 16,
    paddingBottom: 40,
  },
  logoutButton: {
    borderWidth: 1.5,
    borderColor: '#CCCCCC',
    borderRadius: 10,
    paddingVertical: 14,
    marginHorizontal: 16,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555555',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 40,
    width: '85%',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 20,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    paddingVertical: 12,
    marginRight: 8,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: '#FF4444',
    borderRadius: 10,
    paddingVertical: 12,
    marginLeft: 8,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  warningIconContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitleLarge: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  withdrawWarningText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 12,
  },
  modalFinalConfirm: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  modalStayButtonFull: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
  },
  modalStayTextFull: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  modalConfirmButtonFull: {
    backgroundColor: '#FF4444',
    borderRadius: 10,
    paddingVertical: 14,
    width: '100%',
    marginTop: 10,
    alignItems: 'center',
  },
  modalConfirmTextFull: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  modalCompleteText: {
    fontSize: 15,
    color: '#333',
    textAlign: 'center',
    lineHeight: 24,
  },
  modalSingleButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 20,
    alignItems: 'center',
  },
  modalSingleButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalButtonsColumn: {
    flexDirection: 'column',
    marginTop: 20,
  },
});
