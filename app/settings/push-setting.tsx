import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import SafeLayout from '../../components/SafeLayout';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/utils/firebase';

interface NotificationSettings {
  sound: string;
  payment: boolean;
  notice: boolean;
  study: boolean;
  marketing: boolean;
  nightMarketing: boolean;
}

export default function PushSettingScreen() {
  const [settings, setSettings] = useState<NotificationSettings>({
    sound: '소리',
    payment: true,
    notice: true,
    study: true,
    marketing: true,
    nightMarketing: false,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const parentId = await AsyncStorage.getItem('parentId');
      if (!parentId) return;

      const parentDoc = await getDoc(doc(db, 'Parents', parentId));
      if (parentDoc.exists()) {
        const data = parentDoc.data();
        if (data.notificationSettings) {
          setSettings(data.notificationSettings);
        }
      }
    } catch (error) {
      console.log('알림 설정 로드 에러:', error);
    }
  };

  const updateSetting = async (key: keyof NotificationSettings, value: boolean | string) => {
    try {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);

      const parentId = await AsyncStorage.getItem('parentId');
      if (!parentId) return;

      await updateDoc(doc(db, 'Parents', parentId), {
        notificationSettings: newSettings,
      });
    } catch (error) {
      console.log('알림 설정 업데이트 에러:', error);
    }
  };

  const renderToggleItem = (
    title: string,
    description: string,
    key: keyof NotificationSettings,
    value: boolean
  ) => (
    <View style={styles.toggleItem}>
      <View style={styles.toggleTextContainer}>
        <Text style={styles.toggleTitle}>{title}</Text>
        <Text style={styles.toggleDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={(val) => updateSetting(key, val)}
        trackColor={{ false: '#DDDDDD', true: '#7ED4C0' }}
        thumbColor="#FFFFFF"
      />
    </View>
  );

  const renderSoundItem = () => (
    <View style={styles.toggleItem}>
      <View style={styles.toggleTextContainer}>
        <Text style={styles.toggleTitle}>알림 설정</Text>
      </View>
      <Text style={styles.soundValue}>{settings.sound}</Text>
    </View>
  );

  const renderDivider = () => <View style={styles.divider} />;

  return (
    <SafeLayout showHeader headerTitle="알림 설정">
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* 섹션 1: 배움학습 알림 */}
        <Text style={styles.sectionHeader}>배움학습 알림</Text>
        {renderSoundItem()}
        {renderDivider()}
        {renderToggleItem('결제 알림', '결제 완료 및 구독 갱신 알림', 'payment', settings.payment)}
        {renderDivider()}
        {renderToggleItem('공지사항 알림', '새로운 공지사항 등록 시 알림', 'notice', settings.notice)}
        {renderDivider()}
        {renderToggleItem('학습 알림', '매일 학습 시간 리마인드 알림', 'study', settings.study)}

        {/* 섹션 2: 마케팅 알림 */}
        <Text style={styles.sectionHeader}>마케팅 알림</Text>
        {renderToggleItem(
          '이벤트/업데이트',
          '이벤트 및 업데이트 관련 마케팅 알림',
          'marketing',
          settings.marketing
        )}
        {renderDivider()}
        {renderToggleItem(
          '야간 마케팅 수신 동의',
          '오후 9시부터 오전 8시까지 전달되는 마케팅 알림',
          'nightMarketing',
          settings.nightMarketing
        )}

        {/* 하단 안내 문구 */}
        <View style={styles.noticeContainer}>
          <Text style={styles.noticeText}>
            기기 설정에서 알림이 꺼져 있으면 앱 내 설정과 관계없이{'\n'}알림이 수신되지 않습니다.
          </Text>
        </View>

      </ScrollView>
    </SafeLayout>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    fontSize: 13,
    color: '#999999',
    backgroundColor: '#F8F8F8',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  toggleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  toggleTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 13,
    color: '#999999',
  },
  soundValue: {
    fontSize: 16,
    color: '#333333',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 20,
  },
  noticeContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  noticeText: {
    fontSize: 13,
    color: '#999999',
    lineHeight: 20,
  },
});
