import {
  collection,
  query,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CommTemplate } from '@/types';

const COLLECTION = 'commTemplates';

export async function fetchCommTemplates(): Promise<CommTemplate[]> {
  const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as unknown as CommTemplate));
}

export async function createCommTemplate(
  data: Omit<CommTemplate, 'id' | 'createdAt'>,
): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTION), {
    ...data,
    createdAt: Date.now(),
  });
  return docRef.id;
}

export async function updateCommTemplate(
  id: string,
  data: Partial<Omit<CommTemplate, 'id' | 'createdAt'>>,
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), data);
}

export async function deleteCommTemplate(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}
