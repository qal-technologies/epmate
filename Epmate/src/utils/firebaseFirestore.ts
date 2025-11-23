// utils/firebase/firebaseFirestore.ts
import { getFirestore, collection, addDoc, doc, getDoc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { app } from './firebaseConfig';

const db = getFirestore(app);

type CollectionName = string;
type FirestoreData = Record<string, any>;

const firebaseFirestore = {
  addDocument: async <T extends FirestoreData>(
    collectionName: CollectionName,
    data: T
  ): Promise<void> => {
    await addDoc(collection(db, collectionName), data);
  },

  getDocument: async <T extends FirestoreData>(
    collectionName: CollectionName,
    docId: string
  ): Promise<T | null> => {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as T) : null;
  },

  updateDocument: async (
    collectionName: CollectionName,
    docId: string,
    data: Partial<FirestoreData>
  ): Promise<void> => {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, data);
  },

  deleteDocument: async (
    collectionName: CollectionName,
    docId: string
  ): Promise<void> => {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
  },

  getCollection: async <T extends FirestoreData>(
    collectionName: CollectionName
  ): Promise<T[]> => {
    const querySnapshot = await getDocs(collection(db, collectionName));
    return querySnapshot.docs.map(doc => doc.data() as T);
  },
};

export { firebaseFirestore, db };
