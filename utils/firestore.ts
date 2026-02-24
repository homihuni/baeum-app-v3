import { db, collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, addDoc, updateDoc, deleteDoc, Timestamp, serverTimestamp } from './firebase';

// ===== PARENTS =====
export const createParent = async (parentId: string, data: {
  email: string;
  name: string;
  loginType: 'google' | 'apple';
  createdAt?: any;
}) => {
  await setDoc(doc(db, 'Parents', parentId), {
    ...data,
    tier: 'free',
    maxChildren: 1,
    createdAt: Timestamp.now(),
    lastLoginAt: Timestamp.now(),
  });
};

export const getParent = async (parentId: string) => {
  const snap = await getDoc(doc(db, 'Parents', parentId));
  return snap.exists() ? snap.data() : null;
};

export const updateParent = async (parentId: string, data: any) => {
  await updateDoc(doc(db, 'Parents', parentId), data);
};

// ===== CHILDREN =====
export const createChild = async (parentId: string, data: {
  name: string;
  birthDate: string;
  grade: number;
  gender: 'male' | 'female';
  avatar: string;
}) => {
  const childRef = doc(collection(db, 'Parents', parentId, 'Children'));
  await setDoc(childRef, {
    ...data,
    tier: 'free',
    serialCode: '',
    serialExpiry: null,
    subjects: data.grade <= 2 ? ['korean', 'math', 'integrated'] : ['korean', 'math', 'science', 'social', 'english'],
    questionsPerSubject: 3,
    createdAt: Timestamp.now(),
  });
  return childRef.id;
};

