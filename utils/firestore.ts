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
export const createRecord = async (parentId: string, childId: string, data: {
  subject: string;
  grade: number;
  questionId: string;
  questionType: string;
  isCorrect: boolean;
  userAnswer: string;
  correctAnswer: string;
  solvedAt?: any;
}) => {
  const recordRef = doc(collection(db, 'Parents', parentId, 'Children', childId, 'Records'));
  await setDoc(recordRef, {
    ...data,
    solvedAt: Timestamp.now(),
    date: new Date().toISOString().split('T')[0],
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
