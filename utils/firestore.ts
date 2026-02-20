import { db, collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, addDoc, updateDoc, deleteDoc, Timestamp } from './firebase';

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
  serialNumber: string,
  serialExpiry: string
) => {
  await updateDoc(doc(db, 'Parents', parentId, 'Children', childId), {
    tier,
    serialNumber,
    serialExpiry,
  });
};