export const getChildren = async (parentId: string) => {
  const snap = await getDocs(collection(db, 'Parents', parentId, 'Children'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getChild = async (parentId: string, childId: string) => {
  const snap = await getDoc(doc(db, 'Parents', parentId, 'Children', childId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const updateChild = async (parentId: string, childId: string, data: any) => {
  await updateDoc(doc(db, 'Parents', parentId, 'Children', childId), data);
};

export const deleteChild = async (parentId: string, childId: string) => {
  const recordsSnap = await getDocs(collection(db, 'Parents', parentId, 'Children', childId, 'Records'));
  for (const recordDoc of recordsSnap.docs) {
    await deleteDoc(recordDoc.ref);
  }
  await deleteDoc(doc(db, 'Parents', parentId, 'Children', childId));
};

// ===== RECORDS =====
export const createRecord = async (parentId: string, childId: string, data: any) => {
  const recordRef = doc(collection(db, 'Parents', parentId, 'Children', childId, 'Records'));

  // data에 date가 있으면 그대로 사용, 없으면 KST 기준 생성
  let dateStr = data.date;
  if (!dateStr) {
    const now = new Date();
    const kstTime = now.getTime() + (9 * 60 * 60 * 1000);
    const kstDate = new Date(kstTime);
    dateStr = kstDate.getUTCFullYear() + '-' + String(kstDate.getUTCMonth() + 1).padStart(2, '0') + '-' + String(kstDate.getUTCDate()).padStart(2, '0');
  }

  console.log("=== createRecord 저장 date ===", dateStr);

  await setDoc(recordRef, {
    ...data,
    date: dateStr,
    solvedAt: Timestamp.now(),
  });
  return recordRef.id;
};

export const getRecordsByDate = async (parentId: string, childId: string, date: string) => {
  const q = query(
    collection(db, 'Parents', parentId, 'Children', childId, 'Records'),
    where('date', '==', date)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// ===== SERIALS =====
export const validateSerial = async (serialCode: string) => {
  const q = query(
    collection(db, 'Serials'),
    where('code', '==', serialCode),
    where('isUsed', '==', false)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const serialDoc = snap.docs[0];
  return { id: serialDoc.id, ...serialDoc.data() };
};

export const useSerial = async (serialId: string, parentId: string) => {
  await updateDoc(doc(db, 'Serials', serialId), {
    isUsed: true,
    usedBy: parentId,
    usedAt: Timestamp.now(),
  });
};

// ===== NOTICES =====
export const getNotices = async () => {
  const q = query(collection(db, 'Notices'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// ===== INQUIRIES =====
export const createInquiry = async (parentId: string, data: {
  title: string;
  content: string;
  category: string;
}) => {
  const ref = doc(collection(db, 'Inquiries'));
  await setDoc(ref, {
    ...data,
    parentId,
    status: 'pending',
    createdAt: Timestamp.now(),
  });
  return ref.id;
};

export const getInquiries = async (parentId: string) => {
  const q = query(
    collection(db, 'Inquiries'),
    where('parentId', '==', parentId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// ===== BANNERS =====
export const getBanners = async () => {
  const q = query(
    collection(db, 'Banners'),
    where('isActive', '==', true),
    orderBy('order')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// ===== SERIAL NUMBER =====
export const getSerialCode = async (code: string) => {
  const snap = await getDoc(doc(db, 'Serials', code));
  return snap.exists() ? snap.data() : null;
};

export const useSerialCode = async (code: string, childId: string) => {
  await updateDoc(doc(db, 'Serials', code), {
    isUsed: true,
    usedBy: childId,
  });
};

export const upgradeChildTier = async (
  parentId: string,
  childId: string,
  tier: string,
  serialCode: string,
  serialExpiry: string,
  serialCalendarYear: number
) => {
  await updateDoc(doc(db, 'Parents', parentId, 'Children', childId), {
    tier,
    serialCode,
    serialExpiry,
    serialCalendarYear,
    gradeChangeCount: 0,
    isLocked: false,
  });
};

// ===== SERIAL EXPIRY CHECK =====
/**
 * 시리얼 만료 체크 및 처리
 * 규칙:
 * - 배움/스카이 만료 시 → 잠금 처리 (무료 전환 아님)
 * - 단, 무료 자녀가 0명이면 → 만료된 자녀 중 1명만 무료 전환
 * - 무료는 항상 1명만 활성
 */
export async function checkSerialExpiry(parentId: string) {
  try {
    const childrenRef = collection(db, 'Parents', parentId, 'Children');
    const snap = await getDocs(childrenRef);

    const now = new Date();
    const expiredChildren: { id: string; name: string }[] = [];
    let freeCount = 0;
    let activeCount = 0;
    const allChildren: any[] = [];

    snap.forEach((childDoc) => {
      const data = childDoc.data();
      if (data.isDeleted === true) return;

      allChildren.push({ id: childDoc.id, ...data });

      if (data.tier === 'free' && data.isLocked !== true) {
        freeCount++;
      }

      if (data.tier === 'baeum' || data.tier === 'sky') {
        activeCount++;
        let isExpired = false;

        if (data.tier === 'baeum' && data.serialExpiry) {
          const expiryStr = String(data.serialExpiry);
          let expiryDate: Date;
          if (expiryStr.includes('-')) {
            expiryDate = new Date(expiryStr + 'T23:59:59');
          } else if (expiryStr.length === 8) {
            expiryDate = new Date(
              expiryStr.substring(0, 4) + '-' +
              expiryStr.substring(4, 6) + '-' +
              expiryStr.substring(6, 8) + 'T23:59:59'
            );
          } else {
            return;
          }
          if (now > expiryDate) {
            isExpired = true;
          }
        }

        if (isExpired) {
          expiredChildren.push({ id: childDoc.id, name: data.name || '자녀' });
        }
      }
    });

    // 만료된 자녀 처리
    for (const expired of expiredChildren) {
      if (freeCount === 0) {
        // 무료가 0명이면 첫 번째 만료 자녀를 무료로 전환
        await updateDoc(doc(db, 'Parents', parentId, 'Children', expired.id), {
          tier: 'free',
          isLocked: false,
          serialCode: '',
          serialExpiry: null,
          serialCalendarYear: null,
        });
        freeCount++;
        console.log(`${expired.name}: 무료 전환 (무료 자녀 없음)`);
      } else {
        // 무료가 이미 있으면 잠금 처리
        await updateDoc(doc(db, 'Parents', parentId, 'Children', expired.id), {
          tier: 'expired',
          isLocked: true,
          serialCode: '',
          serialExpiry: null,
          serialCalendarYear: null,
        });
        console.log(`${expired.name}: 잠금 처리`);
      }
    }

    return {
      expiredChildren: expiredChildren.map(c => c.name),
      hasExpired: expiredChildren.length > 0,
      freeCount,
      needsSelection: expiredChildren.length > 1 && freeCount === 0,
      expiredList: expiredChildren,
    };
  } catch (error) {
    console.log('시리얼 만료 체크 오류:', error);
    return {
      expiredChildren: [],
      hasExpired: false,
      freeCount: 0,
      needsSelection: false,
      expiredList: [],
    };
  }
}

export const lockExcessFreeChildren = async (parentId: string, selectedChildId: string) => {
  const childrenRef = collection(db, 'Parents', parentId, 'Children');
  const snap = await getDocs(childrenRef);

  for (const childDoc of snap.docs) {
    const childData = childDoc.data();

    if (childData.isDeleted === true) continue;

    if (childData.tier === 'free' && childDoc.id !== selectedChildId) {
      await updateDoc(doc(db, 'Parents', parentId, 'Children', childDoc.id), {
        isLocked: true,
        lockedAt: serverTimestamp(),
      });
    } else if (childDoc.id === selectedChildId) {
      await updateDoc(doc(db, 'Parents', parentId, 'Children', childDoc.id), {
        isLocked: false,
      });
    }
  }
};

export const unlockChild = async (parentId: string, childId: string) => {
  await updateDoc(doc(db, 'Parents', parentId, 'Children', childId), {
    isLocked: false,
    lockedAt: null,
  });
};
